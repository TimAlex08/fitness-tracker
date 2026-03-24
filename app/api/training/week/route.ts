import { NextResponse } from "next/server"
import { getWeekData } from "@/lib/training"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get("date")

  const date = dateParam ? new Date(dateParam) : new Date()

  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 })
  }

  const data = await getWeekData(date)
  return NextResponse.json(data)
}
