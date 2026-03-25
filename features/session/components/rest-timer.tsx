"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Timer, X } from "lucide-react"

type RestTimerProps = {
  seconds: number
  onDismiss: () => void
}

export function RestTimer({ seconds, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      onDismiss()
      return
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [remaining, onDismiss])

  const pct = ((seconds - remaining) / seconds) * 100

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Timer className="h-4 w-4" />
          <span className="text-sm font-medium">Descanso</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-7 w-7 p-0 text-zinc-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Countdown */}
      <div className="text-center mb-3">
        <span className="text-4xl font-mono font-bold text-white">
          {String(Math.floor(remaining / 60)).padStart(2, "0")}:
          {String(remaining % 60).padStart(2, "0")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="w-full mt-3 text-xs text-zinc-400 hover:text-white"
      >
        Saltar descanso
      </Button>
    </div>
  )
}
