/**
 * Repositorio de registro diario — DIP aplicado.
 * Las páginas y API routes importan estas funciones, no prisma directamente.
 */

import { prisma } from "@/src/lib/prisma"
import type {
  TodayResponse,
  RoutineWithExercises,
  DailyLogWithExercises,
} from "@/types"

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Nombre del día actual en inglés (minúscula) */
function getTodayName(): string {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]
  return dayNames[new Date().getDay()]
}

/** Rango de timestamps para el día actual */
function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Busca la rutina principal del día en el programa activo.
 * "Principal" = no es "daily" → Full Body A en L/M/V.
 */
export async function getTodayRoutine(): Promise<RoutineWithExercises | null> {
  const todayName = getTodayName()

  const program = await prisma.program.findFirst({
    where: { isActive: true },
    include: {
      phases: {
        orderBy: { order: "asc" },
        take: 1,
        include: {
          routines: {
            include: {
              exercises: {
                include: { exercise: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  })

  if (!program?.phases[0]) return null

  const routines = program.phases[0].routines

  return (
    routines.find((r) => {
      if (!r.dayOfWeek || r.dayOfWeek === "daily") return false
      return r.dayOfWeek
        .split(",")
        .map((d) => d.trim())
        .includes(todayName)
    }) ?? null
  )
}

/** Busca el DailyLog de hoy con sus ExerciseLogs. */
export async function getTodayDailyLog(): Promise<DailyLogWithExercises | null> {
  const { start, end } = getTodayRange()

  return prisma.dailyLog.findFirst({
    where: { date: { gte: start, lte: end } },
    include: {
      routine: true,
      exerciseLogs: {
        include: { exercise: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

/** Combina rutina + log diario para la página /today. */
export async function getTodayData(): Promise<TodayResponse> {
  const [routine, dailyLog] = await Promise.all([
    getTodayRoutine(),
    getTodayDailyLog(),
  ])

  return { routine, dailyLog, isFreeDay: !routine }
}
