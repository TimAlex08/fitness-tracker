import { NextResponse } from "next/server"
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"

const repo = new PrismaSessionRepository()

export async function GET() {
  try {
    const data = await repo.getTodayData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/daily-log/today]", error)
    return NextResponse.json(
      { error: "Error fetching today data" },
      { status: 500 }
    )
  }
}
