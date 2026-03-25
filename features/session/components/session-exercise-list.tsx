"use client"

import { ExerciseSessionCard } from "@/features/session/components/exercise-session-card"
import type { ExerciseState } from "@/features/session/components/exercise-session-card"
import type { RoutineWithExercises, RoutineExerciseWithDetails } from "@/types"

const BLOCK_LABEL: Record<string, string> = {
  warmup: "Calentamiento",
  main: "Bloque principal",
  cooldown: "Vuelta a la calma",
}

type SessionExerciseListProps = {
  routine: RoutineWithExercises
  exerciseStates: Record<string, ExerciseState>
  onSetReps: (reId: string, setIdx: number, reps: number) => void
  onRpe: (reId: string, rpe: number) => void
  onPain: (reId: string, pain: number) => void
  onNotes: (reId: string, notes: string) => void
  onComplete: (reId: string, re: RoutineExerciseWithDetails) => void
}

export function SessionExerciseList({
  routine,
  exerciseStates,
  onSetReps,
  onRpe,
  onPain,
  onNotes,
  onComplete,
}: SessionExerciseListProps) {
  const blocks = routine.exercises.reduce<Record<string, typeof routine.exercises>>(
    (acc, re) => {
      const block = re.block ?? "main"
      if (!acc[block]) acc[block] = []
      acc[block].push(re)
      return acc
    },
    {}
  )

  const blockOrder = ["warmup", "main", "cooldown"]
  const sortedBlocks = Object.entries(blocks).sort(
    ([a], [b]) => blockOrder.indexOf(a) - blockOrder.indexOf(b)
  )

  return (
    <>
      {sortedBlocks.map(([block, exercises]) => (
        <div key={block}>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 px-1">
            {BLOCK_LABEL[block] ?? block}
          </p>
          <div className="space-y-3">
            {exercises.map((re) => (
              <ExerciseSessionCard
                key={re.id}
                routineExercise={re}
                state={exerciseStates[re.id]}
                onSetReps={(setIdx, reps) => onSetReps(re.id, setIdx, reps)}
                onRpe={(rpe) => onRpe(re.id, rpe)}
                onPain={(pain) => onPain(re.id, pain)}
                onNotes={(notes) => onNotes(re.id, notes)}
                onComplete={() => onComplete(re.id, re)}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
