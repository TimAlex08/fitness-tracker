"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { getCenteredWeek } from "../utils/training-grid"
import { DayCell } from "./day-cell"
import type { DayStatus } from "../types/training.types"
import Link from "next/link"

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface WeeklyStripProps {
  currentDate?: Date
  daysData?: { date: string; status: DayStatus }[]
  className?: string
  // NUEVAS props (opcionales — retrocompatible):
  selectedDate?: string          // fecha activa controlada externamente
  onDaySelect?: (date: string) => void  // callback en lugar de navegar
}

export function WeeklyStrip({ 
  currentDate = new Date(), 
  daysData = [], 
  className,
  selectedDate,
  onDaySelect
}: WeeklyStripProps) {
  const weekDays = getCenteredWeek(currentDate)
  const todayStr = new Date().toISOString().split("T")[0]
  const activeDate = selectedDate ?? todayStr

  return (
    <div className={cn("w-full bg-zinc-950 py-4 border-b border-zinc-900 sticky top-0 z-10 backdrop-blur-md bg-zinc-950/80", className)}>
      <div className="max-w-md mx-auto px-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const dateStr = date.toISOString().split("T")[0]
            const isToday = dateStr === todayStr
            const isSelected = dateStr === activeDate
            const dayData = daysData.find((d) => d.date === dateStr)
            const status = dayData?.status ?? "PENDING"
            const dayName = DAY_LABELS[date.getDay()]
            const dayNum = date.getDate()

            const content = (
              <>
                <span className={cn(
                  "text-[10px] uppercase font-bold tracking-widest transition-colors",
                  isSelected ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"
                )}>
                  {dayName}
                </span>
                
                <DayCell 
                  status={status} 
                  isToday={isToday} 
                  size="md"
                  className={cn(
                    isSelected && "ring-2 ring-offset-2 ring-white/20 shadow-[0_2px_8px] shadow-emerald-500/45"
                  )}
                />

                <span className={cn(
                  "text-xs font-bold transition-colors",
                  isSelected ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                )}>
                  {dayNum}
                </span>
              </>
            )

            if (onDaySelect) {
              return (
                <button
                  key={dateStr}
                  onClick={() => onDaySelect(dateStr)}
                  className={cn(
                    "flex flex-col items-center gap-2 group transition-all p-1 rounded-2xl w-full",
                    isSelected ? "bg-white/5 border border-white/10" : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  {content}
                </button>
              )
            }

            return (
              <Link
                key={dateStr}
                href={`/training/session?date=${dateStr}`}
                className={cn(
                  "flex flex-col items-center gap-2 group transition-all p-1 rounded-2xl",
                  isSelected ? "bg-white/5 border border-white/10" : "hover:bg-white/5 border border-transparent"
                )}
              >
                {content}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
