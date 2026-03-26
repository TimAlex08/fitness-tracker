import { NextRequest, NextResponse } from "next/server"
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"
import { updateExerciseLogSchema } from "@/features/session/schemas/session.schema"
import { getSession } from "@/lib/auth"

const repo = new PrismaSessionRepository()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const parsed = updateExerciseLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await repo.updateExerciseLog(id, parsed.data)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PUT /api/exercise-log/[id]]", error)
    return NextResponse.json(
      { error: "Error updating exercise log" },
      { status: 500 }
    )
  }
}
