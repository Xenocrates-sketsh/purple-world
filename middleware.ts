import { NextRequest, NextResponse } from "next/server";

function decodeRoles(cookie: string | undefined): string[] {
  if (!cookie) return [];
  try {
    const part = cookie.split(".")[1];
    if (!part) return [];
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const json = JSON.parse(atob(padded));
    return json.app_metadata?.roles ?? [];
  } catch {
    return [];
  }
}

const PUBLIC_PATHS = ["/", "/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get("nf_jwt")?.value;
  const roles = decodeRoles(cookie);
  const isAuthed = Boolean(cookie) && roles.length > 0;
  const role = roles.includes("teacher")
    ? "teacher"
    : roles.includes("student")
      ? "student"
      : null;

  if (pathname.startsWith("/teacher")) {
    if (role !== "teacher") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/student")) {
    if (role !== "student") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isAuthed && PUBLIC_PATHS.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = role === "teacher" ? "/teacher" : "/student";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets, API routes, and the netlify
     * platform paths. API routes enforce their own server-side auth.
     */
    "/((?!_next|api|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$).*)",
  ],
};
