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
}

export function WeeklyStrip({ currentDate = new Date(), daysData = [], className }: WeeklyStripProps) {
  const weekDays = getCenteredWeek(currentDate)
  const todayStr = new Date().toISOString().split("T")[0]

  return (
    <div className={cn("w-full bg-zinc-950 py-4 border-b border-zinc-900 sticky top-0 z-10 backdrop-blur-md bg-zinc-950/80", className)}>
      <div className="max-w-md mx-auto px-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const dateStr = date.toISOString().split("T")[0]
            const isToday = dateStr === todayStr
            const dayData = daysData.find((d) => d.date === dateStr)
            const status = dayData?.status ?? "PENDING"
            const dayName = DAY_LABELS[date.getDay()]
            const dayNum = date.getDate()

            return (
              <Link
                key={dateStr}
                href={`/training/session?date=${dateStr}`}
                className={cn(
                  "flex flex-col items-center gap-2 group transition-all p-1 rounded-2xl",
                  isToday ? "bg-white/5 border border-white/10" : "hover:bg-white/5"
                )}
              >
                <span className={cn(
                  "text-[10px] uppercase font-bold tracking-widest",
                  isToday ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"
                )}>
                  {dayName}
                </span>
                
                <DayCell 
                  status={status} 
                  isToday={isToday} 
                  size="md" 
                />

                <span className={cn(
                  "text-xs font-bold",
                  isToday ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                )}>
                  {dayNum}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
