"use client"

/**
 * DayCell — celda reutilizable para MonthView y YearView.
 * Muestra un círculo coloreado según el estado del día.
 */

import { cn } from "@/lib/utils"
import type { DayStatus } from "@/types/training"

interface DayCellProps {
  status: DayStatus | null
  isToday?: boolean
  size?: "sm" | "md"
  /** Para heatmap: mostrar tooltip */
  tooltip?: string
}

const STATUS_COLORS: Record<DayStatus, string> = {
  COMPLETED: "bg-emerald-500",
  REST: "bg-emerald-300/60",
  PARTIAL: "bg-yellow-400",
  SKIPPED: "bg-red-500/70",
  PENDING: "bg-zinc-700 border border-zinc-600",
}

export function DayCell({ status, isToday, size = "md", tooltip }: DayCellProps) {
  const sizeClass = size === "sm" ? "w-3 h-3 rounded-sm" : "w-7 h-7 rounded-full"
  const colorClass = status ? STATUS_COLORS[status] : "bg-zinc-800"

  return (
    <div
      title={tooltip}
      className={cn(
        sizeClass,
        colorClass,
        isToday && "ring-2 ring-offset-2 ring-offset-zinc-950 ring-white",
        "transition-opacity"
      )}
    />
  )
}
