"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SetRow } from "./set-row"
import type { SetLog } from "@/features/session/components/exercise-session-card"
import { cn } from "@/lib/utils"

type ExerciseActiveFormProps = {
  numSets: number
  sets: SetLog[]
  rpeActual: number | null
  painDuring: number
  notes: string
  submitting: boolean
  isIsometric: boolean
  targetReps?: number | null
  targetDuration?: number | null
  onSetReps: (setIdx: number, reps: number) => void
  onRpe: (rpe: number) => void
  onPain: (pain: number) => void
  onNotes: (notes: string) => void
  onComplete: () => void
}

export function ExerciseActiveForm({
  numSets, sets, rpeActual, painDuring, notes, submitting, isIsometric,
  targetReps, targetDuration, onSetReps, onRpe, onPain, onNotes, onComplete,
}: ExerciseActiveFormProps) {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="space-y-1">
        {Array.from({ length: numSets }).map((_, i) => (
          <SetRow
            key={i}
            index={i}
            reps={sets[i]?.reps ?? 0}
            isIsometric={isIsometric}
            targetReps={targetReps}
            targetDuration={targetDuration}
            onReps={(reps) => onSetReps(i, reps)}
          />
        ))}
      </div>

      <div className="space-y-4">
        {/* RPE 1-10 */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Esfuerzo (RPE)</p>
          <div className="flex justify-between gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => onRpe(n)}
                className={cn(
                  "h-7 flex-1 rounded-lg text-xs font-bold transition-all",
                  rpeActual === n 
                    ? "bg-emerald-500 text-white scale-110 shadow-lg" 
                    : "bg-zinc-950 text-zinc-500 border border-zinc-800 hover:bg-zinc-800"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Dolor 1-10 */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Dolor (1-10)</p>
          <div className="flex justify-between gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => onPain(n)}
                className={cn(
                  "h-7 flex-1 rounded-lg text-xs font-bold transition-all",
                  painDuring === n 
                    ? "bg-orange-500 text-white scale-110 shadow-lg" 
                    : "bg-zinc-950 text-zinc-500 border border-zinc-800 hover:bg-zinc-800"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="">
        <Textarea
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="Notas rápidas..."
          aria-label="Notas del ejercicio"
          className="text-[11px] bg-zinc-950 border-zinc-800 text-zinc-400 placeholder-zinc-700 resize-none min-h-[40px] rounded-xl focus:border-emerald-500/50"
        />
      </div>

      <div className="mt-auto">
        <Button
          onClick={onComplete}
          disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-10 rounded-xl uppercase tracking-widest transition-all active:scale-[0.98]"
        >
          {submitting ? "Guardando..." : "Terminar Ejercicio"}
        </Button>
      </div>
    </div>
  )
}
