import { NextResponse } from "next/server"
import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"

const repo = new PrismaTrainingRepository()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get("year")
  const monthParam = searchParams.get("month")

  const now = new Date()
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 })
  }

  const data = await repo.getMonthData(year, month)
  return NextResponse.json(data)
}
