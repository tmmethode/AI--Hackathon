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

const AUTH_STORAGE_KEY = "umurava.auth";
const AUTH_SYNC_EVENT = "umurava-auth-changed";
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
  window.dispatchEvent(new Event(AUTH_SYNC_EVENT));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_SYNC_EVENT));
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
