/**
 * Repositorio de ejercicios — DIP aplicado:
 * Las páginas importan estas funciones, no prisma directamente.
 * Si mañana cambia la fuente de datos, solo cambia este archivo.
 */

import { prisma } from "@/src/lib/prisma"
import type { ExerciseCardData, MuscleGroup } from "@/types/exercise"

/** Campos que seleccionamos — coincide exactamente con ExerciseCardData */
const EXERCISE_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
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
 * Devuelve todos los ejercicios del catálogo.
 * Si se pasa muscleGroup, filtra por ese grupo.
 */
export async function getExercises(
  muscleGroup?: MuscleGroup
): Promise<ExerciseCardData[]> {
  const exercises = await prisma.exercise.findMany({
    where: muscleGroup ? { muscleGroup } : undefined,
    select: EXERCISE_CARD_SELECT,
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  })

  return exercises as ExerciseCardData[]
}

/** Devuelve el total de ejercicios en el catálogo */
export async function getExerciseCount(): Promise<number> {
  return prisma.exercise.count()
}
