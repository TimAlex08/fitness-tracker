import { NextResponse } from "next/server"
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"
import { getSession } from "@/lib/auth"

const repo = new PrismaSessionRepository()

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const data = await repo.getTodayData(user.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/daily-log/today]", error)
    return NextResponse.json(
      { error: "Error fetching today data" },
      { status: 500 }
    )
  }
}
