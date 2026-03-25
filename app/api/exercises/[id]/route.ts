import { NextRequest, NextResponse } from "next/server"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { ExerciseHasLogsError } from "@/features/exercises/api/exercise-repository"
import { updateExerciseSchema } from "@/features/exercises/schemas/exercise.schema"

const repo = new PrismaExerciseRepository()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const exercise = await repo.findById(id)

    if (!exercise) {
      return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 })
    }

    return NextResponse.json(exercise)
  } catch (error) {
    console.error("[GET /api/exercises/[id]]", error)
    return NextResponse.json({ error: "Error fetching exercise" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateExerciseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const exercise = await repo.update(id, parsed.data)
    return NextResponse.json(exercise)
  } catch (error) {
    console.error("[PUT /api/exercises/[id]]", error)
    return NextResponse.json({ error: "Error updating exercise" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    await repo.delete(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ExerciseHasLogsError) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: tiene ${error.logCount} registro(s) de sesiones. Elimina los registros primero.`,
        },
        { status: 409 }
      )
    }
    console.error("[DELETE /api/exercises/[id]]", error)
    return NextResponse.json({ error: "Error deleting exercise" }, { status: 500 })
  }
}
