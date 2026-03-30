import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { createExerciseSchema } from "@/features/exercises/schemas/exercise.schema"
import { apiError } from "@/lib/api-error"
import type { MuscleGroup } from "@prisma/client"

const repo = new PrismaExerciseRepository()

export async function GET(request: NextRequest) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

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
    return apiError("Error fetching exercises", 500)
  }
}

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  try {
    const body = await request.json()
    const parsed = createExerciseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
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
      return apiError("Ya existe un ejercicio con ese slug", 409)
    }
    return apiError("Error creando ejercicio", 500)
  }
}
