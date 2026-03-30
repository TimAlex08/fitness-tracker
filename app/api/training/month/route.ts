import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"

const repo = new PrismaTrainingRepository()

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get("year")
  const monthParam = searchParams.get("month")

  const now = new Date()
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return apiError("Invalid year or month", 400)
  }

  const data = await repo.getMonthData(year, month, user.id)
  return NextResponse.json(data)
}
