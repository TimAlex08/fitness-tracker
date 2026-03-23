/**
 * ExerciseCard — SRP aplicado:
 * Responsabilidad única: renderizar visualmente los datos de un ejercicio.
 * Es Server Component — no maneja estado ni interacciones.
 * Recibe ExerciseCardData (ISP), no el tipo completo de Prisma.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type {
  ExerciseCardData,
  MuscleGroup,
  ExerciseCategory,
  JointStress,
} from "@/types/exercise"

// ─── Mapas de presentación ────────────────────────────────────────────────────
// OCP: agregar un nuevo muscleGroup = agregar una entrada al mapa, no tocar la card.

const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  CHEST: "Pecho",
  BACK: "Espalda",
  LEGS: "Piernas",
  SHOULDERS: "Hombros",
  CORE: "Core",
  MOBILITY: "Movilidad",
  FULL_BODY: "Cuerpo completo",
}

const MUSCLE_GROUP_COLOR: Record<MuscleGroup, string> = {
  CHEST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BACK: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  LEGS: "bg-green-500/15 text-green-400 border-green-500/30",
  SHOULDERS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  CORE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  MOBILITY: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  FULL_BODY: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  STANDARD: "Estándar",
  REGRESSION: "Regresión",
  PROGRESSION: "Progresión",
  PREHAB: "Prehab",
  WARMUP: "Calentamiento",
  COOLDOWN: "Vuelta a la calma",
}

const CATEGORY_COLOR: Record<ExerciseCategory, string> = {
  STANDARD: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  REGRESSION: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  PROGRESSION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PREHAB: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  WARMUP: "bg-green-500/15 text-green-400 border-green-500/30",
  COOLDOWN: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
}

/** Punto de color para el indicador de estrés articular */
const JOINT_STRESS_COLOR: Record<JointStress, string> = {
  NONE: "bg-emerald-500",
  LOW: "bg-green-400",
  MODERATE: "bg-yellow-400",
  HIGH: "bg-red-400",
}

const JOINT_STRESS_LABEL: Record<JointStress, string> = {
  NONE: "Sin estrés articular",
  LOW: "Estrés articular bajo",
  MODERATE: "Estrés articular moderado",
  HIGH: "Estrés articular alto",
}

// ─── Helpers de presentación ─────────────────────────────────────────────────

/** Formatea el volumen de trabajo: "2 × 12 reps", "3 × 30s" o "2 series" */
function formatVolume(exercise: ExerciseCardData): string {
  const sets = exercise.defaultSets
  if (!sets) return "—"

  if (exercise.defaultReps) {
    return `${sets} × ${exercise.defaultReps} reps`
  }
  if (exercise.defaultDurationSec) {
    return `${sets} × ${exercise.defaultDurationSec}s`
  }
  return `${sets} series`
}

// ─── Componente ──────────────────────────────────────────────────────────────

type ExerciseCardProps = {
  exercise: ExerciseCardData
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const muscleColor = MUSCLE_GROUP_COLOR[exercise.muscleGroup]
  const categoryColor = CATEGORY_COLOR[exercise.category]
  const jointDotColor = JOINT_STRESS_COLOR[exercise.jointStress]
  const jointLabel = JOINT_STRESS_LABEL[exercise.jointStress]

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col">
      <CardHeader className="pb-3">
        {/* Badges de clasificación */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge
            variant="outline"
            className={`text-xs font-medium border ${muscleColor}`}
          >
            {MUSCLE_GROUP_LABEL[exercise.muscleGroup]}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs font-medium border ${categoryColor}`}
          >
            {CATEGORY_LABEL[exercise.category]}
          </Badge>
        </div>

        {/* Nombre del ejercicio */}
        <h3 className="text-sm font-semibold text-white leading-snug">
          {exercise.name}
        </h3>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        {/* Descripción (truncada a 2 líneas) */}
        {exercise.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {exercise.description}
          </p>
        )}

        {/* Métricas de trabajo */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800">
          {/* Volumen */}
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Volumen</p>
            <p className="text-sm font-medium text-white">
              {formatVolume(exercise)}
            </p>
          </div>

          {/* Tempo */}
          {exercise.defaultTempo && (
            <div className="text-right">
              <p className="text-xs text-zinc-500 mb-0.5">Tempo</p>
              <p className="text-sm font-mono text-white">
                {exercise.defaultTempo}
              </p>
            </div>
          )}

          {/* RPE objetivo */}
          {exercise.defaultRpe && (
            <div className="text-right">
              <p className="text-xs text-zinc-500 mb-0.5">RPE</p>
              <p className="text-sm font-medium text-white">
                {exercise.defaultRpe}
                <span className="text-zinc-500">/10</span>
              </p>
            </div>
          )}
        </div>

        {/* Indicador de estrés articular + nota de seguridad */}
        <div className="flex items-start gap-2">
          <span
            title={jointLabel}
            aria-label={jointLabel}
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${jointDotColor}`}
          />
          {exercise.safetyNotes ? (
            <p className="text-xs text-zinc-500 leading-relaxed">
              {exercise.safetyNotes}
            </p>
          ) : (
            <p className="text-xs text-zinc-600">{jointLabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
