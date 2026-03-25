import { NextResponse } from "next/server"
import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"

const repo = new PrismaTrainingRepository()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get("year")

  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

  if (isNaN(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 })
  }

  const data = await repo.getYearData(year)
  return NextResponse.json(data)
}
