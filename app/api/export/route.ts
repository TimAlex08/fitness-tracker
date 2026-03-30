import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"

export async function GET() {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  const logs = await prisma.dailyLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    include: {
      routine: { select: { name: true } },
      exerciseLogs: {
        include: { exercise: { select: { name: true } } },
      },
    },
  })

  const rows: string[] = [
    "fecha,rutina,estado,rpe_global,energia,sueño_horas,peso_kg,dolor,ejercicio,series_completadas,reps_por_serie,rpe_ejercicio,calidad_forma,dolor_ejercicio,uso_regresion",
  ]

  for (const log of logs) {
    const base = [
      formatDate(log.date),
      csvEscape(log.routine?.name ?? ""),
      log.status,
      log.overallRpe ?? "",
      log.energyLevel ?? "",
      log.sleepHours ?? "",
      log.bodyWeight ?? "",
      log.painLevel ?? "",
    ]

    if (log.exerciseLogs.length === 0) {
      rows.push([...base, "", "", "", "", "", "", ""].join(","))
    } else {
      for (const el of log.exerciseLogs) {
        const reps = Array.isArray(el.repsPerSet) ? (el.repsPerSet as number[]).join("|") : ""
        rows.push(
          [
            ...base,
            csvEscape(el.exercise.name),
            el.setsCompleted ?? "",
            reps,
            el.rpeActual ?? "",
            el.formQuality ?? "",
            el.painDuring ?? "",
            el.usedRegression ? "1" : "0",
          ].join(",")
        )
      }
    }
  }

  const csv = rows.join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="entrenamiento-${toDateString(new Date())}.csv"`,
    },
  })
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
