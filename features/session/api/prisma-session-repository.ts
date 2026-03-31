// features/session/api/prisma-session-repository.ts
import { prisma } from "@/lib/prisma"
import type { DailyLog, ExerciseLog, CompletionStatus } from "@prisma/client"
import type { TodayResponse, DailyLogWithExercises } from "@/types"
import type {
  SessionRepository,
  UpsertDailyLogInput,
  UpsertExerciseLogInput,
  UpdateExerciseLogInput,
} from "./session-repository"
import { parseRepsPerSet, serializeRepsPerSet } from "@/features/session/services/session.service"

function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export class PrismaSessionRepository implements SessionRepository {
  async getTodayData(userId: string): Promise<TodayResponse> {
    const dailyLogs = await this.getTodayLogs(userId)
    // TODO(Plan B): wire CalendarService here
    return { entries: [], dailyLogs, isRestDay: true }
  }

  async getTodayLog(userId: string): Promise<DailyLogWithExercises | null> {
    const logs = await this.getTodayLogs(userId)
    return logs[0] ?? null
  }

  private async getTodayLogs(userId: string): Promise<DailyLogWithExercises[]> {
    const { start, end } = getTodayRange()
    return prisma.dailyLog.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: {
        routine: true,
        exerciseLogs: {
          include: { exercise: true },
          orderBy: { createdAt: "asc" },
        },
      },
    })
  }

  async upsertTodayLog(userId: string, input: UpsertDailyLogInput): Promise<DailyLog> {
    const { start, end } = getTodayRange()
    const existing = await prisma.dailyLog.findFirst({
      where: { userId, date: { gte: start, lte: end }, routineId: input.routineId ?? null },
    })

    const data = {
      routineId: input.routineId ?? null,
      source: (input.source ?? "SCHEDULED") as "SCHEDULED" | "AD_HOC",
      status: (input.status ?? "PENDING") as CompletionStatus,
      startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
      finishedAt: input.finishedAt ? new Date(input.finishedAt) : undefined,
      durationMin: input.durationMin ?? undefined,
      overallRpe: input.overallRpe ?? undefined,
      energyLevel: input.energyLevel ?? undefined,
      sleepHours: input.sleepHours ?? undefined,
      sleepQuality: input.sleepQuality ?? undefined,
      mood: input.mood ?? undefined,
      bodyWeight: input.bodyWeight ?? undefined,
      painLevel: input.painLevel ?? undefined,
      painNotes: input.painNotes ?? undefined,
      notes: input.notes ?? undefined,
      watchHrAvg: input.watchHrAvg ?? undefined,
      watchHrMax: input.watchHrMax ?? undefined,
      watchCalories: input.watchCalories ?? undefined,
      watchActiveMinutes: input.watchActiveMinutes ?? undefined,
      watchSpO2: input.watchSpO2 ?? undefined,
      watchStressScore: input.watchStressScore ?? undefined,
      watchHrZones: input.watchHrZones ? JSON.stringify(input.watchHrZones) : undefined,
    }

    if (existing) {
      return prisma.dailyLog.update({ where: { id: existing.id }, data })
    }

    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return prisma.dailyLog.create({ data: { userId, date, ...data } })
  }

  async upsertExerciseLog(input: UpsertExerciseLogInput): Promise<ExerciseLog> {
    const existing = await prisma.exerciseLog.findFirst({
      where: { dailyLogId: input.dailyLogId, exerciseId: input.exerciseId },
    })

    const data = {
      completed: true,
      setsCompleted: input.setsCompleted ?? undefined,
      repsPerSet: Array.isArray(input.repsPerSet) ? serializeRepsPerSet(input.repsPerSet) : undefined,
      durationSec: input.durationSec ?? undefined,
      rpeActual: input.rpeActual ?? undefined,
      painDuring: input.painDuring ?? undefined,
      notes: input.notes ?? undefined,
    }

    if (existing) {
      return prisma.exerciseLog.update({ where: { id: existing.id }, data })
    }

    return prisma.exerciseLog.create({
      data: { dailyLogId: input.dailyLogId, exerciseId: input.exerciseId, ...data },
    })
  }

  async updateExerciseLog(id: string, input: UpdateExerciseLogInput): Promise<ExerciseLog> {
    return prisma.exerciseLog.update({
      where: { id },
      data: {
        completed: input.completed ?? true,
        setsCompleted: input.setsCompleted ?? undefined,
        repsPerSet: Array.isArray(input.repsPerSet) ? serializeRepsPerSet(input.repsPerSet) : undefined,
        durationSec: input.durationSec ?? undefined,
        rpeActual: input.rpeActual ?? undefined,
        painDuring: input.painDuring ?? undefined,
        notes: input.notes ?? undefined,
      },
    })
  }
}