import { z } from "zod"

const COMPLETION_STATUSES = ["PENDING", "COMPLETED", "PARTIAL", "SKIPPED"] as const

export const upsertDailyLogSchema = z.object({
  routineId: z.string().cuid().nullable().optional(),
  isFreeSession: z.boolean().optional(),
  status: z.enum(COMPLETION_STATUSES).optional(),
  startedAt: z.string().datetime({ offset: true }).optional(),
  finishedAt: z.string().datetime({ offset: true }).optional(),
  durationMin: z.number().int().min(0).max(600).optional(),
  overallRpe: z.number().min(1).max(10).optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.number().int().min(1).max(5).optional(),
  mood: z.number().int().min(1).max(10).optional(),
  bodyWeight: z.number().min(20).max(300).optional(),
  painLevel: z.number().int().min(0).max(10).optional(),
  painNotes: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  watchHrAvg: z.number().int().min(30).max(250).optional(),
  watchHrMax: z.number().int().min(30).max(250).optional(),
  watchCalories: z.number().int().min(0).max(5000).optional(),
  watchActiveMinutes: z.number().int().min(0).max(600).optional(),
  watchSpO2: z.number().min(70).max(100).optional(),
  watchStressScore: z.number().int().min(0).max(100).optional(),
  watchHrZones: z.array(z.number()).optional(),
})

export const upsertExerciseLogSchema = z.object({
  dailyLogId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  setsCompleted: z.number().int().min(0).max(20).optional(),
  repsPerSet: z.array(z.number().int().min(0).max(200)).optional(),
  durationSec: z.number().int().min(0).max(7200).optional(),
  rpeActual: z.number().min(1).max(10).optional(),
  painDuring: z.number().int().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
})

export const updateExerciseLogSchema = z.object({
  completed: z.boolean().optional(),
  setsCompleted: z.number().int().min(0).max(20).optional(),
  repsPerSet: z.array(z.number().int().min(0).max(200)).optional(),
  durationSec: z.number().int().min(0).max(7200).optional(),
  rpeActual: z.number().min(1).max(10).optional(),
  painDuring: z.number().int().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
})

export type UpsertDailyLogBody = z.infer<typeof upsertDailyLogSchema>
export type UpsertExerciseLogBody = z.infer<typeof upsertExerciseLogSchema>
export type UpdateExerciseLogBody = z.infer<typeof updateExerciseLogSchema>