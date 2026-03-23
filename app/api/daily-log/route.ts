import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      routineId,
      isFreeSession,
      status,
      startedAt,
      finishedAt,
      durationMin,
      overallRpe,
      energyLevel,
      sleepHours,
      sleepQuality,
      mood,
      bodyWeight,
      painLevel,
      painNotes,
      notes,
      watchHrAvg,
      watchHrMax,
      watchCalories,
      watchActiveMinutes,
      watchSpO2,
      watchStressScore,
      watchHrZones,
    } = body

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const existing = await prisma.dailyLog.findFirst({
      where: { date: { gte: start, lte: end } },
    })

    const data = {
      routineId: routineId ?? null,
      isFreeSession: isFreeSession ?? false,
      status: status ?? "PENDING",
      startedAt: startedAt ? new Date(startedAt) : undefined,
      finishedAt: finishedAt ? new Date(finishedAt) : undefined,
      durationMin: durationMin ?? undefined,
      overallRpe: overallRpe ?? undefined,
      energyLevel: energyLevel ?? undefined,
      sleepHours: sleepHours ?? undefined,
      sleepQuality: sleepQuality ?? undefined,
      mood: mood ?? undefined,
      bodyWeight: bodyWeight ?? undefined,
      painLevel: painLevel ?? undefined,
      painNotes: painNotes ?? undefined,
      notes: notes ?? undefined,
      watchHrAvg: watchHrAvg ?? undefined,
      watchHrMax: watchHrMax ?? undefined,
      watchCalories: watchCalories ?? undefined,
      watchActiveMinutes: watchActiveMinutes ?? undefined,
      watchSpO2: watchSpO2 ?? undefined,
      watchStressScore: watchStressScore ?? undefined,
      watchHrZones: watchHrZones
        ? JSON.stringify(watchHrZones)
        : undefined,
    }

    if (existing) {
      const updated = await prisma.dailyLog.update({
        where: { id: existing.id },
        data,
      })
      return NextResponse.json(updated)
    }

    const date = new Date()
    date.setHours(0, 0, 0, 0)

    const created = await prisma.dailyLog.create({
      data: { date, ...data },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("[POST /api/daily-log]", error)
    return NextResponse.json(
      { error: "Error saving daily log" },
      { status: 500 }
    )
  }
}
