"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { CompletionStatus } from "@/types"
import type { RoutineSummary } from "@/features/training/types/training.types"

interface TrainingDayCardProps {
  routine: RoutineSummary
  status: CompletionStatus | null
  isToday: boolean
  selectedDate: string
}

export function TrainingDayCard({ routine, status, isToday, selectedDate }: TrainingDayCardProps) {
  const getStatusLabel = (status: CompletionStatus | null) => {
    switch (status) {
      case "COMPLETED": return { label: "Completada ✓", class: "bg-emerald-500/15 text-emerald-400" }
      case "PARTIAL": return { label: "En progreso", class: "bg-yellow-500/15 text-yellow-400" }
      case "SKIPPED": return { label: "Saltada", class: "bg-red-500/15 text-red-400" }
      default: return { label: "Sin iniciar", class: "bg-zinc-800 text-zinc-400" }
    }
  }

  const statusInfo = getStatusLabel(status)

  return (
    <div className={cn(
      "rounded-2xl bg-zinc-900 border border-emerald-500/20 p-6 lg:p-10",
      "shadow-[0_8px_40px_0] shadow-emerald-500/7 flex flex-col justify-between h-full min-h-[400px] lg:min-h-[500px] relative overflow-hidden"
    )}>
      {/* Glow gradient wash */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

      <div className="relative space-y-6 lg:space-y-8">
        <div className="space-y-1.5">
          <span className="text-[10px] lg:text-[11px] uppercase tracking-[2px] text-zinc-500 font-bold">
            Sesión de {isToday ? "hoy" : "ese día"}
          </span>
          <h2 className="text-[28px] lg:text-[38px] font-extrabold text-white leading-tight tracking-tight">
            {routine.name}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[13px] lg:text-sm text-zinc-500 font-medium">
              {routine.exerciseCount} ejercicios · RPE objetivo {routine.rpeTarget ?? "6-7"}
            </span>
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] lg:text-[11px] font-bold uppercase tracking-wider",
              statusInfo.class
            )}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Preview lista ejercicios (Desktop) */}
        <div className="hidden lg:block space-y-4">
          <div className="h-px bg-zinc-800/50 w-full" />
          <div className="space-y-3">
            {routine.exercises?.slice(0, 3).map((ex, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-[3px] h-3 bg-emerald-500 rounded-full shadow-[0_0_4px] shadow-emerald-500/50" />
                <span className="text-zinc-300 text-sm font-medium">{ex.name}</span>
                <span className="text-zinc-600 text-xs ml-auto">
                  {ex.sets || 3}×{ex.reps || 10}
                </span>
              </div>
            )) || (
              <div className="text-zinc-600 text-xs italic">Previsualización no disponible</div>
            )}
            {routine.exerciseCount > 3 && (
              <div className="text-zinc-600 text-[11px] font-medium pl-4">
                + {routine.exerciseCount - 3} ejercicios más
              </div>
            )}
          </div>
        </div>
      </div>

      <Link
        href={isToday ? "/today" : `/training/session?date=${selectedDate}`}
        className={cn(
          "mt-8 w-full h-[54px] lg:h-[56px] flex items-center justify-center rounded-xl",
          "bg-emerald-500 text-black font-bold text-base transition-all",
          "shadow-[0_6px_20px_0] shadow-emerald-500/30 hover:bg-emerald-400 active:scale-[0.98]"
        )}
      >
        {isToday ? "▶  INICIAR ENTRENAMIENTO" : "Ver sesión"}
      </Link>
    </div>
  )
}
