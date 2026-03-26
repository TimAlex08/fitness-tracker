import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, createSession, sessionCookieOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json()

  if (!name || !email || !password || password.length < 8) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password) },
  })

  const token = await createSession(user.id)
  const response = NextResponse.json({ ok: true }, { status: 201 })
  response.cookies.set(sessionCookieOptions(token))
  return response
}
