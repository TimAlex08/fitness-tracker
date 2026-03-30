"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Play, Timer, CheckCircle2, ChevronRight, CheckCircle } from "lucide-react"

type SimplifiedExerciseFormProps = {
  isIsometric: boolean
  targetReps?: number | null
  targetDuration?: number | null
  submitting: boolean
  onComplete: () => void
  isLastExercise?: boolean
}

export function SimplifiedExerciseForm({
  isIsometric,
  targetDuration,
  submitting,
  onComplete,
  isLastExercise
}: SimplifiedExerciseFormProps) {
  const [timerStatus, setTimerStatus] = React.useState<"idle" | "running" | "finished">("idle")
  const [timeLeft, setTimeLeft] = React.useState(targetDuration ?? 0)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  // ── Timer Logic ──────────────────────────────────────────────────────────

  const startTimer = React.useCallback(() => {
    if (timerStatus === "running") return
    setTimerStatus("running")
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setTimerStatus("finished")
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [timerStatus])

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // ── Render Timer Exercise ────────────────────────────────────────────────

  if (isIsometric || targetDuration) {
    if (timerStatus === "idle") {
      return (
        <Button
          onClick={startTimer}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-16 rounded-2xl text-lg group transition-all"
        >
          <Play className="h-6 w-6 mr-3 fill-current group-hover:scale-110 transition-transform" />
          INICIAR ({formatTime(timeLeft)})
        </Button>
      )
    }

    if (timerStatus === "running") {
      const progress = targetDuration ? (timeLeft / targetDuration) * 100 : 0
      return (
        <div className="relative w-full h-16 rounded-2xl bg-zinc-900 border border-blue-500/30 flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-blue-500/10 transition-all duration-1000" 
            style={{ width: `${100 - progress}%` }}
          />
          <div className="relative z-10 flex items-center gap-3">
            <Timer className="h-6 w-6 text-blue-400 animate-pulse" />
            <span className="text-3xl font-mono font-bold text-white tracking-wider">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      )
    }

    return (
      <Button
        onClick={onComplete}
        disabled={submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-16 rounded-2xl text-lg animate-in zoom-in duration-300"
      >
        {isLastExercise ? (
          <>
            <CheckCircle2 className="h-6 w-6 mr-3" />
            FINALIZAR
          </>
        ) : (
          <>
            CONTINUAR
            <ChevronRight className="h-6 w-6 ml-3" />
          </>
        )}
      </Button>
    )
  }

  // ── Render Reps Exercise ─────────────────────────────────────────────────

  return (
    <Button
      onClick={onComplete}
      disabled={submitting}
      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-20 rounded-2xl text-xl shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all"
    >
      <CheckCircle className="h-7 w-7 mr-3" />
      COMPLETADO
    </Button>
  )
}
