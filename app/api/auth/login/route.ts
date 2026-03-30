import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, createSession, sessionCookieOptions } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return apiError("Demasiados intentos. Espera 1 minuto.", 429)
  }

  const { email, password } = await request.json()

  if (!email || !password) {
    return apiError("Email y contraseña requeridos", 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(password, user.password))) {
    return apiError("Credenciales incorrectas", 401)
  }

  const token = await createSession(user.id)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookieOptions(token))
  return response
}
