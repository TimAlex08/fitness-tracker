import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { ExerciseHasLogsError } from "@/features/exercises/api/exercise-repository"
import { updateExerciseSchema } from "@/features/exercises/schemas/exercise.schema"
import { apiError } from "@/lib/api-error"

const repo = new PrismaExerciseRepository()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  try {
    const { id } = await params
    const exercise = await repo.findById(id)
    if (!exercise) return apiError("Ejercicio no encontrado", 404)
    return NextResponse.json(exercise)
  } catch (error) {
    console.error("[GET /api/exercises/[id]]", error)
    return apiError("Error fetching exercise", 500)
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateExerciseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const exercise = await repo.update(id, parsed.data)
    return NextResponse.json(exercise)
  } catch (error) {
    console.error("[PUT /api/exercises/[id]]", error)
    return apiError("Error updating exercise", 500)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  try {
    const { id } = await params
    await repo.delete(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ExerciseHasLogsError) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${error.logCount} registro(s). Elimina los registros primero.` },
        { status: 409 }
      )
    }
    console.error("[DELETE /api/exercises/[id]]", error)
    return apiError("Error deleting exercise", 500)
  }
}
