"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Info, PlayCircle, ChevronDown, ChevronUp } from "lucide-react"
import type { RoutineExerciseWithDetails } from "@/types"
import type { ExerciseState } from "@/features/session/components/exercise-session-card"
import { SimplifiedExerciseForm } from "@/features/session/components/simplified-exercise-form"
import { cn } from "@/lib/utils"
import Image from "next/image"
import * as React from "react"

type FocusExerciseCardProps = {
  routineExercise: RoutineExerciseWithDetails
  state: ExerciseState
  onSetReps: (setIdx: number, reps: number) => void
  onRpe: (rpe: number) => void
  onPain: (pain: number) => void
  onNotes: (notes: string) => void
  onComplete: (actualValue?: number) => void
  className?: string
  isLastExercise?: boolean
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
  onRpe,
  onPain,
  onComplete,
  className,
  isLastExercise,
}: FocusExerciseCardProps) {
  const [showFullDescription, setShowFullDescription] = React.useState(false)
  const isIsometric = !re.reps && !re.exercise.defaultReps
  const muscleColor = MUSCLE_COLOR[re.exercise.muscleGroup] ?? MUSCLE_COLOR.FULL_BODY

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-lg mx-auto bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl h-full",
        state.completed && "border-emerald-500/30 shadow-emerald-500/5",
        className
      )}
    >
      {/* Visual Area */}
      <div className="relative h-48 sm:h-56 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
        {re.exercise.imageUrl ? (
          <Image
            src={re.exercise.imageUrl}
            alt={re.exercise.name}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-700">
            <PlayCircle className="h-10 w-10" />
            <span className="text-[10px] uppercase tracking-widest font-black">Sin video disponible</span>
          </div>
        )}

        {/* Floating status */}
        <div className="absolute top-6 right-6 z-10">
          {state.completed ? (
            <div className="bg-emerald-500 text-black rounded-full p-2 shadow-lg animate-in zoom-in duration-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          ) : (
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-400 rounded-full p-2.5">
              <Circle className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Block Badge */}
        <div className="absolute bottom-6 left-6 z-10">
          <Badge variant="outline" className={cn("bg-zinc-950/80 backdrop-blur-md border border-zinc-700 uppercase tracking-[0.2em] text-[10px] font-black px-3 py-1", muscleColor)}>
            {re.block === "warmup" ? "Calentamiento" : re.block === "cooldown" ? "Vuelta a la calma" : re.exercise.muscleGroup}
          </Badge>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
      </div>

      {/* Content Area */}
      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide">
        <div className="mb-6 shrink-0">
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 leading-tight tracking-tight italic uppercase">
            {re.exercise.name}
          </h2>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="text-emerald-400 font-black uppercase tracking-tight bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 text-sm">
              {formatTarget(re)}
            </span>
            {re.tempo && (
              <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">Tempo {re.tempo}</span>
            )}
          </div>

          {re.exercise.description && (
            <div className="relative">
              <p className={cn(
                "text-sm text-zinc-400 leading-relaxed font-medium transition-all duration-300",
                !showFullDescription && "line-clamp-2"
              )}>
                {re.exercise.description}
              </p>
              <button 
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1 hover:text-emerald-400 transition-colors"
              >
                {showFullDescription ? (
                  <>Ver menos <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Ver más <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center gap-8 py-4">
          {!state.completed ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Inputs 1-10 Rows */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Esfuerzo (RPE)</p>
                    {state.rpeActual && <span className="text-emerald-400 font-black text-xs">{state.rpeActual}/10</span>}
                  </div>
                  <div className="flex justify-between gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => onRpe(n)}
                        className={cn(
                          "flex-1 h-10 rounded-xl text-[10px] font-black transition-all",
                          state.rpeActual === n 
                            ? "bg-emerald-500 text-black scale-110 shadow-lg shadow-emerald-500/20" 
                            : "bg-zinc-900 text-zinc-600 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-400"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Molestia / Dolor</p>
                    {state.painDuring > 0 && <span className="text-orange-400 font-black text-xs">{state.painDuring}/10</span>}
                  </div>
                  <div className="flex justify-between gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => onPain(n)}
                        className={cn(
                          "flex-1 h-10 rounded-xl text-[10px] font-black transition-all",
                          state.painDuring === n 
                            ? "bg-orange-500 text-black scale-110 shadow-lg shadow-orange-500/20" 
                            : "bg-zinc-900 text-zinc-600 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-400"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Action */}
              <SimplifiedExerciseForm
                isIsometric={isIsometric}
                targetDuration={re.durationSec ?? re.exercise.defaultDurationSec}
                targetReps={re.reps ?? re.exercise.defaultReps}
                submitting={state.submitting}
                onComplete={onComplete}
                isLastExercise={isLastExercise}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-24 w-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-emerald-500/20 relative">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-20" />
              </div>
              <h4 className="text-2xl font-black text-white mb-2 tracking-tight uppercase italic">¡Excelente trabajo!</h4>
              <p className="text-zinc-500 text-sm font-medium max-w-[240px] mx-auto leading-relaxed">
                Ejercicio completado y registrado con éxito. Desliza para el siguiente.
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-zinc-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-zinc-600">
            <Info className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Información de seguridad</span>
          </div>
          {re.exercise.safetyNotes && (
            <button className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] border-b border-emerald-500/30 pb-0.5">
              Ver notas
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
