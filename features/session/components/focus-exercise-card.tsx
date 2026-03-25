"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Info, PlayCircle } from "lucide-react"
import type { RoutineExerciseWithDetails } from "@/types"
import { ExerciseActiveForm } from "@/features/session/components/exercise-active-form"
import type { ExerciseState } from "@/features/session/components/exercise-session-card"
import { cn } from "@/lib/utils"
import Image from "next/image"

type FocusExerciseCardProps = {
  routineExercise: RoutineExerciseWithDetails
  state: ExerciseState
  onSetReps: (setIdx: number, reps: number) => void
  onRpe: (rpe: number) => void
  onPain: (pain: number) => void
  onNotes: (notes: string) => void
  onComplete: () => void
  className?: string
}

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

export function FocusExerciseCard({
  routineExercise: re,
  state,
  onSetReps,
  onRpe,
  onPain,
  onNotes,
  onComplete,
  className,
}: FocusExerciseCardProps) {
  const numSets = re.sets ?? re.exercise.defaultSets ?? 3
  const isIsometric = !re.reps && !re.exercise.defaultReps
  const muscleColor = MUSCLE_COLOR[re.exercise.muscleGroup] ?? MUSCLE_COLOR.FULL_BODY

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-lg mx-auto bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl",
        state.completed && "border-emerald-500/30",
        className
      )}
    >
      {/* Visual / Image Area - Reduced height on mobile */}
      <div className="relative h-32 sm:h-48 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
        {re.exercise.imageUrl ? (
          <Image
            src={re.exercise.imageUrl}
            alt={re.exercise.name}
            fill
            className="object-cover opacity-40"
            priority
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-zinc-700">
            <PlayCircle className="h-8 w-8" />
            <span className="text-[10px] uppercase tracking-widest font-medium">Sin video</span>
          </div>
        )}

        {/* Floating status */}
        <div className="absolute top-3 right-3">
          {state.completed ? (
            <div className="bg-emerald-500 text-white rounded-full p-1 shadow-lg animate-in zoom-in duration-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          ) : (
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-400 rounded-full p-1.5">
              <Circle className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Block Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="outline" className={cn("bg-black/40 backdrop-blur-md border border-zinc-700 uppercase tracking-widest text-[9px] font-bold px-2 py-0.5", muscleColor)}>
            {re.block === "warmup" ? "Calentamiento" : re.block === "cooldown" ? "Vuelta a la calma" : re.exercise.muscleGroup}
          </Badge>
        </div>
      </div>

      {/* Content Area - Compacted for no-scroll */}
      <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="mb-3 shrink-0">
          <h2 className="text-xl font-bold text-white mb-0.5 leading-tight truncate">
            {re.exercise.name}
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="text-emerald-400 font-bold uppercase tracking-tighter">
              {formatTarget(re)}
            </span>
            {re.tempo && (
              <span className="text-zinc-500">· Tempo {re.tempo}</span>
            )}
          </div>
        </div>

        {/* Safety Note - Compacted */}
        {re.exercise.safetyNotes && !state.completed && (
          <div className="flex gap-2 p-2 bg-zinc-900/50 rounded-xl mb-3 border border-zinc-800/50 shrink-0">
            <Info className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-500 leading-tight line-clamp-2">
              {re.exercise.safetyNotes}
            </p>
          </div>
        )}

        {/* Form or Summary - Scrollable if really needed but targeted to fit */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {!state.completed ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
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
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h4 className="text-white font-semibold mb-1">¡Buen trabajo!</h4>
              <p className="text-zinc-500 text-xs mb-6 px-8">
                Ejercicio registrado con éxito. Preparado para el siguiente.
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full max-w-[280px]">
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">RPE real</p>
                  <p className="text-xl font-bold text-emerald-400">{state.rpeActual ?? "—"}</p>
                </div>
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Dolor</p>
                  <p className="text-xl font-bold text-orange-400">{state.painDuring}/5</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
