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

// ─── Routine Schema ───────────────────────────────────────────────────────────

export const createRoutineSchema = z.object({
  name: z.string().min(1).max(100),
  dayOfWeek: z.string().min(1), // comma separated e.g., "monday,wednesday"
  sessionType: z.enum(["TRAINING", "MOBILITY", "REST", "DELOAD"]).default("TRAINING"),
  durationMin: z.number().int().min(1).max(240).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  exercises: z.array(createRoutineExerciseSchema).min(1, "Una rutina debe tener al menos un ejercicio"),
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
  routines: z.array(createRoutineSchema).min(1, "Una fase debe tener al menos una rutina"),
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
