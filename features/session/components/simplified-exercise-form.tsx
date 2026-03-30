"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Play, Timer, CheckCircle2, ChevronRight, CheckCircle, Pause, RotateCcw, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

type SimplifiedExerciseFormProps = {
  isIsometric: boolean
  targetReps?: number | null
  targetDuration?: number | null
  submitting: boolean
  onComplete: (actualValue?: number) => void
  isLastExercise?: boolean
}

export function SimplifiedExerciseForm({
  isIsometric,
  targetDuration,
  targetReps,
  submitting,
  onComplete,
  isLastExercise
}: SimplifiedExerciseFormProps) {
  const [timerStatus, setTimerStatus] = React.useState<"idle" | "running" | "paused" | "finished">("idle")
  const [timeLeft, setTimeLeft] = React.useState(targetDuration ?? 0)
  const [showRepSelector, setShowRepSelector] = React.useState(false)
  const [actualReps, setActualReps] = React.useState(targetReps ?? 10)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  // ── Timer Logic ──────────────────────────────────────────────────────────

  const startTimer = React.useCallback(() => {
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
  }, [])

  const pauseTimer = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerStatus("paused")
  }, [])

  const resetTimer = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerStatus("idle")
    setTimeLeft(targetDuration ?? 0)
  }, [targetDuration])

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

  const handleCompleteTime = () => {
    const actualDuration = (targetDuration ?? 0) - timeLeft
    onComplete(actualDuration)
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

    if (timerStatus === "running" || timerStatus === "paused") {
      const progress = targetDuration ? (timeLeft / targetDuration) * 100 : 0
      return (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="relative w-full h-20 rounded-2xl bg-zinc-900 border border-blue-500/30 flex items-center justify-between px-6 overflow-hidden">
            <div 
              className="absolute inset-0 bg-blue-500/10 transition-all duration-1000" 
              style={{ width: `${100 - progress}%` }}
            />
            <div className="relative z-10 flex items-center gap-3">
              <Timer className={cn("h-6 w-6 text-blue-400", timerStatus === "running" && "animate-pulse")} />
              <span className="text-4xl font-mono font-bold text-white tracking-wider">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="relative z-10 flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={timerStatus === "running" ? pauseTimer : startTimer}
                className="h-10 w-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white"
              >
                {timerStatus === "running" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={resetTimer}
                className="h-10 w-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleCompleteTime}
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-14 rounded-2xl text-base"
          >
            COMPLETAR AHORA
          </Button>
        </div>
      )
    }

    return (
      <Button
        onClick={() => onComplete(targetDuration ?? 0)}
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

  if (showRepSelector) {
    return (
      <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest text-center mb-4">Confirmar Repeticiones</p>
          <div className="flex items-center justify-center gap-8">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl border-zinc-700 text-zinc-400"
              onClick={() => setActualReps(prev => Math.max(0, prev - 1))}
            >
              <Minus className="h-6 w-6" />
            </Button>
            <span className="text-5xl font-black text-white min-w-[3ch] text-center">{actualReps}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl border-zinc-700 text-zinc-400"
              onClick={() => setActualReps(prev => prev + 1)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 h-14 rounded-xl text-zinc-500 font-bold"
            onClick={() => setShowRepSelector(false)}
          >
            CANCELAR
          </Button>
          <Button
            className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20"
            onClick={() => onComplete(actualReps)}
            disabled={submitting}
          >
            GUARDAR Y CONTINUAR
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button
      onClick={() => setShowRepSelector(true)}
      disabled={submitting}
      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-20 rounded-2xl text-xl shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all group"
    >
      <CheckCircle className="h-7 w-7 mr-3 group-hover:scale-110 transition-transform" />
      COMPLETADO
    </Button>
  )
}
