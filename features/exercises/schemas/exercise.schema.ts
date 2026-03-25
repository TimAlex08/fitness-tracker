import { z } from "zod"

const MUSCLE_GROUPS = ["CHEST", "BACK", "LEGS", "SHOULDERS", "CORE", "MOBILITY", "FULL_BODY"] as const
const MOVEMENT_TYPES = ["PUSH", "PULL", "SQUAT", "HINGE", "CARRY", "ISOMETRIC", "MOBILITY", "ACTIVATION"] as const
const CATEGORIES = ["STANDARD", "REGRESSION", "PROGRESSION", "PREHAB", "WARMUP", "COOLDOWN"] as const
const JOINT_STRESS = ["NONE", "LOW", "MODERATE", "HIGH"] as const

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  muscleGroup: z.enum(MUSCLE_GROUPS),
  movementType: z.enum(MOVEMENT_TYPES),
  category: z.enum(CATEGORIES),
  difficulty: z.number().int().min(1).max(10).optional(),
  parentId: z.string().cuid().nullable().optional(),
  defaultSets: z.number().int().min(1).max(20).nullable().optional(),
  defaultReps: z.number().int().min(1).max(100).nullable().optional(),
  defaultDurationSec: z.number().int().min(1).max(3600).nullable().optional(),
  defaultRestSec: z.number().int().min(0).max(600).optional(),
  defaultTempo: z.string().max(20).nullable().optional(),
  defaultRpe: z.number().min(1).max(10).nullable().optional(),
  jointStress: z.enum(JOINT_STRESS).optional(),
  targetJoints: z.string().max(200).nullable().optional(),
  contraindications: z.string().max(500).nullable().optional(),
  safetyNotes: z.string().max(500).nullable().optional(),
  bodyweightPercent: z.number().min(0).max(200).nullable().optional(),
})

export const updateExerciseSchema = createExerciseSchema.partial()

export type CreateExerciseBody = z.infer<typeof createExerciseSchema>
export type UpdateExerciseBody = z.infer<typeof updateExerciseSchema>
