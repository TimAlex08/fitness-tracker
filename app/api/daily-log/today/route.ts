import { NextResponse } from "next/server"
import { getTodayData } from "@/lib/daily-log"

export async function GET() {
  try {
    const data = await getTodayData()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/daily-log/today]", error)
    return NextResponse.json(
      { error: "Error fetching today data" },
      { status: 500 }
    )
  }
}
