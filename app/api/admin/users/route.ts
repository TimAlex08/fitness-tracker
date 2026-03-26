import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { getSession } from "@/lib/auth"

async function requireAdmin() {
  const user = await getSession()
  if (!user || user.role !== "admin") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return user
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const { name, email, password } = await request.json()

    if (!name || !email || !password || password.length < 8) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }

    await prisma.user.create({
      data: { name, email, password: await hashPassword(password), role: "admin" },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("[POST /api/admin/users]", error)
    return NextResponse.json({ error: "Error al crear admin" }, { status: 500 })
  }
}
