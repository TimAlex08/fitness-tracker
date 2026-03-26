import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

async function requireAdmin() {
  const user = await getSession()
  if (!user || user.role !== "admin") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return user
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params

    if (id === admin.id) {
      return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    console.error("[DELETE /api/admin/users/[id]]", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}
