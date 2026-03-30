"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BackToTodayPillProps {
  onClick: () => void
  className?: string
}

export function BackToTodayPill({ onClick, className }: BackToTodayPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-full",
        "bg-emerald-500/12 border border-emerald-500/30",
        "text-emerald-400 text-xs font-medium",
        "hover:bg-emerald-500/20 active:scale-95 transition-all",
        className
      )}
    >
      ← Hoy
    </button>
  )
}
