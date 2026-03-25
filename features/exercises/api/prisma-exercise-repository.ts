import { unstable_cache, revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import type { Exercise, MuscleGroup, MovementType, ExerciseCategory, JointStress } from "@prisma/client"
import type { ExerciseCardData } from "@/features/exercises/types/exercise.types"
import {
  ExerciseHasLogsError,
  type ExerciseRepository,
  type ExerciseFilters,
  type CreateExerciseInput,
  type UpdateExerciseInput,
  type ExerciseWithDetails,
} from "./exercise-repository"

// ─── Cache tag ────────────────────────────────────────────────────────────────

const EXERCISES_TAG = "exercises"

// ─── Selector for card data ───────────────────────────────────────────────────

const EXERCISE_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  muscleGroup: true,
  category: true,
  defaultSets: true,
  defaultReps: true,
  defaultDurationSec: true,
  defaultTempo: true,
  defaultRpe: true,
  jointStress: true,
  safetyNotes: true,
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// ─── Cached read functions (module-level, shared across instances) ────────────

const cachedFindMany = unstable_cache(
  async (filters?: ExerciseFilters): Promise<ExerciseCardData[]> => {
    const exercises = await prisma.exercise.findMany({
      where: {
        ...(filters?.muscleGroup && { muscleGroup: filters.muscleGroup as MuscleGroup }),
        ...(filters?.search && { name: { contains: filters.search, mode: "insensitive" } }),
      },
      select: EXERCISE_CARD_SELECT,
      orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
    })
    return exercises as ExerciseCardData[]
  },
  ["exercises-findMany"],
  { revalidate: 3600, tags: [EXERCISES_TAG] }
)

const cachedFindAll = unstable_cache(
  async (filters?: ExerciseFilters): Promise<Exercise[]> => {
    return prisma.exercise.findMany({
      where: {
        ...(filters?.muscleGroup && { muscleGroup: filters.muscleGroup as MuscleGroup }),
        ...(filters?.search && { name: { contains: filters.search, mode: "insensitive" } }),
      },
      orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
    })
  },
  ["exercises-findAll"],
  { revalidate: 3600, tags: [EXERCISES_TAG] }
)

const cachedFindById = unstable_cache(
  async (id: string): Promise<ExerciseWithDetails | null> => {
    return prisma.exercise.findUnique({
      where: { id },
      include: {
        parent: true,
        variants: { orderBy: { difficulty: "asc" } },
        exerciseLogs: {
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            dailyLog: {
              select: {
                date: true,
                routine: { select: { name: true } },
              },
            },
          },
        },
      },
    })
  },
  ["exercises-findById"],
  { revalidate: 3600, tags: [EXERCISES_TAG] }
)

const cachedCount = unstable_cache(
  async (): Promise<number> => prisma.exercise.count(),
  ["exercises-count"],
  { revalidate: 3600, tags: [EXERCISES_TAG] }
)

// ─── Repository ───────────────────────────────────────────────────────────────

export class PrismaExerciseRepository implements ExerciseRepository {
  findMany(filters?: ExerciseFilters): Promise<ExerciseCardData[]> {
    return cachedFindMany(filters)
  }

  findAll(filters?: ExerciseFilters): Promise<Exercise[]> {
    return cachedFindAll(filters)
  }

  findById(id: string): Promise<ExerciseWithDetails | null> {
    return cachedFindById(id)
  }

  count(): Promise<number> {
    return cachedCount()
  }

  async create(data: CreateExerciseInput): Promise<Exercise> {
    const result = await prisma.exercise.create({
      data: {
        name: data.name,
        slug: data.slug || generateSlug(data.name),
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        videoUrl: data.videoUrl ?? null,
        muscleGroup: data.muscleGroup as MuscleGroup,
        movementType: data.movementType as MovementType,
        category: data.category as ExerciseCategory,
        difficulty: data.difficulty ?? 1,
        parentId: data.parentId ?? null,
        defaultSets: data.defaultSets ?? null,
        defaultReps: data.defaultReps ?? null,
        defaultDurationSec: data.defaultDurationSec ?? null,
        defaultRestSec: data.defaultRestSec ?? 60,
        defaultTempo: data.defaultTempo ?? null,
        defaultRpe: data.defaultRpe ?? null,
        jointStress: (data.jointStress as JointStress) ?? "LOW",
        targetJoints: data.targetJoints ?? null,
        contraindications: data.contraindications ?? null,
        safetyNotes: data.safetyNotes ?? null,
        bodyweightPercent: data.bodyweightPercent ?? null,
      },
    })
    revalidateTag(EXERCISES_TAG, "max")
    return result
  }

  async update(id: string, data: UpdateExerciseInput): Promise<Exercise> {
    const result = await prisma.exercise.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl || null }),
        ...(data.muscleGroup !== undefined && { muscleGroup: data.muscleGroup as MuscleGroup }),
        ...(data.movementType !== undefined && { movementType: data.movementType as MovementType }),
        ...(data.category !== undefined && { category: data.category as ExerciseCategory }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.parentId !== undefined && { parentId: data.parentId || null }),
        ...(data.defaultSets !== undefined && { defaultSets: data.defaultSets }),
        ...(data.defaultReps !== undefined && { defaultReps: data.defaultReps }),
        ...(data.defaultDurationSec !== undefined && { defaultDurationSec: data.defaultDurationSec }),
        ...(data.defaultRestSec !== undefined && { defaultRestSec: data.defaultRestSec }),
        ...(data.defaultTempo !== undefined && { defaultTempo: data.defaultTempo || null }),
        ...(data.defaultRpe !== undefined && { defaultRpe: data.defaultRpe }),
        ...(data.jointStress !== undefined && { jointStress: data.jointStress as JointStress }),
        ...(data.targetJoints !== undefined && { targetJoints: data.targetJoints || null }),
        ...(data.contraindications !== undefined && { contraindications: data.contraindications || null }),
        ...(data.safetyNotes !== undefined && { safetyNotes: data.safetyNotes || null }),
        ...(data.bodyweightPercent !== undefined && { bodyweightPercent: data.bodyweightPercent }),
      },
    })
    revalidateTag(EXERCISES_TAG, "max")
    return result
  }

  async delete(id: string): Promise<void> {
    const logCount = await prisma.exerciseLog.count({ where: { exerciseId: id } })
    if (logCount > 0) {
      throw new ExerciseHasLogsError(logCount)
    }
    await prisma.exercise.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    })
    await prisma.exercise.delete({ where: { id } })
    revalidateTag(EXERCISES_TAG, "max")
  }
}
