import { NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE = "session_token"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth")

  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
