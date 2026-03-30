"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle } from "lucide-react"
import type { RoutineExerciseWithDetails } from "@/types"
import { ExerciseActiveForm } from "@/features/session/components/exercise-active-form"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SetLog = { reps: number }

export type ExerciseState = {
  sets: SetLog[]
  rpeActual: number | null
  painDuring: number
  notes: string
  completed: boolean
  submitting: boolean
}

type ExerciseSessionCardProps = {
  routineExercise: RoutineExerciseWithDetails
  state: ExerciseState
  onSetReps: (setIdx: number, reps: number) => void
  onRpe: (rpe: number) => void
  onPain: (pain: number) => void
  onNotes: (notes: string) => void
  onComplete: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MUSCLE_COLOR: Record<string, string> = {
  CHEST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BACK: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  LEGS: "bg-green-500/15 text-green-400 border-green-500/30",
  SHOULDERS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  CORE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  MOBILITY: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  FULL_BODY: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}

function formatTarget(re: RoutineExerciseWithDetails): string {
  const sets = re.sets ?? re.exercise.defaultSets
  const reps = re.reps ?? re.exercise.defaultReps
  const dur = re.durationSec ?? re.exercise.defaultDurationSec
  if (!sets) return "—"
  if (reps) return `${sets} × ${reps} reps`
  if (dur) return `${sets} × ${dur}s`
  return `${sets} series`
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function ExerciseSessionCard({
  routineExercise: re,
  state,
  onSetReps,
  onRpe,
  onPain,
  onNotes,
  onComplete,
}: ExerciseSessionCardProps) {
  const numSets = re.sets ?? re.exercise.defaultSets ?? 3
  const isIsometric = !re.reps && !re.exercise.defaultReps
  const muscleColor = MUSCLE_COLOR[re.exercise.muscleGroup] ?? MUSCLE_COLOR.FULL_BODY

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        state.completed
          ? "border-emerald-800 bg-emerald-950/40"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <Badge variant="outline" className={`text-xs border ${muscleColor}`}>
              {re.block === "warmup"
                ? "Calentamiento"
                : re.block === "cooldown"
                  ? "Vuelta a la calma"
                  : re.exercise.muscleGroup}
            </Badge>
            {re.rpe && (
              <Badge variant="outline" className="text-xs border border-zinc-700 text-zinc-400">
                RPE obj. {re.rpe}
              </Badge>
            )}
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug">{re.exercise.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Objetivo: {formatTarget(re)}
            {re.tempo && ` · Tempo ${re.tempo}`}
          </p>
        </div>
        {state.completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <Circle className="h-5 w-5 text-zinc-700 shrink-0 mt-0.5" />
        )}
      </div>

      {/* Safety note */}
      {re.exercise.safetyNotes && (
        <p className="text-xs text-zinc-500 bg-zinc-800/60 rounded-lg px-3 py-2 mb-3 leading-relaxed">
          {re.exercise.safetyNotes}
        </p>
      )}

      {/* Active form */}
      {!state.completed && (
        <ExerciseActiveForm
          numSets={numSets}
          sets={state.sets}
          rpeActual={state.rpeActual}
          painDuring={state.painDuring}
          notes={state.notes}
          submitting={state.submitting}
          isIsometric={isIsometric}
          targetReps={re.reps ?? re.exercise.defaultReps}
          targetDuration={re.durationSec ?? re.exercise.defaultDurationSec}
          onSetReps={onSetReps}
          onRpe={onRpe}
          onPain={onPain}
          onNotes={onNotes}
          onComplete={onComplete}
        />
      )}

      {/* Completed summary */}
      {state.completed && (
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-zinc-400">
          {state.sets.some((s) => s.reps > 0) && (
            <span>
              Reps: <span className="text-white">{state.sets.map((s) => s.reps).join(" / ")}</span>
            </span>
          )}
          {state.rpeActual && (
            <span>
              RPE: <span className="text-emerald-400">{state.rpeActual}/10</span>
            </span>
          )}
          {state.painDuring > 0 && (
            <span>
              Dolor: <span className="text-orange-400">{state.painDuring}/5</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
