import { NextRequest, NextResponse } from "next/server"
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"
import { upsertDailyLogSchema } from "@/features/session/schemas/session.schema"
import { getSession } from "@/lib/auth"

const repo = new PrismaSessionRepository()

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = upsertDailyLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await repo.upsertTodayLog(user.id, parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("[POST /api/daily-log]", error)
    return NextResponse.json(
      { error: "Error saving daily log" },
      { status: 500 }
    )
  }
}
