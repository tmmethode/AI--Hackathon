import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME, DEFAULT_APP_PATH, resolveSafeNextPath } from "@/lib/auth-session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/jobs",
  "/shortlists",
  "/candidates",
  "/notifications",
  "/history",
  "/screening",
  "/settings",
  "/profile",
  "/ingest",
  "/exports",
  "/users",
  "/privacy",
  "/terms",
] as const;

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? DEFAULT_APP_PATH : "/login", request.url));
  }

  if (pathname === "/login") {
    if (!token) {
      return NextResponse.next();
    }

    const nextPath = resolveSafeNextPath(nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  if (!token && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
