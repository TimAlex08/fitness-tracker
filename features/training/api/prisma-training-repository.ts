// features/training/api/prisma-training-repository.ts
import { prisma } from "@/lib/prisma"
import { calculateStreak } from "../utils/training-grid"
import type {
  TrainingRepository,
} from "./training-repository"
import type { WeekData, WeekDay, MonthData, MonthDay, YearData, YearDay, DayStatus } from "../types/training.types"

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

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

function jsDayToWeekIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// This stub returns daily logs only (no scheduled routines from CalendarService).
// CalendarService integration happens in Plan B.

export class PrismaTrainingRepository implements TrainingRepository {
  async getWeekData(date: Date, userId: string): Promise<WeekData> {
    const monday = getMondayOfWeek(date)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId, date: { gte: monday, lte: sunday } },
      include: { routine: true, _count: { select: { exerciseLogs: true } } },
      orderBy: { date: "asc" },
    })

    const todayStr = toDateString(new Date())
    const days: WeekDay[] = []

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday)
      dayDate.setDate(monday.getDate() + i)
      const dateStr = toDateString(dayDate)
      const logsForDay = dailyLogs.filter((l) => toDateString(l.date) === dateStr)

      days.push({
        date: dateStr,
        dayOfWeek: jsDayToWeekIndex(dayDate.getDay()),
        isToday: dateStr === todayStr,
        isRest: logsForDay.length === 0,
        routine: null, // TODO(Plan B): CalendarService
        dailyLog: logsForDay[0] ? {
          status: logsForDay[0].status,
          rpeActual: logsForDay[0].overallRpe,
          durationMin: logsForDay[0].durationMin,
          exercisesCompleted: logsForDay[0]._count.exerciseLogs,
        } : null,
      })
    }

    return {
      weekNumber: getWeekNumber(monday),
      year: monday.getFullYear(),
      month: monday.toLocaleDateString("es-MX", { month: "long" }),
      days,
    }
  }

  async getMonthData(year: number, month: number, userId: string): Promise<MonthData> {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999)

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId, date: { gte: firstDay, lte: lastDay } },
      include: { routine: true },
      orderBy: { date: "asc" },
    })

    const todayStr = toDateString(new Date())
    const daysInMonth = lastDay.getDate()
    const days: MonthDay[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month - 1, d)
      const dateStr = toDateString(dayDate)
      const logsForDay = dailyLogs.filter((l) => toDateString(l.date) === dateStr)

      const status: DayStatus =
        logsForDay.length === 0
          ? "REST"
          : (logsForDay[0].status as DayStatus)

      days.push({
        date: dateStr,
        status,
        isRest: status === "REST",
      })
    }

    const pastDays = days.filter((d) => d.date <= todayStr)
    const completedDays = pastDays.filter((d) => d.status === "COMPLETED").length
    const { current: currentStreak } = calculateStreak(
      days.map((d) => ({ date: d.date, status: d.status, isRest: d.isRest }))
    )

    return {
      days,
      currentStreak,
      adherence:
        pastDays.length > 0 ? Math.round((completedDays / pastDays.length) * 100) : 0,
      completedDays,
      totalPastDays: pastDays.length,
    }
  }

  async getYearData(year: number, userId: string): Promise<YearData> {
    const firstDay = new Date(year, 0, 1)
    const lastDay = new Date(year, 11, 31, 23, 59, 59, 999)

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId, date: { gte: firstDay, lte: lastDay } },
      select: { date: true, status: true },
      orderBy: { date: "asc" },
    })

    const todayStr = toDateString(new Date())
    const daysInYear = isLeapYear(year) ? 366 : 365
    const days: YearDay[] = []

    for (let d = 0; d < daysInYear; d++) {
      const dayDate = new Date(year, 0, d + 1)
      const dateStr = toDateString(dayDate)
      const log = dailyLogs.find((l) => toDateString(l.date) === dateStr)
      days.push({ date: dateStr, status: (log?.status ?? "REST") as DayStatus, isRest: !log })
    }

    const totalSessions = days.filter(
      (d) => d.status === "COMPLETED" && d.date <= todayStr
    ).length
    const { current: currentStreak, max: maxStreak } = calculateStreak(
      days.map((d) => ({ date: d.date, status: d.status, isRest: d.isRest }))
    )

    return { days, summary: { totalSessions, currentStreak, maxStreak } }
  }
}