/**
 * ExerciseCard — tarjeta visual de ejercicio con imagen grande.
 * Server Component. Recibe ExerciseCardData (ISP).
 */

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import type {
  ExerciseCardData,
  MuscleGroup,
  ExerciseCategory,
  JointStress,
} from "@/types/exercise"

// ─── Mapas de presentación ────────────────────────────────────────────────────

const MUSCLE_GROUP_LABEL: Record<MuscleGroup, string> = {
  CHEST: "Pecho",
  BACK: "Espalda",
  LEGS: "Piernas",
  SHOULDERS: "Hombros",
  CORE: "Core",
  MOBILITY: "Movilidad",
  FULL_BODY: "Cuerpo completo",
}

const MUSCLE_GROUP_BADGE: Record<MuscleGroup, string> = {
  CHEST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BACK: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  LEGS: "bg-green-500/15 text-green-400 border-green-500/30",
  SHOULDERS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  CORE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  MOBILITY: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  FULL_BODY: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}

/** Gradiente del placeholder por grupo muscular */
const MUSCLE_GROUP_GRADIENT: Record<MuscleGroup, string> = {
  CHEST: "from-blue-950 to-blue-900",
  BACK: "from-purple-950 to-purple-900",
  LEGS: "from-green-950 to-green-900",
  SHOULDERS: "from-orange-950 to-orange-900",
  CORE: "from-yellow-950 to-yellow-900",
  MOBILITY: "from-teal-950 to-teal-900",
  FULL_BODY: "from-zinc-900 to-zinc-800",
}

/** Emoji representativo del grupo muscular */
const MUSCLE_GROUP_EMOJI: Record<MuscleGroup, string> = {
  CHEST: "💪",
  BACK: "🔝",
  LEGS: "🦵",
  SHOULDERS: "🏋️",
  CORE: "🎯",
  MOBILITY: "🧘",
  FULL_BODY: "⚡",
}

const CATEGORY_LABEL: Record<ExerciseCategory, string> = {
  STANDARD: "Estándar",
  REGRESSION: "Regresión",
  PROGRESSION: "Progresión",
  PREHAB: "Prehab",
  WARMUP: "Calentamiento",
  COOLDOWN: "Vuelta a la calma",
}

const CATEGORY_BADGE: Record<ExerciseCategory, string> = {
  STANDARD: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  REGRESSION: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  PROGRESSION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PREHAB: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  WARMUP: "bg-green-500/15 text-green-400 border-green-500/30",
  COOLDOWN: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
}

const JOINT_STRESS_DOT: Record<JointStress, string> = {
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

// ─── Helper de volumen ────────────────────────────────────────────────────────

function formatVolume(exercise: ExerciseCardData): string {
  const sets = exercise.defaultSets
  if (!sets) return "—"
  if (exercise.defaultReps) return `${sets} × ${exercise.defaultReps}`
  if (exercise.defaultDurationSec) return `${sets} × ${exercise.defaultDurationSec}s`
  return `${sets} series`
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ExerciseCard({ exercise }: { exercise: ExerciseCardData }) {
  return (
    <div className="group rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors overflow-hidden flex flex-col">
      {/* Zona de imagen */}
      <ExerciseImage exercise={exercise} />

      {/* Contenido de la tarjeta */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={`text-xs font-medium border ${MUSCLE_GROUP_BADGE[exercise.muscleGroup]}`}
          >
            {MUSCLE_GROUP_LABEL[exercise.muscleGroup]}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs font-medium border ${CATEGORY_BADGE[exercise.category]}`}
          >
            {CATEGORY_LABEL[exercise.category]}
          </Badge>
        </div>

        {/* Nombre */}
        <h3 className="text-base font-semibold text-white leading-snug">
          {exercise.name}
        </h3>

        {/* Descripción */}
        {exercise.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {exercise.description}
          </p>
        )}

        {/* Métricas */}
        <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center gap-4">
          <Metric label="Series" value={formatVolume(exercise)} />
          {exercise.defaultTempo && (
            <Metric label="Tempo" value={exercise.defaultTempo} mono />
          )}
          {exercise.defaultRpe && (
            <Metric label="RPE" value={`${exercise.defaultRpe}/10`} />
          )}
        </div>

        {/* Seguridad */}
        <div className="flex items-start gap-2">
          <span
            title={JOINT_STRESS_LABEL[exercise.jointStress]}
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${JOINT_STRESS_DOT[exercise.jointStress]}`}
          />
          <p className="text-xs text-zinc-500 leading-relaxed">
            {exercise.safetyNotes ?? JOINT_STRESS_LABEL[exercise.jointStress]}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Imagen / Placeholder ─────────────────────────────────────────────────────

function ExerciseImage({ exercise }: { exercise: ExerciseCardData }) {
  if (exercise.imageUrl) {
    return (
      <div className="relative w-full aspect-[16/9] bg-zinc-800 overflow-hidden">
        <Image
          src={exercise.imageUrl}
          alt={`Ilustración de ${exercise.name}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        {/* Gradiente inferior para que el contenido sea legible si hay texto sobre imagen */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-900/60 to-transparent" />
      </div>
    )
  }

  // Placeholder con gradiente y emoji del grupo muscular
  const gradient = MUSCLE_GROUP_GRADIENT[exercise.muscleGroup]
  const emoji = MUSCLE_GROUP_EMOJI[exercise.muscleGroup]

  return (
    <div
      className={`relative w-full aspect-[16/9] bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-2 overflow-hidden`}
    >
      {/* Círculo decorativo de fondo */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -left-4 -bottom-6 w-24 h-24 rounded-full bg-white/5" />

      <span className="text-5xl select-none" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-xs font-medium text-white/50 uppercase tracking-widest">
        {MUSCLE_GROUP_LABEL[exercise.muscleGroup]}
      </span>
    </div>
  )
}

// ─── Métrica inline ───────────────────────────────────────────────────────────

function Metric({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-white ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  )
}
