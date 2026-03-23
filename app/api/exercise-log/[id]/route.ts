import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      completed,
      setsCompleted,
      repsPerSet,
      durationSec,
      rpeActual,
      painDuring,
      notes,
    } = body

    const updated = await prisma.exerciseLog.update({
      where: { id },
      data: {
        completed: completed ?? true,
        setsCompleted: setsCompleted ?? undefined,
        repsPerSet: Array.isArray(repsPerSet)
          ? JSON.stringify(repsPerSet)
          : undefined,
        durationSec: durationSec ?? undefined,
        rpeActual: rpeActual ?? undefined,
        painDuring: painDuring ?? undefined,
        notes: notes ?? undefined,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PUT /api/exercise-log/[id]]", error)
    return NextResponse.json(
      { error: "Error updating exercise log" },
      { status: 500 }
    )
  }
}
