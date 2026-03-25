"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { SetRow } from "./set-row"
import type { SetLog } from "@/features/session/components/exercise-session-card"

const PAIN_COLORS = [
  "bg-emerald-500 text-white",
  "bg-green-500 text-white",
  "bg-yellow-500 text-black",
  "bg-orange-500 text-white",
  "bg-red-500 text-white",
  "bg-red-700 text-white",
]

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
    <>
      <div className="space-y-2 mb-4">
        <p className="text-xs text-zinc-500 font-medium">Series</p>
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

      <div className="mb-4">
        <p className="text-xs text-zinc-500 font-medium mb-2">RPE real (dificultad percibida)</p>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => onRpe(n)}
              className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${rpeActual === n ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-zinc-500 font-medium mb-2">Dolor durante el ejercicio</p>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onPain(n)}
              className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${painDuring === n ? PAIN_COLORS[n] : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-1">0 = sin dolor · 5 = dolor intenso</p>
      </div>

      <div className="mb-4">
        <Textarea
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="Notas opcionales (ej: bajé la superficie, sentí tensión en hombro...)"
          className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600 resize-none min-h-[60px]"
        />
      </div>

      <Button
        onClick={onComplete}
        disabled={submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
      >
        {submitting ? "Guardando..." : "Marcar como completado"}
      </Button>
    </>
  )
}
