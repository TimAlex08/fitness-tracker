import { NextRequest, NextResponse } from "next/server"
import { PrismaRoutineRepository } from "@/features/routines/api/prisma-routine-repository"
import { updateRoutineSchema } from "@/features/routines/schemas/routine.schema"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"

const repo = new PrismaRoutineRepository()

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)
    const { id } = await params
    const routine = await repo.findById(id, user.id)
    if (!routine) return apiError("No encontrada", 404)
    return NextResponse.json(routine)
  } catch (error) {
    console.error("[GET /api/routines/[id]]", error)
    return apiError("Error obteniendo rutina", 500)
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)
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
    return apiError("Error actualizando rutina", 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)
    const { id } = await params
    await repo.delete(id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/routines/[id]]", error)
    return apiError("Error eliminando rutina", 500)
  }
}
