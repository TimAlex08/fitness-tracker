import { NextResponse } from "next/server"
import { getYearData } from "@/lib/training"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get("year")

  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

  if (isNaN(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 })
  }

  const data = await getYearData(year)
  return NextResponse.json(data)
}
