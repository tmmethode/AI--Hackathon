export const AUTH_TOKEN_COOKIE_NAME = "umurava.auth-token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const DEFAULT_APP_PATH = "/dashboard";
export const AUTH_RUNTIME_STORAGE_KEY = "umurava.auth-runtime";
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const SESSION_WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000;
export const SESSION_ABSOLUTE_LIFETIME_MS = 8 * 60 * 60 * 1000;
export const SESSION_ACTIVITY_WRITE_THROTTLE_MS = 45 * 1000;

export interface AuthRuntimeState {
  sessionStartedAt: number;
  lastActivityAt: number;
  warningDismissedAt: number | null;
  lastRefreshAt: number;
}

export function resolveSafeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath === "/login") {
    return DEFAULT_APP_PATH;
  }

  return nextPath;
}

function sanitizeTimestamp(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getAuthRuntimeState(): AuthRuntimeState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_RUNTIME_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AuthRuntimeState>;
    const now = Date.now();
    const sessionStartedAt = sanitizeTimestamp(parsed.sessionStartedAt, now);
    const lastActivityAt = sanitizeTimestamp(parsed.lastActivityAt, sessionStartedAt);
    const warningDismissedAt = parsed.warningDismissedAt === null
      ? null
      : sanitizeTimestamp(parsed.warningDismissedAt, lastActivityAt);
    const lastRefreshAt = sanitizeTimestamp(parsed.lastRefreshAt, sessionStartedAt);

    return {
      sessionStartedAt,
      lastActivityAt,
      warningDismissedAt,
      lastRefreshAt,
    };
  } catch {
    return null;
  }
}

export function persistAuthRuntimeState(state: AuthRuntimeState) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_RUNTIME_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}

export function initializeAuthRuntimeState(now = Date.now()) {
  const existing = getAuthRuntimeState();

  if (existing) {
    persistAuthRuntimeState({
      ...existing,
      lastActivityAt: Math.max(existing.lastActivityAt, now),
    });
    return;
  }

  persistAuthRuntimeState({
    sessionStartedAt: now,
    lastActivityAt: now,
    warningDismissedAt: null,
    lastRefreshAt: now,
  });
}

export function clearAuthRuntimeState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_RUNTIME_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
