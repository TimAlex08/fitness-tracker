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
  onComplete: (reId: string, re: RoutineExerciseWithDetails) => void
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
  const containerRef = React.useRef<HTMLDivElement>(null)

  // ── Sync scroll position with currentExerciseIndex ───────────────────────

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const targetSlide = container.children[currentExerciseIndex] as HTMLElement
    if (targetSlide) {
      container.scrollTo({
        left: targetSlide.offsetLeft - (container.offsetWidth - targetSlide.offsetWidth) / 2,
        behavior: "smooth",
      })
    }
  }, [currentExerciseIndex])

  // ── Handle manual scroll/snap ──────────────────────────────────────────

  const handleScroll = React.useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const scrollLeft = container.scrollLeft
    const center = scrollLeft + container.offsetWidth / 2

    let closestIndex = 0
    let minDistance = Infinity

    Array.from(container.children).forEach((child, index) => {
      const childCenter = (child as HTMLElement).offsetLeft + (child as HTMLElement).offsetWidth / 2
      const distance = Math.abs(center - childCenter)
      
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })

    if (closestIndex !== currentExerciseIndex) {
      onSetExerciseIndex(closestIndex)
    }
  }, [currentExerciseIndex, onSetExerciseIndex])

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      {/* Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 pt-4 gap-4 px-[10%] md:px-[25%] lg:px-[30%]"
        style={{ scrollBehavior: "smooth" }}
      >
        {exercises.map((re, index) => (
          <div
            key={re.id}
            className={cn(
              "shrink-0 w-full max-w-lg snap-center transition-all duration-500 h-[75vh] sm:h-auto",
              index !== currentExerciseIndex && "opacity-40 scale-95 blur-[1px]"
            )}
          >
            <FocusExerciseCard
              routineExercise={re}
              className="h-full"
              state={exerciseStates[re.id]}
              onSetReps={(setIdx, reps) => onSetReps(re.id, setIdx, reps)}
              onRpe={(rpe) => onRpe(re.id, rpe)}
              onPain={(pain) => onPain(re.id, pain)}
              onNotes={(notes) => onNotes(re.id, notes)}
              onComplete={() => onComplete(re.id, re)}
            />
          </div>
        ))}
      </div>

      {/* Navigation Controls (Desktop) */}
      <div className="hidden md:flex absolute inset-y-0 left-0 right-0 pointer-events-none items-center justify-between px-4">
        <Button
          variant="secondary"
          size="icon"
          aria-label="Ejercicio anterior"
          className={cn(
            "rounded-full pointer-events-auto h-12 w-12 bg-zinc-900/80 border border-zinc-800 text-white shadow-xl backdrop-blur-sm",
            currentExerciseIndex === 0 && "invisible"
          )}
          onClick={() => onSetExerciseIndex(currentExerciseIndex - 1)}
        >
          <ChevronLeft className="h-6 w-6" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Ejercicio siguiente"
          className={cn(
            "rounded-full pointer-events-auto h-12 w-12 bg-zinc-900/80 border border-zinc-800 text-white shadow-xl backdrop-blur-sm",
            currentExerciseIndex === exercises.length - 1 && "invisible"
          )}
          onClick={() => onSetExerciseIndex(currentExerciseIndex + 1)}
        >
          <ChevronRight className="h-6 w-6" aria-hidden="true" />
        </Button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {exercises.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 transition-all duration-300 rounded-full",
              i === currentExerciseIndex ? "w-8 bg-emerald-500" : "w-1.5 bg-zinc-800"
            )}
          />
        ))}
      </div>
    </div>
  )
}
