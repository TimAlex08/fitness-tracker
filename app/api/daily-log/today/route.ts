import { NextResponse } from "next/server"
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"

const repo = new PrismaSessionRepository()

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    const data = await repo.getTodayData(user.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/daily-log/today]", error)
    return apiError("Error fetching today data", 500)
  }
}
