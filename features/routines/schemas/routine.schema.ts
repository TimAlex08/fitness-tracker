import { z } from "zod"

export const createRoutineSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  sessionType: z.enum(["TRAINING", "MOBILITY", "REST", "DELOAD"]).default("TRAINING"),
  durationMin: z.number().int().min(1).max(240).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
})

export const updateRoutineSchema = createRoutineSchema.partial()

export const routineExerciseSchema = z.object({
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

export const replaceExercisesSchema = z.object({
  exercises: z.array(routineExerciseSchema),
})

export type CreateRoutineBody = z.infer<typeof createRoutineSchema>
export type UpdateRoutineBody = z.infer<typeof updateRoutineSchema>
export type RoutineExerciseBody = z.infer<typeof routineExerciseSchema>
