import express, { type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { RegisterRoutes } from "./generated/routes";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import passport from "./config/passport";
import { authenticateToken } from "./middleware/auth";

dotenv.config();

const app = express();

let databaseConnected = false;
let databaseError: any = null;

connectDatabase().then((result) => {
  databaseConnected = result.success;
  if (!result.success) {
    databaseError = result.error;
  }
});

const allowedOrigins = ["http://localhost:5000","http://localhost:3000", "capacitor://localhost", "http://localhost:8080"];

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposedHeaders: ['set-cookie']
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(morgan('combined'));

app.get('/', (req: Request, res: Response) => {
  if (!databaseConnected) {
    return res.status(503).json({
      error: 'Failed to connect to database',
      message: 'Database connection failed during startup',
      details: databaseError?.message || 'Unknown database error',
      timestamp: new Date().toISOString()
    });
  }
  
  res.redirect('/docs');
});

// Apply authentication middleware to protected auth endpoints
app.use('/auth/me', authenticateToken);
app.use('/auth/refresh', authenticateToken);

// Authentication routes are handled by TSOA generated routes
// Note: Authentication is handled per-endpoint in controllers

// TSOA generated routes
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

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

export default app;
