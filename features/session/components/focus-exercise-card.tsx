"use client"

import { SimplifiedExerciseForm } from "@/features/session/components/simplified-exercise-form"
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
  isLastExercise?: boolean
}

const PAIN_COLORS = [
  "bg-emerald-500 text-white",
  "bg-green-500 text-white",
  "bg-yellow-500 text-black",
  "bg-orange-500 text-white",
  "bg-red-500 text-white",
  "bg-red-700 text-white",
]

export function FocusExerciseCard({
  routineExercise: re,
  state,
  onSetReps,
  onRpe,
  onPain,
  onNotes,
  onComplete,
  className,
  isLastExercise,
}: FocusExerciseCardProps) {
  const isIsometric = !re.reps && !re.exercise.defaultReps
  const muscleColor = MUSCLE_COLOR[re.exercise.muscleGroup] ?? MUSCLE_COLOR.FULL_BODY

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-lg mx-auto bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl h-full",
        state.completed && "border-emerald-500/30",
        className
      )}
    >
      {/* Visual / Image Area - Even smaller on mobile to prevent scroll */}
      <div className="relative h-28 sm:h-40 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
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
            <PlayCircle className="h-6 w-6" />
            <span className="text-[9px] uppercase tracking-widest font-medium">Sin video</span>
          </div>
        )}

        {/* Floating status */}
        <div className="absolute top-4 right-4">
          {state.completed ? (
            <div className="bg-emerald-500 text-white rounded-full p-1.5 shadow-lg animate-in zoom-in duration-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          ) : (
            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-400 rounded-full p-2">
              <Circle className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Block Badge */}
        <div className="absolute bottom-4 left-4">
          <Badge variant="outline" className={cn("bg-black/60 backdrop-blur-md border border-zinc-700 uppercase tracking-widest text-[8px] font-black px-2 py-0.5", muscleColor)}>
            {re.block === "warmup" ? "Calentamiento" : re.block === "cooldown" ? "Vuelta a la calma" : re.exercise.muscleGroup}
          </Badge>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col min-h-0">
        <div className="mb-4 shrink-0">
          <h2 className="text-2xl font-black text-white mb-1 leading-tight truncate tracking-tight">
            {re.exercise.name}
          </h2>
          <div className="flex items-center gap-2 text-[12px] text-zinc-400">
            <span className="text-emerald-400 font-black uppercase tracking-tight bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
              {formatTarget(re)}
            </span>
            {re.tempo && (
              <span className="text-zinc-500 font-medium">Tempo {re.tempo}</span>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-6 overflow-hidden">
          {!state.completed ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Optional RPE/Pain - Very compact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">Esfuerzo (RPE)</p>
                  <div className="flex gap-1.5">
                    {[7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => onRpe(n)}
                        className={cn(
                          "h-8 w-8 rounded-xl text-xs font-black transition-all",
                          state.rpeActual === n 
                            ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20" 
                            : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">Molestia (0-5)</p>
                  <div className="flex gap-1.5">
                    {[0, 2, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => onPain(n)}
                        className={cn(
                          "h-8 w-8 rounded-xl text-xs font-black transition-all",
                          state.painDuring === n 
                            ? PAIN_COLORS[n] + " scale-110 shadow-lg" 
                            : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800"
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
                submitting={state.submitting}
                onComplete={onComplete}
                isLastExercise={isLastExercise}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-4 shadow-inner shadow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <h4 className="text-xl font-black text-white mb-1 tracking-tight">¡EXCELENTE!</h4>
              <p className="text-zinc-500 text-[11px] font-medium max-w-[200px] mx-auto leading-relaxed">
                Ejercicio registrado. Desliza para el siguiente o continúa.
              </p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-4 pt-4 border-t border-zinc-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Info className="h-3 w-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Información de seguridad</span>
          </div>
          {re.exercise.safetyNotes && (
            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Ver notas</span>
          )}
        </div>
      </div>
    </div>
  )
}

