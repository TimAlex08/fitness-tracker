/**
 * Tipos específicos del feature de ejercicios.
 * Los enums (MuscleGroup, ExerciseCategory, JointStress) se importan de @/types
 * para evitar duplicación con los re-exports de Prisma.
 */

import type { MuscleGroup, ExerciseCategory, JointStress } from "@/types"

export type { MuscleGroup, ExerciseCategory, JointStress }

/**
 * Datos que necesita ExerciseCard para renderizarse.
 * Subset del modelo Prisma — no incluye relaciones ni timestamps.
 */
export type ExerciseCardData = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  muscleGroup: MuscleGroup
  category: ExerciseCategory
  defaultSets: number | null
  defaultReps: number | null
  defaultDurationSec: number | null
  defaultTempo: string | null
  defaultRpe: number | null
  jointStress: JointStress
  safetyNotes: string | null
}
