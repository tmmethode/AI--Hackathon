import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_TOKEN_COOKIE_NAME,
  clearAuthRuntimeState,
  initializeAuthRuntimeState,
} from "@/lib/auth-session";

export type UserRole = "recruiter" | "admin" | "applicant";
export type ThemePreference = "light" | "dark" | "system";
export type LanguagePreference = "en" | "fr" | "rw";

export interface NotificationPreferences {
  screening: boolean;
  applicants: boolean;
  export: boolean;
  system: boolean;
}

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
  department?: string;
  location?: string;
  bio?: string;
  notificationPreferences?: NotificationPreferences;
  themePreference?: ThemePreference;
  languagePreference?: LanguagePreference;
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

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phoneNumber?: string;
}

export interface RegisterResult {
  token: string;
  user: AuthUser;
  message: string;
}

export interface UserListResult {
  users: AuthUser[];
  total: number;
  message: string;
}

export interface ProfileResult {
  user: AuthUser;
  message: string;
}

export interface UpdateProfilePayload {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  department?: string;
  location?: string;
  bio?: string;
  profilePicture?: string;
}

export interface UpdatePreferencesPayload {
  notificationPreferences: NotificationPreferences;
  themePreference: ThemePreference;
  languagePreference: LanguagePreference;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AdminUpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phoneNumber?: string;
  department?: string;
  location?: string;
  bio?: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
}

const AUTH_STORAGE_KEY = "umurava.auth";
export const AUTH_SYNC_EVENT = "umurava-auth-changed";
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

  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    clearAuthTokenCookie();
    return null;
  }

  if (!raw) {
    clearAuthTokenCookie();
    return null;
  }

  try {
    const session = JSON.parse(raw) as Partial<AuthSession>;

    if (!session.token || !session.user) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      clearAuthTokenCookie();
      return null;
    }

    const normalizedSession = {
      token: session.token,
      user: session.user as AuthUser,
    };

    ensureAuthTokenCookie(normalizedSession.token);
    initializeAuthRuntimeState();
    return normalizedSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    clearAuthTokenCookie();
    return null;
  }
}

function ensureAuthTokenCookie(token: string) {
  if (typeof document === "undefined") {
    return;
  }

  try {
    const encodedToken = encodeURIComponent(token);
    const expectedPrefix = `${AUTH_TOKEN_COOKIE_NAME}=`;
    const currentCookie = document.cookie
      .split("; ")
      .find((cookiePart) => cookiePart.startsWith(expectedPrefix))
      ?.slice(expectedPrefix.length);

    if (currentCookie === encodedToken) {
      return;
    }

    document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=${encodedToken}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // Ignore cookie-write failures (for strict privacy/browser policies).
  }
}

function clearAuthTokenCookie() {
  if (typeof document === "undefined") {
    return;
  }

  try {
    document.cookie = `${AUTH_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    // Ignore cookie-write failures (for strict privacy/browser policies).
  }
}

export function persistAuth(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage-write failures and still keep in-memory session flow alive.
  }
  ensureAuthTokenCookie(session.token);
  initializeAuthRuntimeState();
  try {
    window.dispatchEvent(new Event(AUTH_SYNC_EVENT));
  } catch {
    // Ignore event-dispatch failures.
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage-write failures.
  }
  clearAuthTokenCookie();
  clearAuthRuntimeState();
  try {
    window.dispatchEvent(new Event(AUTH_SYNC_EVENT));
  } catch {
    // Ignore event-dispatch failures.
  }
}

export async function refreshAuthToken(): Promise<AuthSession> {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("No active session available to refresh.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ userId: session.user._id }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { token?: string; user?: AuthUser; message?: string; error?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(payload?.message || payload?.error || "Session refresh failed.");
  }

  if (!payload?.token || !payload.user) {
    throw new Error("Session refresh failed. The server response was incomplete.");
  }

  const refreshed = {
    token: payload.token,
    user: payload.user,
  };

  persistAuth(refreshed);
  return refreshed;
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

export async function registerUser(payload: RegisterPayload): Promise<RegisterResult> {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("You must be signed in as an admin to register a new user.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | { token?: string; user?: AuthUser; message?: string; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(body?.message || body?.error || "Registration failed. Please try again.");
  }

  if (!body?.token || !body.user) {
    throw new Error("Registration failed. The server response was incomplete.");
  }

  return {
    token: body.token,
    user: body.user,
    message: body.message || "User registered successfully",
  };
}

export async function fetchProfile(): Promise<ProfileResult> {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("You must be signed in to load your profile.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { user?: AuthUser; message?: string; error?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(payload?.message || payload?.error || "Failed to load your profile.");
  }

  if (!payload?.user) {
    throw new Error("Failed to load your profile. The server response was incomplete.");
  }

  persistAuth({
    token: session.token,
    user: payload.user,
  });

  return {
    user: payload.user,
    message: payload.message || "Profile retrieved successfully",
  };
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<ProfileResult> {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("You must be signed in to update your profile.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | { user?: AuthUser; message?: string; error?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(body?.message || body?.error || "Failed to update your profile.");
  }

  if (!body?.user) {
    throw new Error("Failed to update your profile. The server response was incomplete.");
  }

  persistAuth({
    token: session.token,
    user: body.user,
  });

  return {
    user: body.user,
    message: body.message || "Profile updated successfully",
  };
}

export async function updatePreferences(payload: UpdatePreferencesPayload): Promise<ProfileResult> {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("You must be signed in to update your preferences.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/me/preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | { user?: AuthUser; message?: string; error?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(body?.message || body?.error || "Failed to update your preferences.");
  }

  if (!body?.user) {
    throw new Error("Failed to update your preferences. The server response was incomplete.");
  }

  persistAuth({
    token: session.token,
    user: body.user,
  });

  return {
    user: body.user,
    message: body.message || "Preferences updated successfully",
  };
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("You must be signed in to change your password.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/me/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(body?.message || body?.error || "Failed to update your password.");
  }

  return {
    message: body?.message || "Password updated successfully",
  };
}

export async function listUsers(): Promise<UserListResult> {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("You must be signed in as an admin to view workspace users.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/users`, {
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  });

  const body = (await response.json().catch(() => null)) as
    | { users?: AuthUser[]; total?: number; message?: string; error?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(body?.message || body?.error || "Failed to load workspace users.");
  }

  return {
    users: Array.isArray(body?.users) ? body.users : [],
    total: typeof body?.total === "number" ? body.total : Array.isArray(body?.users) ? body.users.length : 0,
    message: body?.message || "Users retrieved successfully",
  };
}

export async function updateManagedUser(id: string, payload: AdminUpdateUserPayload): Promise<ProfileResult> {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("You must be signed in as an admin to update a user.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | { user?: AuthUser; message?: string; error?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(body?.message || body?.error || "Failed to update this user.");
  }

  if (!body?.user) {
    throw new Error("Failed to update this user. The server response was incomplete.");
  }

  if (body.user._id === session.user._id) {
    persistAuth({
      token: session.token,
      user: body.user,
    });
  }

  return {
    user: body.user,
    message: body.message || "User updated successfully",
  };
}

export async function resetManagedUserPassword(id: string, newPassword: string): Promise<{ message: string }> {
  const session = getStoredAuth();

  if (!session?.token) {
    throw new Error("You must be signed in as an admin to reset a password.");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/users/${id}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ newPassword }),
  });

  const body = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
    }
    throw new Error(body?.message || body?.error || "Failed to reset this password.");
  }

  return {
    message: body?.message || "Password reset successfully",
  };
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  const atobFn = typeof globalThis.atob === "function" ? globalThis.atob : null;

  if (!atobFn) {
    throw new Error("Google login failed. Unable to decode the user profile.");
  }

  const binary = atobFn(`${normalized}${padding}`);

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
