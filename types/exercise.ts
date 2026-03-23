/**
 * Tipos de ejercicio — ISP aplicado:
 * Cada interfaz expone solo los campos que su consumidor necesita.
 * Ningún componente depende del tipo completo de Prisma.
 */

/** Grupos musculares disponibles en el catálogo */
export type MuscleGroup =
  | "CHEST"
  | "BACK"
  | "LEGS"
  | "SHOULDERS"
  | "CORE"
  | "MOBILITY"
  | "FULL_BODY"

/** Categorías de ejercicio */
export type ExerciseCategory =
  | "STANDARD"
  | "REGRESSION"
  | "PROGRESSION"
  | "PREHAB"
  | "WARMUP"
  | "COOLDOWN"

/** Nivel de estrés articular */
export type JointStress = "NONE" | "LOW" | "MODERATE" | "HIGH"

/**
 * Datos que necesita ExerciseCard para renderizarse.
 * Subset del modelo Prisma — no incluye relaciones ni timestamps.
 */
export type ExerciseCardData = {
  id: string
  name: string
  slug: string
  description: string | null
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

/**
 * Datos que necesita el dashboard para sus métricas.
 * Solo conteos — no requiere datos completos.
 */
export type DashboardStats = {
  exerciseCount: number
  currentStreak: number
}
