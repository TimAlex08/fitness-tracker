"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FocusProgressBarProps {
  current: number
  total: number
  className?: string
}

export function FocusProgressBar({ current, total, className }: FocusProgressBarProps) {
  const percentage = Math.min(Math.max((current / total) * 100, 0), 100)

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex justify-between items-end">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Progreso de sesión
        </span>
        <span className="text-sm font-bold text-white">
          {current} <span className="text-zinc-500 font-normal">/ {total}</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
