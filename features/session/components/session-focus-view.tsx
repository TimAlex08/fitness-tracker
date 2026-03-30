"use client"

import * as React from "react"
import { FocusExerciseCard } from "./focus-exercise-card"
import type { RoutineExerciseWithDetails } from "@/types"
import type { ExerciseState } from "./exercise-session-card"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type SessionFocusViewProps = {
  exercises: RoutineExerciseWithDetails[]
  exerciseStates: Record<string, ExerciseState>
  currentExerciseIndex: number
  onSetExerciseIndex: (index: number) => void
  onSetReps: (reId: string, setIdx: number, reps: number) => void
  onRpe: (reId: string, rpe: number) => void
  onPain: (reId: string, pain: number) => void
  onNotes: (reId: string, notes: string) => void
  onComplete: (reId: string, re: RoutineExerciseWithDetails, actualValue?: number) => void
}

export function SessionFocusView({
  exercises,
  exerciseStates,
  currentExerciseIndex,
  onSetExerciseIndex,
  onSetReps,
  onRpe,
  onPain,
  onNotes,
  onComplete,
}: SessionFocusViewProps) {
  const currentExercise = exercises[currentExerciseIndex]
  if (!currentExercise) return null

  const isFirst = currentExerciseIndex === 0
  const isLast = currentExerciseIndex === exercises.length - 1
  
  // Calcular progreso de la sesión (0-100)
  const completedCount = Object.values(exerciseStates).filter(s => s.completed).length
  const sessionProgress = (completedCount / exercises.length) * 100

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-zinc-950">
      {/* Exercise Card Area */}
      <div className="flex-1 relative overflow-hidden">
        <FocusExerciseCard
          key={currentExercise.id}
          routineExercise={currentExercise}
          state={exerciseStates[currentExercise.id]}
          onSetReps={(idx, reps) => onSetReps(currentExercise.id, idx, reps)}
          onRpe={(rpe) => onRpe(currentExercise.id, rpe)}
          onPain={(pain) => onPain(currentExercise.id, pain)}
          onNotes={(notes) => onNotes(currentExercise.id, notes)}
          onComplete={(val) => onComplete(currentExercise.id, currentExercise, val)}
          isLastExercise={isLast}
          sessionProgress={sessionProgress}
          className="animate-in fade-in zoom-in-95 duration-500"
        />
      </div>

      {/* Navigation Controls (Bottom Bar) */}
      <div className="h-16 shrink-0 bg-zinc-950 border-t border-zinc-900/50 flex items-center justify-between px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSetExerciseIndex(currentExerciseIndex - 1)}
          disabled={isFirst}
          className="text-zinc-500 hover:text-white disabled:opacity-20 gap-2 font-black uppercase text-[10px] tracking-widest"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex gap-1.5">
          {exercises.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentExerciseIndex 
                  ? "w-6 bg-emerald-500" 
                  : exerciseStates[exercises[i].id].completed
                    ? "w-1.5 bg-emerald-900"
                    : "w-1.5 bg-zinc-800"
              )}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSetExerciseIndex(currentExerciseIndex + 1)}
          disabled={isLast}
          className="text-zinc-500 hover:text-white disabled:opacity-20 gap-2 font-black uppercase text-[10px] tracking-widest"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
