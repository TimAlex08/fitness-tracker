import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"

const repo = new PrismaTrainingRepository()

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get("date")

  const date = dateParam ? new Date(dateParam) : new Date()

  if (isNaN(date.getTime())) {
    return apiError("Invalid date", 400)
  }

  const data = await repo.getWeekData(date, user.id)
  return NextResponse.json(data)
}
