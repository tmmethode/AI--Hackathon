export const AUTH_TOKEN_COOKIE_NAME = "umurava.auth-token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const DEFAULT_APP_PATH = "/dashboard";

export function resolveSafeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath === "/login") {
    return DEFAULT_APP_PATH;
  }

  return nextPath;
}
