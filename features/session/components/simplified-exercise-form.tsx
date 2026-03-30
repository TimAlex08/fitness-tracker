"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Play, Timer, CheckCircle2, ChevronRight, CheckCircle, Pause, RotateCcw, Minus, Plus, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type SimplifiedExerciseFormProps = {
  isIsometric: boolean
  targetReps?: number | null
  targetDuration?: number | null
  targetString?: string
  tempo?: string | null
  submitting: boolean
  rpeActual?: number | null
  painDuring: number
  onRpe: (rpe: number) => void
  onPain: (pain: number) => void
  onComplete: (actualValue?: number) => void
  isLastExercise?: boolean
}

export function SimplifiedExerciseForm({
  isIsometric,
  targetDuration,
  targetReps,
  targetString,
  tempo,
  submitting,
  rpeActual,
  painDuring,
  onRpe,
  onPain,
  onComplete,
  isLastExercise
}: SimplifiedExerciseFormProps) {
  const [timerStatus, setTimerStatus] = React.useState<"idle" | "running" | "paused" | "finished">("idle")
  const [timeLeft, setTimeLeft] = React.useState(targetDuration ?? 0)
  const [showRepSelector, setShowRepSelector] = React.useState(false)
  const [actualReps, setActualReps] = React.useState(targetReps ?? 10)
  const [flashValue, setFlashValue] = React.useState<{ val: number, type: "rpe" | "pain" } | null>(null)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  // ── Flash Confirmation Logic ─────────────────────────────────────────────
  
  const triggerFlash = (val: number, type: "rpe" | "pain") => {
    setFlashValue({ val, type })
    setTimeout(() => setFlashValue(null), 600)
  }

  const handleRpeSelect = (n: number) => {
    onRpe(n)
    triggerFlash(n, "rpe")
  }

  const handlePainSelect = (n: number) => {
    onPain(n)
    triggerFlash(n, "pain")
  }

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

  return (
    <div className="flex-1 flex w-full overflow-hidden">
      {/* ─── Left Column: RPE (20%) ────────────────────────────────────────── */}
      <div className="w-[20%] flex flex-col border-r border-zinc-900/50 bg-zinc-950/30">
        <div className="h-8 flex items-center justify-center border-b border-zinc-900/50">
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">RPE</span>
        </div>
        <div className="flex-1 flex flex-col">
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
            <button
              key={n}
              onClick={() => handleRpeSelect(n)}
              className={cn(
                "flex-1 text-[10px] font-black transition-all border-b border-zinc-900/30 last:border-0",
                rpeActual === n 
                  ? "bg-emerald-500 text-black" 
                  : "text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Center Column: Action (60%) ─────────────────────────────────────── */}
      <div className="w-[60%] flex flex-col relative">
        {/* Objective Header */}
        <div className="h-8 flex items-center justify-center gap-3 border-b border-zinc-900/50 bg-zinc-900/20">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">{targetString}</span>
          {tempo && (
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">T: {tempo}</span>
          )}
        </div>

        {/* Dynamic Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          {flashValue ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-50 animate-in zoom-in fade-in duration-300 pointer-events-none bg-zinc-950/40 backdrop-blur-sm">
              <span className={cn(
                "text-8xl font-black italic",
                flashValue.type === "rpe" ? "text-emerald-500" : "text-orange-500"
              )}>
                {flashValue.val}
              </span>
              <span className="text-xs font-black uppercase tracking-[0.4em] text-white mt-2">
                {flashValue.type === "rpe" ? "Esfuerzo" : "Dolor"}
              </span>
            </div>
          ) : null}

          {showRepSelector ? (
            <div className="w-full space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex flex-col items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Confirma Reps</span>
                <div className="flex items-center gap-6">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-400"
                    onClick={() => setActualReps(prev => Math.max(0, prev - 1))}
                  >
                    <Minus className="h-6 w-6" />
                  </Button>
                  <span className="text-6xl font-black text-white italic">{actualReps}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-400"
                    onClick={() => setActualReps(prev => prev + 1)}
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic rounded-2xl shadow-lg shadow-emerald-900/20"
                  onClick={() => onComplete(actualReps)}
                  disabled={submitting}
                >
                  GUARDAR
                </Button>
                <button
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400 py-2"
                  onClick={() => setShowRepSelector(false)}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          ) : (isIsometric || targetDuration) ? (
            <div className="w-full flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Tiempo Restante</span>
                <span className={cn(
                  "text-7xl font-mono font-black italic tracking-tighter",
                  timerStatus === "running" ? "text-blue-400" : "text-white"
                )}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <div className="flex gap-4">
                {timerStatus === "idle" || timerStatus === "paused" ? (
                  <Button
                    onClick={startTimer}
                    className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-900/20"
                  >
                    <Play className="h-8 w-8 fill-current ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={pauseTimer}
                    className="h-16 w-16 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center"
                  >
                    <Pause className="h-8 w-8 fill-current" />
                  </Button>
                )}
                <Button
                  onClick={resetTimer}
                  variant="outline"
                  className="h-16 w-16 rounded-full border-zinc-800 bg-zinc-900 text-zinc-500"
                >
                  <RotateCcw className="h-6 w-6" />
                </Button>
              </div>

              <Button
                onClick={handleCompleteTime}
                disabled={submitting}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic rounded-2xl mt-4"
              >
                COMPLETAR
              </Button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-6">
              {!rpeActual && (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl animate-bounce">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Marca tu RPE</span>
                </div>
              )}
              <Button
                onClick={() => setShowRepSelector(true)}
                disabled={submitting}
                className={cn(
                  "w-full h-24 rounded-3xl font-black text-2xl uppercase italic shadow-lg transition-all active:scale-95",
                  rpeActual 
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20" 
                    : "bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed"
                )}
              >
                <CheckCircle className="h-8 w-8 mr-3" />
                COMPLETADO
              </Button>
              {isLastExercise && (
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Último Ejercicio</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Column: Pain (20%) ───────────────────────────────────────── */}
      <div className="w-[20%] flex flex-col border-l border-zinc-900/50 bg-zinc-950/30">
        <div className="h-8 flex items-center justify-center border-b border-zinc-900/50">
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">PAIN</span>
        </div>
        <div className="flex-1 flex flex-col">
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
            <button
              key={n}
              onClick={() => handlePainSelect(n)}
              className={cn(
                "flex-1 text-[10px] font-black transition-all border-b border-zinc-900/30 last:border-0",
                painDuring === n 
                  ? "bg-orange-500 text-black" 
                  : "text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

