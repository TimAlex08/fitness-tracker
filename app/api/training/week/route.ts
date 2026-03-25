import { NextResponse } from "next/server"
import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"

const repo = new PrismaTrainingRepository()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get("date")

  const date = dateParam ? new Date(dateParam) : new Date()

  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 })
  }

  const data = await repo.getWeekData(date)
  return NextResponse.json(data)
}
