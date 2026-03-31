import { prisma } from "@/lib/prisma"
import { calculateStreak } from "@/features/training/utils/training-grid"
import type { DayStatus } from "@/features/training/types/training.types"
import type {
  ProgressData,
  ProgressStats,
  WeeklyVolume,
  ExerciseProgression,
  WeeklyPain,
  PhaseInfo,
} from "../types/progress.types"
import type { ProgressRepository } from "./progress-repository"

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Repositorio ──────────────────────────────────────────────────────────────

export class PrismaProgressRepository implements ProgressRepository {
  async getProgressData(userId: string): Promise<ProgressData> {
    const [stats, weeklyVolume, exerciseProgressions, weeklyPain, phase] = await Promise.all([
      this.getStats(userId),
      this.getWeeklyVolume(userId, 8),
      this.getExerciseProgressions(userId, 5),
      this.getWeeklyPain(userId, 8),
      this.getActivePhase(userId),
    ])

    return { stats, weeklyVolume, exerciseProgressions, weeklyPain, phase }
  }

  // ─── Stats strip ───────────────────────────────────────────────────────────

  private async getStats(userId: string): Promise<ProgressStats> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [logs, rpeResult] = await Promise.all([
      prisma.dailyLog.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        select: { status: true, overallRpe: true },
      }),
      prisma.dailyLog.aggregate({
        where: {
          userId,
          status: "COMPLETED",
          overallRpe: { not: null },
          date: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        _avg: { overallRpe: true },
      }),
    ])

    const sessionsThisMonth = logs.filter((l) => l.status === "COMPLETED").length
    const adherencePercent = 0 // TODO(Plan F): Calculate from CalendarService

    // Streak
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    const yearLogs = await prisma.dailyLog.findMany({
      where: { userId, date: { gte: yearStart, lte: yearEnd } },
      select: { date: true, status: true },
    })

    const days = Array.from({ length: 365 }, (_, i) => {
      const d = new Date(now.getFullYear(), 0, i + 1)
      const dateStr = toDateString(d)
      const log = yearLogs.find((l) => toDateString(l.date) === dateStr)
      const status: DayStatus = log ? (log.status as DayStatus) : "PENDING"
      return { date: dateStr, status, isRest: status === "REST" }
    })

    const { current: streak } = calculateStreak(days)

    return {
      streak,
      sessionsThisMonth,
      adherencePercent: Math.min(adherencePercent, 100),
      avgRpe: rpeResult._avg.overallRpe ? Math.round(rpeResult._avg.overallRpe * 10) / 10 : null,
    }
  }

  // ─── Volumen semanal ───────────────────────────────────────────────────────

  private async getWeeklyVolume(userId: string, weeks: number): Promise<WeeklyVolume[]> {
    const now = new Date()
    const monday = getMondayOfWeek(now)
    const rangeStart = new Date(monday)
    rangeStart.setDate(monday.getDate() - (weeks - 1) * 7)

    const logs = await prisma.dailyLog.findMany({
      where: {
        userId,
        date: { gte: rangeStart },
        status: "COMPLETED",
      },
      include: {
        _count: { select: { exerciseLogs: true } },
        exerciseLogs: { select: { setsCompleted: true } },
      },
      orderBy: { date: "asc" },
    })

    const result: WeeklyVolume[] = []

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(rangeStart)
      weekStart.setDate(rangeStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const weekStartStr = toDateString(weekStart)
      const weekEndStr = toDateString(weekEnd)

      const weekLogs = logs.filter((l) => {
        const dateStr = toDateString(l.date)
        return dateStr >= weekStartStr && dateStr <= weekEndStr
      })

      const exercisesCompleted = weekLogs.reduce((sum, l) => sum + l._count.exerciseLogs, 0)
      const setsCompleted = weekLogs.reduce(
        (sum, l) => sum + l.exerciseLogs.reduce((s, el) => s + (el.setsCompleted ?? 0), 0),
        0
      )

      const weekNum = getWeekNumber(weekStart)
      result.push({
        weekLabel: `S${weekNum}`,
        weekStart: weekStartStr,
        exercisesCompleted,
        setsCompleted,
      })
    }

    return result
  }

  // ─── Progresión por ejercicio ──────────────────────────────────────────────

  private async getExerciseProgressions(
    userId: string,
    lastN: number
  ): Promise<ExerciseProgression[]> {
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    const logs = await prisma.exerciseLog.findMany({
      where: {
        dailyLog: {
          userId,
          date: { gte: eightWeeksAgo },
          status: "COMPLETED",
        },
        completed: true,
      },
      include: {
        exercise: { select: { id: true, name: true } },
        dailyLog: { select: { date: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    const byExercise = new Map<string, typeof logs>()
    for (const log of logs) {
      const key = log.exercise.id
      if (!byExercise.has(key)) byExercise.set(key, [])
      byExercise.get(key)!.push(log)
    }

    const progressions: ExerciseProgression[] = []
    for (const [exerciseId, exerciseLogs] of byExercise) {
      const uniqueDates = [...new Set(exerciseLogs.map((l) => toDateString(l.dailyLog!.date)))]
      if (uniqueDates.length < 2) continue

      const latestLogs = exerciseLogs.slice(0, lastN * 3)
      const byDate = new Map<string, (typeof logs)[0]>()
      for (const log of latestLogs) {
        const d = toDateString(log.dailyLog!.date)
        if (!byDate.has(d)) byDate.set(d, log)
      }

      const sessions = [...byDate.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, lastN)
        .map(([date, log]) => ({
          date,
          reps: typeof log.repsPerSet === 'string' ? JSON.parse(log.repsPerSet) : (log.repsPerSet || []),
          rpeActual: log.rpeActual,
          painDuring: log.painDuring,
          formQuality: log.formQuality,
        }))
        .reverse()

      progressions.push({
        exerciseId,
        exerciseName: exerciseLogs[0].exercise.name,
        sessions,
      })
    }

    return progressions.slice(0, 6)
  }

  // ─── Dolor semanal ─────────────────────────────────────────────────────────

  private async getWeeklyPain(userId: string, weeks: number): Promise<WeeklyPain[]> {
    const now = new Date()
    const monday = getMondayOfWeek(now)
    const rangeStart = new Date(monday)
    rangeStart.setDate(monday.getDate() - (weeks - 1) * 7)

    const logs = await prisma.dailyLog.findMany({
      where: { userId, date: { gte: rangeStart }, status: "COMPLETED" },
      select: { date: true, painLevel: true },
      orderBy: { date: "asc" },
    })

    const result: WeeklyPain[] = []
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(rangeStart)
      weekStart.setDate(rangeStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const weekStartStr = toDateString(weekStart)
      const weekEndStr = toDateString(weekEnd)

      const weekLogs = logs.filter((l) => {
        const d = toDateString(l.date)
        return d >= weekStartStr && d <= weekEndStr && l.painLevel !== null
      })

      const avgPain =
        weekLogs.length > 0
          ? Math.round(
              (weekLogs.reduce((s, l) => s + (l.painLevel ?? 0), 0) / weekLogs.length) * 10
            ) / 10
          : null

      result.push({ weekLabel: `S${getWeekNumber(weekStart)}`, avgPain })
    }

    return result
  }

  // ─── Fase activa ───────────────────────────────────────────────────────────

  private async getActivePhase(userId: string): Promise<PhaseInfo | null> {
    const collection = await prisma.collection.findFirst({
      where: { userId, isActive: true },
      include: {
        programs: {
          where: { isActive: true },
          take: 1,
        },
      },
    })

    const program = collection?.programs[0]
    if (!program) return null

    return {
      name: program.name,
      rpeTarget: program.rpeTarget || "—",
      weekStart: 1, // TODO(Plan F): Calculate from startDate
      weekEnd: 4,
    }
  }
}