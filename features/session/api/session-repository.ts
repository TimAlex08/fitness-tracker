import type { DailyLog, ExerciseLog } from "@prisma/client"
import type { TodayResponse, RoutineWithExercises, DailyLogWithExercises } from "@/types"

export type UpsertDailyLogInput = {
  routineId?: string | null
  isFreeSession?: boolean
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
  watchHrZones?: unknown
}

export type UpsertExerciseLogInput = {
  dailyLogId: string
  exerciseId: string
  setsCompleted?: number
  repsPerSet?: number[]
  durationSec?: number
  rpeActual?: number
  painDuring?: number
  notes?: string
}

export type UpdateExerciseLogInput = {
  completed?: boolean
  setsCompleted?: number
  repsPerSet?: number[]
  durationSec?: number
  rpeActual?: number
  painDuring?: number
  notes?: string
}

export interface SessionRepository {
  getTodayRoutine(userId: string): Promise<RoutineWithExercises | null>
  getTodayLog(userId: string): Promise<DailyLogWithExercises | null>
  getTodayData(userId: string): Promise<TodayResponse>
  upsertTodayLog(userId: string, data: UpsertDailyLogInput): Promise<DailyLog>
  upsertExerciseLog(data: UpsertExerciseLogInput): Promise<ExerciseLog>
  updateExerciseLog(id: string, data: UpdateExerciseLogInput): Promise<ExerciseLog>
}
