import type { Exercise, Prisma } from "@prisma/client"
import type { ExerciseCardData } from "@/features/exercises/types/exercise.types"

export type ExerciseSort = "name_asc" | "name_desc" | "date_desc" | "date_asc"

export type ExerciseFilters = {
  muscleGroup?: string
  search?: string
  sort?: ExerciseSort
}

export type CreateExerciseInput = {
  name: string
  slug?: string
  description?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  muscleGroup: string
  movementType: string
  category: string
  difficulty?: number
  // parentId?: string | null // Removed in Plan A
  familyId?: string | null
  familyLevel?: number | null
  familyRole?: "MAIN_PATH" | "VARIANT" | null
  defaultSets?: number | null
  defaultReps?: number | null
  defaultDurationSec?: number | null
  defaultRestSec?: number
  defaultTempo?: string | null
  defaultRpe?: number | null
  jointStress?: string
  targetJoints?: string | null
  contraindications?: string | null
  safetyNotes?: string | null
  bodyweightPercent?: number | null
}

export type UpdateExerciseInput = Partial<CreateExerciseInput>

export type ExerciseWithDetails = Prisma.ExerciseGetPayload<{
  include: {
    // parent: true // Removed in Plan A
    // variants: { orderBy: { difficulty: "asc" } } // Removed in Plan A
    family: true
    exerciseLogs: {
      take: 8
      orderBy: { createdAt: "desc" }
      include: {
        dailyLog: {
          select: {
            date: true
            routine: { select: { name: true } }
          }
        }
      }
    }
  }
}>

export class ExerciseHasLogsError extends Error {
  constructor(public readonly logCount: number) {
    super(`Cannot delete exercise: ${logCount} exercise log(s) exist`)
    this.name = "ExerciseHasLogsError"
  }
}

export interface ExerciseRepository {
  findMany(filters?: ExerciseFilters): Promise<ExerciseCardData[]>
  findAll(filters?: ExerciseFilters): Promise<Exercise[]>
  findById(id: string): Promise<ExerciseWithDetails | null>
  count(): Promise<number>
  create(data: CreateExerciseInput): Promise<Exercise>
  update(id: string, data: UpdateExerciseInput): Promise<Exercise>
  delete(id: string): Promise<void>
}