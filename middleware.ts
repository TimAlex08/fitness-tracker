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

  // Eliminamos la redirección automática de login -> / para evitar bucles si el token es inválido en DB.
  // La lógica de "ya logueado" se puede manejar en el cliente o con verificaciones más robustas.

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
