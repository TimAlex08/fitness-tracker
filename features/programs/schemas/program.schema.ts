import { z } from "zod"

// ─── Routine Exercise Schema ──────────────────────────────────────────────────

export const createRoutineExerciseSchema = z.object({
  exerciseId: z.string().cuid(),
  order: z.number().int().min(0),
  block: z.enum(["warmup", "main", "cooldown"]).default("main"),
  sets: z.number().int().min(1).max(20).nullable().optional(),
  reps: z.number().int().min(1).max(100).nullable().optional(),
  durationSec: z.number().int().min(1).max(3600).nullable().optional(),
  restSec: z.number().int().min(0).max(600).nullable().optional(),
  tempo: z.string().max(20).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

// ─── Routine Schema (global, independiente de programa) ──────────────────────

export const createRoutineSchema = z.object({
  name: z.string().min(1).max(100),
  sessionType: z.enum(["TRAINING", "MOBILITY", "REST", "DELOAD"]).default("TRAINING"),
  durationMin: z.number().int().min(1).max(240).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  exercises: z.array(createRoutineExerciseSchema).min(1, "Una rutina debe tener al menos un ejercicio"),
})

// ─── Exercise Override Schema ─────────────────────────────────────────────────

export const exerciseOverrideSchema = z.object({
  exerciseId: z.string().cuid(),
  sets: z.number().int().min(1).max(20).nullable().optional(),
  reps: z.number().int().min(1).max(100).nullable().optional(),
  durationSec: z.number().int().min(1).max(3600).nullable().optional(),
  restSec: z.number().int().min(0).max(600).nullable().optional(),
  tempo: z.string().max(20).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
})

// ─── Program Day Schema ───────────────────────────────────────────────────────

const DAY_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

export const createProgramDaySchema = z.object({
  routineId: z.string().cuid(),
  dayOfWeek: z.enum(DAY_OF_WEEK),
  weekNumber: z.number().int().min(1).nullable().optional(),
  overrides: z.array(exerciseOverrideSchema).optional(),
})

// ─── Phase Schema ─────────────────────────────────────────────────────────────

export const createPhaseSchema = z.object({
  name: z.string().min(1).max(100),
  order: z.number().int().min(0),
  weekStart: z.number().int().min(1),
  weekEnd: z.number().int().min(1),
  description: z.string().max(500).nullable().optional(),
  rpeTarget: z.string().max(50).nullable().optional(),
  tempoDefault: z.string().max(20).nullable().optional(),
  benchmarks: z.string().max(500).nullable().optional(),
  programDays: z.array(createProgramDaySchema).optional(),
})

// ─── Program Schema ───────────────────────────────────────────────────────────

export const createProgramSchema = z.object({
  name: z.string().min(3, "El nombre del programa debe tener al menos 3 caracteres").max(100),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().default(true),
  phases: z.array(createPhaseSchema).min(1, "El programa debe tener al menos una fase"),
})

export type CreateProgramBody = z.infer<typeof createProgramSchema>
export type CreatePhaseBody = z.infer<typeof createPhaseSchema>
export type CreateRoutineBody = z.infer<typeof createRoutineSchema>
export type CreateRoutineExerciseBody = z.infer<typeof createRoutineExerciseSchema>
export type CreateProgramDayBody = z.infer<typeof createProgramDaySchema>
export type ExerciseOverrideBody = z.infer<typeof exerciseOverrideSchema>
