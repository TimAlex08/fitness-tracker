import { NextRequest, NextResponse } from "next/server"
import { PrismaRoutineRepository } from "@/features/routines/api/prisma-routine-repository"
import { updateRoutineSchema } from "@/features/routines/schemas/routine.schema"
import { getSession } from "@/lib/auth"

const repo = new PrismaRoutineRepository()

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const routine = await repo.findById(id, user.id)
    if (!routine) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
    return NextResponse.json(routine)
  } catch (error) {
    console.error("[GET /api/routines/[id]]", error)
    return NextResponse.json({ error: "Error obteniendo rutina" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params

    const body = await request.json()
    const parsed = updateRoutineSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const routine = await repo.update(id, user.id, parsed.data)
    return NextResponse.json(routine)
  } catch (error) {
    console.error("[PATCH /api/routines/[id]]", error)
    return NextResponse.json({ error: "Error actualizando rutina" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    await repo.delete(id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/routines/[id]]", error)
    return NextResponse.json({ error: "Error eliminando rutina" }, { status: 500 })
  }
}
