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

  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

  if (isNaN(year)) {
    return apiError("Invalid year", 400)
  }

  const data = await repo.getYearData(year, user.id)
  return NextResponse.json(data)
}
