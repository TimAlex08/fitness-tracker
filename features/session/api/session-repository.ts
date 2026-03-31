// features/session/api/session-repository.ts
import type { DailyLog, ExerciseLog } from "@prisma/client"
import type { TodayResponse, DailyLogWithExercises } from "@/types"

export interface UpsertDailyLogInput {
  routineId?: string | null
  source?: "SCHEDULED" | "AD_HOC"
  status?: string
  startedAt?: string
  finishedAt?: string
  durationMin?: number
  overallRpe?: number
  energyLevel?: number
  sleepHours?: number
  sleepQuality?: number
  mood?: number
  bodyWeight?: number
  painLevel?: number
  painNotes?: string
  notes?: string
  watchHrAvg?: number
  watchHrMax?: number
  watchCalories?: number
  watchActiveMinutes?: number
  watchSpO2?: number
  watchStressScore?: number
  watchHrZones?: number[]
}

export interface UpsertExerciseLogInput {
  dailyLogId: string
  exerciseId: string
  setsCompleted?: number
  repsPerSet?: number[]
  durationSec?: number
  rpeActual?: number
  painDuring?: number
  notes?: string
}

export interface UpdateExerciseLogInput {
  completed?: boolean
  setsCompleted?: number
  repsPerSet?: number[]
  durationSec?: number
  rpeActual?: number
  painDuring?: number
  notes?: string
}

export interface SessionRepository {
  getTodayData(userId: string): Promise<TodayResponse>
  getTodayLog(userId: string): Promise<DailyLogWithExercises | null>
  upsertTodayLog(userId: string, input: UpsertDailyLogInput): Promise<DailyLog>
  upsertExerciseLog(input: UpsertExerciseLogInput): Promise<ExerciseLog>
  updateExerciseLog(id: string, input: UpdateExerciseLogInput): Promise<ExerciseLog>
}