/**
 * Repositorio de datos de entrenamiento — dashboard /training.
 * Provee datos para las vistas semanal, mensual y anual.
 */

import { prisma } from "@/src/lib/prisma"
import type {
  WeekDay,
  WeekData,
  MonthDay,
  MonthData,
  YearDay,
  YearData,
  DayStatus,
  HeatmapCell,
  HeatmapWeek,
} from "@/types/training"

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]

/** JS getDay() (0=Dom) → nombre en inglés */
function jsDayToName(jsDay: number): string {
  return DAY_NAMES[jsDay]
}

/** JS getDay() (0=Dom) → índice europeo (0=Lun, 6=Dom) */
function jsDayToWeekIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

/** Date → "YYYY-MM-DD" */
function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

/** Devuelve el lunes de la semana que contiene `date` */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

/** Número de semana ISO */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

// ─── Rutinas del programa activo ──────────────────────────────────────────────

interface RoutineEntry {
  id: string
  name: string
  dayOfWeek: string | null
  sessionType: string
  durationMin: number | null
  exerciseCount: number
  rpeTarget: string | null
}

async function getActiveRoutines(): Promise<RoutineEntry[]> {
  const program = await prisma.program.findFirst({
    where: { isActive: true },
    include: {
      phases: {
        orderBy: { order: "asc" },
        take: 1,
        include: {
          routines: {
            include: {
              _count: { select: { exercises: true } },
            },
          },
        },
      },
    },
  })

  if (!program?.phases[0]) return []

  const phase = program.phases[0]
  return phase.routines.map((r) => ({
    id: r.id,
    name: r.name,
    dayOfWeek: r.dayOfWeek,
    sessionType: r.sessionType,
    durationMin: r.durationMin,
    exerciseCount: r._count.exercises,
    rpeTarget: phase.rpeTarget,
  }))
}

/** Encuentra la rutina asignada para un día de la semana (JS getDay()) */
function routineForDay(routines: RoutineEntry[], jsDay: number): RoutineEntry | null {
  const dayName = jsDayToName(jsDay)
  return (
    routines.find((r) => {
      if (!r.dayOfWeek) return false
      if (r.dayOfWeek === "daily") return true
      return r.dayOfWeek
        .split(",")
        .map((d) => d.trim())
        .includes(dayName)
    }) ?? null
  )
}

// ─── Cálculo de racha ─────────────────────────────────────────────────────────

/**
 * Calcula racha actual y máxima.
 * Un día "bueno" es COMPLETED o isRest.
 * SKIPPED rompe la racha. PENDING no la afecta.
 */
export function calculateStreak(
  days: { date: string; status: DayStatus; isRest: boolean }[]
): { current: number; max: number } {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const todayStr = toDateString(new Date())

  // Racha máxima (todos los días históricos)
  let maxStreak = 0
  let run = 0
  for (const day of sorted) {
    if (day.date > todayStr) break
    if (day.status === "COMPLETED" || day.isRest) {
      run++
      maxStreak = Math.max(maxStreak, run)
    } else if (day.status === "SKIPPED") {
      run = 0
    }
  }

  // Racha actual (hacia atrás desde hoy)
  const pastDays = sorted.filter((d) => d.date <= todayStr).reverse()
  let currentStreak = 0
  for (const day of pastDays) {
    if (day.status === "COMPLETED" || day.isRest) {
      currentStreak++
    } else if (day.status === "SKIPPED") {
      break
    }
  }

  return { current: currentStreak, max: maxStreak }
}

// ─── getWeekData ──────────────────────────────────────────────────────────────

export async function getWeekData(date: Date): Promise<WeekData> {
  const monday = getMondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const [routines, dailyLogs] = await Promise.all([
    getActiveRoutines(),
    prisma.dailyLog.findMany({
      where: { date: { gte: monday, lte: sunday } },
      include: { _count: { select: { exerciseLogs: true } } },
      orderBy: { date: "asc" },
    }),
  ])

  const todayStr = toDateString(new Date())
  const days: WeekDay[] = []

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + i)
    const dateStr = toDateString(dayDate)
    const jsDay = dayDate.getDay()
    const routine = routineForDay(routines, jsDay)
    const log = dailyLogs.find((l) => toDateString(l.date) === dateStr) ?? null

    days.push({
      date: dateStr,
      dayOfWeek: jsDayToWeekIndex(jsDay),
      isToday: dateStr === todayStr,
      isRest: !routine,
      routine: routine
        ? {
            id: routine.id,
            name: routine.name,
            exerciseCount: routine.exerciseCount,
            estimatedDuration: routine.durationMin,
            rpeTarget: routine.rpeTarget,
            sessionType: routine.sessionType as never,
          }
        : null,
      dailyLog: log
        ? {
            status: log.status,
            rpeActual: log.overallRpe,
            durationMin: log.durationMin,
            exercisesCompleted: log._count.exerciseLogs,
          }
        : null,
    })
  }

  return {
    weekNumber: getWeekNumber(monday),
    year: monday.getFullYear(),
    month: monday.toLocaleDateString("es-MX", { month: "long" }),
    days,
  }
}

// ─── getMonthData ─────────────────────────────────────────────────────────────

export async function getMonthData(year: number, month: number): Promise<MonthData> {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0, 23, 59, 59, 999)

  const [routines, dailyLogs] = await Promise.all([
    getActiveRoutines(),
    prisma.dailyLog.findMany({
      where: { date: { gte: firstDay, lte: lastDay } },
      select: { date: true, status: true },
      orderBy: { date: "asc" },
    }),
  ])

  const todayStr = toDateString(new Date())
  const daysInMonth = lastDay.getDate()
  const days: MonthDay[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month - 1, d)
    const dateStr = toDateString(dayDate)
    const routine = routineForDay(routines, dayDate.getDay())
    const log = dailyLogs.find((l) => toDateString(l.date) === dateStr)

    let status: DayStatus
    if (!routine) {
      status = "REST"
    } else if (log) {
      status = log.status
    } else {
      status = "PENDING"
    }

    days.push({ date: dateStr, status, isRest: !routine })
  }

  const pastDays = days.filter((d) => d.date <= todayStr)
  const completedDays = pastDays.filter(
    (d) => d.status === "COMPLETED" || d.isRest
  ).length
  const totalPastDays = pastDays.length
  const adherence =
    totalPastDays > 0 ? Math.round((completedDays / totalPastDays) * 100) : 0

  const { current: currentStreak } = calculateStreak(days)

  return { days, currentStreak, adherence, completedDays, totalPastDays }
}

// ─── getYearData ──────────────────────────────────────────────────────────────

export async function getYearData(year: number): Promise<YearData> {
  const firstDay = new Date(year, 0, 1)
  const lastDay = new Date(year, 11, 31, 23, 59, 59, 999)

  const [routines, dailyLogs] = await Promise.all([
    getActiveRoutines(),
    prisma.dailyLog.findMany({
      where: { date: { gte: firstDay, lte: lastDay } },
      select: { date: true, status: true },
      orderBy: { date: "asc" },
    }),
  ])

  const todayStr = toDateString(new Date())
  const daysInYear = isLeapYear(year) ? 366 : 365
  const days: YearDay[] = []

  for (let d = 0; d < daysInYear; d++) {
    const dayDate = new Date(year, 0, d + 1)
    const dateStr = toDateString(dayDate)
    const routine = routineForDay(routines, dayDate.getDay())
    const log = dailyLogs.find((l) => toDateString(l.date) === dateStr)

    let status: DayStatus
    if (!routine) {
      status = "REST"
    } else if (log) {
      status = log.status
    } else {
      status = "PENDING"
    }

    days.push({ date: dateStr, status, isRest: !routine })
  }

  const totalSessions = days.filter(
    (d) => d.status === "COMPLETED" && d.date <= todayStr
  ).length
  const { current: currentStreak, max: maxStreak } = calculateStreak(days)

  return {
    days,
    summary: { totalSessions, currentStreak, maxStreak },
  }
}

// ─── buildYearGrid ────────────────────────────────────────────────────────────

/**
 * Convierte el array lineal de días en una matriz de semanas para el heatmap.
 * Cada semana tiene 7 celdas (Lun–Dom). Se añaden celdas vacías al inicio
 * para alinear el primer día del año con su día de semana correcto.
 */
export function buildYearGrid(days: YearDay[]): HeatmapWeek[] {
  if (days.length === 0) return []

  const firstDate = new Date(days[0].date)
  const startPadding = jsDayToWeekIndex(firstDate.getDay())

  const cells: HeatmapCell[] = []

  for (let i = 0; i < startPadding; i++) {
    cells.push({ date: null, status: null, isRest: false })
  }

  for (const day of days) {
    cells.push({ date: day.date, status: day.status, isRest: day.isRest })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, status: null, isRest: false })
  }

  const weeks: HeatmapWeek[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return weeks
}
