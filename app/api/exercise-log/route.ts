import { NextRequest, NextResponse } from "next/server"
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"
import { upsertExerciseLogSchema } from "@/features/session/schemas/session.schema"

const repo = new PrismaSessionRepository()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = upsertExerciseLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await repo.upsertExerciseLog(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("[POST /api/exercise-log]", error)
    return NextResponse.json(
      { error: "Error saving exercise log" },
      { status: 500 }
    )
  }
}
