export type UserRole = "recruiter" | "admin" | "applicant";

export interface AuthUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  googleId?: string;
  isEmailVerified: boolean;
  profilePicture?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const AUTH_STORAGE_KEY = "umurava.auth";
const DEFAULT_APP_PATH = "/dashboard";

function normalizeApiUrl(url: string) {
  const trimmed = url.trim();

  if (/^\d+$/.test(trimmed)) {
    return `http://localhost:${trimmed}`;
  }

  if (trimmed.startsWith(":")) {
    return `http://localhost${trimmed}`;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return `http://${trimmed}`;
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getApiBaseUrl() {
  return normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000");
}

export function resolveSafeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath === "/login") {
    return DEFAULT_APP_PATH;
  }

  return nextPath;
}

export function getGoogleLoginUrl(nextPath?: string | null) {
  const url = new URL(`${getApiBaseUrl()}/auth/google`);
  url.searchParams.set("next", resolveSafeNextPath(nextPath));
  return url.toString();
}

export function getStoredAuth(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as Partial<AuthSession>;

    if (!session.token || !session.user) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return {
      token: session.token,
      user: session.user as AuthUser,
    };
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function persistAuth(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function login(credentials: LoginPayload): Promise<AuthSession> {
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const payload = (await response.json().catch(() => null)) as
    | { token?: string; user?: AuthUser; message?: string; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Login failed. Please try again.");
  }

  if (!payload?.token || !payload.user) {
    throw new Error("Login failed. The server response was incomplete.");
  }

  return {
    token: payload.token,
    user: payload.user,
  };
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = window.atob(`${normalized}${padding}`);

  return decodeURIComponent(
    Array.from(binary)
      .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("")
  );
}

export function parseGoogleCallbackSession(token: string | null, encodedUser: string | null): AuthSession {
  if (!token || !encodedUser) {
    throw new Error("Google login failed. Missing session details from the server.");
  }

  const user = JSON.parse(decodeBase64Url(encodedUser)) as AuthUser;

  if (!user?._id || !user.email) {
    throw new Error("Google login failed. The user profile returned by the server was incomplete.");
  }

  return { token, user };
}
