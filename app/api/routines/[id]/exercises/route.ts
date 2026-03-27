import { NextRequest, NextResponse } from "next/server"
import { PrismaRoutineRepository } from "@/features/routines/api/prisma-routine-repository"
import { replaceExercisesSchema } from "@/features/routines/schemas/routine.schema"
import { getSession } from "@/lib/auth"

const repo = new PrismaRoutineRepository()

type Params = { params: Promise<{ id: string }> }

// PUT reemplaza todos los ejercicios de la rutina
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await params

    const body = await request.json()
    const parsed = replaceExercisesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await repo.replaceExercises(id, user.id, parsed.data.exercises)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[PUT /api/routines/[id]/exercises]", error)
    return NextResponse.json({ error: "Error guardando ejercicios" }, { status: 500 })
  }
}
