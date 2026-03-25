import { NextRequest, NextResponse } from "next/server"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { createExerciseSchema } from "@/features/exercises/schemas/exercise.schema"
import type { MuscleGroup } from "@prisma/client"

const repo = new PrismaExerciseRepository()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const muscleGroup = searchParams.get("muscleGroup") as MuscleGroup | null
    const search = searchParams.get("q") ?? undefined

    const exercises = await repo.findAll({
      muscleGroup: muscleGroup ?? undefined,
      search,
    })

    return NextResponse.json(exercises)
  } catch (error) {
    console.error("[GET /api/exercises]", error)
    return NextResponse.json({ error: "Error fetching exercises" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createExerciseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const exercise = await repo.create(parsed.data)
    return NextResponse.json(exercise, { status: 201 })
  } catch (error: unknown) {
    console.error("[POST /api/exercises]", error)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un ejercicio con ese slug" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Error creando ejercicio" }, { status: 500 })
  }
}
