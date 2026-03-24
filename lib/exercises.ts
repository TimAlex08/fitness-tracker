/**
 * Repositorio de ejercicios — DIP aplicado:
 * Las páginas importan estas funciones, no prisma directamente.
 * Si mañana cambia la fuente de datos, solo cambia este archivo.
 */

import { prisma } from "@/src/lib/prisma"
import type { Exercise } from "@/types"
import type { ExerciseCardData, MuscleGroup } from "@/types/exercise"

/** Campos que seleccionamos — coincide exactamente con ExerciseCardData */
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

/**
 * Devuelve ejercicios del catálogo con filtros opcionales.
 */
export async function getExercises(
  muscleGroup?: MuscleGroup,
  search?: string
): Promise<ExerciseCardData[]> {
  const exercises = await prisma.exercise.findMany({
    where: {
      ...(muscleGroup && { muscleGroup }),
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    },
    select: EXERCISE_CARD_SELECT,
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  })

  return exercises as ExerciseCardData[]
}

/** Devuelve el total de ejercicios en el catálogo */
export async function getExerciseCount(): Promise<number> {
  return prisma.exercise.count()
}

/**
 * Devuelve todos los ejercicios con todos sus campos.
 * Usado por el ejercicio picker en la sesión libre y el form de CRUD.
 */
export async function getAllExercises(): Promise<Exercise[]> {
  return prisma.exercise.findMany({
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  })
}

/**
 * Devuelve un ejercicio por ID con variantes y últimos 8 registros de rendimiento.
 */
export async function getExerciseWithDetails(id: string) {
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
}
