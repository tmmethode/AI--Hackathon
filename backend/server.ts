import express, { type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { RegisterRoutes } from "./generated/routes";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { connectDatabase } from "./config/database";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import jwt from "jsonwebtoken";
import passport, { hasGoogleOAuthConfig } from "./config/passport";
import { authenticateToken } from "./middleware/auth";
import type { IUser } from "./models/User";
import { geminiAsyncScreeningRunService } from "./gemini/async-screening-runner";
import { HttpError } from "./utils/HttpError";

const envCandidates = [
  path.resolve(process.cwd(), "backend/.env"),
  path.resolve(process.cwd(), ".env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const app = express();

function getFrontendBaseUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
}

function resolveSafeNextPath(nextPath: unknown) {
  if (typeof nextPath !== "string" || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath === "/login") {
    return "/dashboard";
  }

  return nextPath;
}

function encodeUser(user: IUser) {
  return Buffer.from(
    JSON.stringify({
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      googleId: user.googleId,
      isEmailVerified: user.isEmailVerified,
      profilePicture: user.profilePicture,
      phoneNumber: user.phoneNumber,
      department: user.department,
      location: user.location,
      bio: user.bio,
      notificationPreferences: user.notificationPreferences,
      themePreference: user.themePreference,
      languagePreference: user.languagePreference,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }),
    "utf8"
  ).toString("base64url");
}

function createAuthToken(userId: string) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
  );
}

type ErrorWithStatus = {
  status: number;
  name?: string;
  message?: string;
};

function hasStatus(error: unknown): error is ErrorWithStatus {
  return typeof error === "object" && error !== null && "status" in error && typeof (error as { status?: unknown }).status === "number";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  return fallback;
}

function redirectToFrontendLogin(res: Response, message: string, nextPath?: unknown) {
  const redirectUrl = new URL("/login", getFrontendBaseUrl());
  redirectUrl.searchParams.set("error", message);
  redirectUrl.searchParams.set("next", resolveSafeNextPath(nextPath));
  res.redirect(redirectUrl.toString());
}

function redirectToFrontendGoogleCallback(res: Response, user: IUser, nextPath?: unknown) {
  const redirectUrl = new URL("/auth/google/callback", getFrontendBaseUrl());
  redirectUrl.searchParams.set("token", createAuthToken(user._id.toString()));
  redirectUrl.searchParams.set("user", encodeUser(user));
  redirectUrl.searchParams.set("next", resolveSafeNextPath(nextPath));
  res.redirect(redirectUrl.toString());
}

let databaseConnected = false;
let databaseError: unknown = null;

connectDatabase().then((result) => {
  databaseConnected = result.success;
  if (!result.success) {
    databaseError = result.error;
    return;
  }

  void geminiAsyncScreeningRunService.resumePendingRuns().catch((error) => {
    console.error("Failed to resume pending screening runs:", error);
  });
});

const allowedOrigins = Array.from(
  new Set(["http://localhost:5000", "http://localhost:3000", "capacitor://localhost", "http://localhost:8080", getFrontendBaseUrl()])
);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['set-cookie']
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(morgan('combined'));

app.get('/', (req: Request, res: Response) => {
  if (!databaseConnected) {
    return res.status(503).json({
      error: 'Failed to connect to database',
      message: 'Database connection failed during startup',
      details: getErrorMessage(databaseError, 'Unknown database error'),
      timestamp: new Date().toISOString()
    });
  }
  
  res.redirect('/docs');
});

app.use('/auth/me', authenticateToken);
app.use('/auth/refresh', authenticateToken);

app.get("/auth/google", (req, res, next) => {
  if (!hasGoogleOAuthConfig) {
    redirectToFrontendLogin(res, "Google sign-in is not configured on the backend yet.", req.query.next);
    return;
  }

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: resolveSafeNextPath(req.query.next),
  })(req, res, next);
});

app.get("/auth/google/callback", (req, res, next) => {
  if (!hasGoogleOAuthConfig) {
    redirectToFrontendLogin(res, "Google sign-in is not configured on the backend yet.", req.query.state);
    return;
  }

  passport.authenticate("google", { session: false }, (error: unknown, user: IUser | false, info?: { message?: string }) => {
    if (error) {
      redirectToFrontendLogin(
        res,
        error instanceof Error ? error.message : "Google sign-in failed. Please try again.",
        req.query.state
      );
      return;
    }

    if (!user) {
      redirectToFrontendLogin(
        res,
        info?.message || "Google sign-in failed. Please try again.",
        req.query.state
      );
      return;
    }

    redirectToFrontendGoogleCallback(res, user, req.query.state);
  })(req, res, next);
});

RegisterRoutes(app);

import swaggerDocument from "./docs/swagger.json";
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

app.use((err: unknown, req: Request, res: Response, _next: unknown) => {
  if (err instanceof HttpError || hasStatus(err)) {
    return res.status(err.status).json({
      error: (typeof err.name === "string" ? err.name : 'Error'),
      message: getErrorMessage(err, 'Unexpected error'),
      timestamp: new Date().toISOString()
    });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

export default app;
