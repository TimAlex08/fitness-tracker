"use client"

import * as React from "react"
import { useState } from "react"
import { OverviewHeader } from "./overview-header"
import { WeeklyStrip } from "@/features/training/components/weekly-strip"
import { BackToTodayPill } from "./back-to-today-pill"
import { MetricsPair } from "./metrics-pair"
import { TrainingDayCard } from "./training-day-card"
import { RestDayCard } from "./rest-day-card"
import type { WeekData } from "@/features/training/types/training.types"

interface OverviewDashboardProps {
  weekDays: WeekData["days"]
  streak: number
  sessionsThisMonth: number
}

export function OverviewDashboard({ 
  weekDays, 
  streak, 
  sessionsThisMonth 
}: OverviewDashboardProps) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)

  // Lookup local instantáneo
  const selectedDay = weekDays.find(d => d.date === selectedDate) ?? weekDays[0]
  const isToday = selectedDate === todayStr
  const isRest = selectedDay.isRest

  return (
    <div className="px-5 py-6 lg:px-10 lg:py-8 max-w-6xl mx-auto space-y-6 lg:space-y-8 pb-24 lg:pb-10">
      {/* Header: Fecha + Saludo */}
      <OverviewHeader date={selectedDate} isToday={isToday} />

      {/* Weekly Strip + BackToToday */}
      <div className="relative">
        <WeeklyStrip
          daysData={weekDays.map(d => ({ date: d.date, status: d.dailyLog?.status ?? (d.isRest ? "REST" : "PENDING") }))}
          selectedDate={selectedDate}
          onDaySelect={setSelectedDate}
          className="-mx-5 lg:mx-0 lg:rounded-2xl lg:border border-zinc-900 sticky top-0"
        />
        {!isToday && (
          <div className="absolute top-3 right-3 lg:top-4 lg:right-4 z-20">
            <BackToTodayPill onClick={() => setSelectedDate(todayStr)} />
          </div>
        )}
      </div>

      {/* Grid: Móvil (Métricas arriba), Desktop (2 columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-start">
        
        {/* Columna Métricas (En móvil va arriba del card principal) */}
        <div className="order-first lg:order-last">
          <MetricsPair
            streak={streak}
            sessionsThisMonth={sessionsThisMonth}
            targetSessions={10}
          />
        </div>

        {/* Columna Card Principal (Entrenamiento o Descanso) */}
        <div className="order-last lg:order-first">
          {isRest || !selectedDay.routine ? (
            <RestDayCard isToday={isToday} selectedDate={selectedDate} />
          ) : (
            <TrainingDayCard
              routine={selectedDay.routine}
              status={selectedDay.dailyLog?.status ?? null}
              isToday={isToday}
              selectedDate={selectedDate}
            />
          )}
        </div>
      </div>

      {/* Placeholder Nutrición */}
      <div className="border border-dashed border-zinc-800 rounded-2xl h-16 flex items-center justify-center bg-zinc-950/50">
        <span className="text-xs text-zinc-700 font-medium tracking-wide">+ Nutrición · Próximamente</span>
      </div>
    </div>
  )
}
