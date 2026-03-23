import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      dailyLogId,
      exerciseId,
      setsCompleted,
      repsPerSet,
      durationSec,
      rpeActual,
      painDuring,
      notes,
    } = body

    if (!dailyLogId || !exerciseId) {
      return NextResponse.json(
        { error: "dailyLogId and exerciseId son requeridos" },
        { status: 400 }
      )
    }

    const existing = await prisma.exerciseLog.findFirst({
      where: { dailyLogId, exerciseId },
    })

    const data = {
      completed: true,
      setsCompleted: setsCompleted ?? undefined,
      repsPerSet: Array.isArray(repsPerSet)
        ? JSON.stringify(repsPerSet)
        : undefined,
      durationSec: durationSec ?? undefined,
      rpeActual: rpeActual ?? undefined,
      painDuring: painDuring ?? undefined,
      notes: notes ?? undefined,
    }

    if (existing) {
      const updated = await prisma.exerciseLog.update({
        where: { id: existing.id },
        data,
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.exerciseLog.create({
      data: { dailyLogId, exerciseId, ...data },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("[POST /api/exercise-log]", error)
    return NextResponse.json(
      { error: "Error saving exercise log" },
      { status: 500 }
    )
  }
}
