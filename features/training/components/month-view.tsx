"use client"

/**
 * MonthView — calendario mensual con visualización "Don't Break the Chain".
 * Los días consecutivos completados/descanso se conectan con una banda horizontal.
 */

import { useState } from "react"
import { ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MonthData, MonthDay, DayStatus } from "@/features/training/types/training.types"
import Link from "next/link"

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

/** 0=Lun, 6=Dom para un Date */
function weekIndex(date: Date): number {
  const d = date.getDay()
  return d === 0 ? 6 : d - 1
}

function isGoodDay(day: MonthDay): boolean {
  return day.status === "COMPLETED" || day.isRest
}

interface MonthViewProps {
  data: MonthData
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
}

export function MonthView({ data, year, month, onMonthChange }: MonthViewProps) {
  const [currentYear, setCurrentYear] = useState(year)
  const [currentMonth, setCurrentMonth] = useState(month)

  function navigate(delta: number) {
    let m = currentMonth + delta
    let y = currentYear
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setCurrentYear(y)
    setCurrentMonth(m)
    onMonthChange(y, m)
  }

  // Build calendar grid with leading padding
  const firstDay = new Date(currentYear, currentMonth - 1, 1)
  const startPadding = weekIndex(firstDay)
  const todayStr = new Date().toISOString().split("T")[0]

  // Map date string → MonthDay for quick lookup
  const dayMap = new Map(data.days.map((d) => [d.date, d]))

  // Grid cells: null = empty, string = date
  const cells: (string | null)[] = [
    ...Array(startPadding).fill(null),
    ...data.days.map((d) => d.date),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-4">
      {/* Header del mes */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-white">
          {MONTH_NAMES[currentMonth - 1]} {currentYear}
        </h2>
        <button
          onClick={() => navigate(1)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Métricas */}
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-1.5 text-orange-400 font-medium">
          <Flame className="h-4 w-4" />
          <span>Racha: {data.currentStreak} días</span>
        </div>
        <span className="text-zinc-500">
          {data.completedDays}/{data.totalPastDays} días
        </span>
        <span className="text-zinc-500">
          Adherencia: {data.adherence}%
        </span>
      </div>

      {/* Cabeceras de días */}
      <div className="overflow-x-auto -mx-4 px-4">
      <div className="grid grid-cols-7 gap-1 min-w-[280px]">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center text-xs text-zinc-600 py-1">
            {h}
          </div>
        ))}

        {/* Celdas del calendario */}
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`pad-${idx}`} />
          }

          const day = dayMap.get(dateStr)
          if (!day) return <div key={dateStr} />

          const dayNum = new Date(dateStr + "T00:00:00").getDate()
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr

          // Chain connectors
          const prevDateStr = cells[idx - 1]
          const nextDateStr = cells[idx + 1]
          const prevDay = prevDateStr ? dayMap.get(prevDateStr) : undefined
          const nextDay = nextDateStr ? dayMap.get(nextDateStr) : undefined

          const chainLeft = !isFuture && isGoodDay(day) && !!prevDay && isGoodDay(prevDay) && !isFuture
          const chainRight = !isFuture && isGoodDay(day) && !!nextDay && isGoodDay(nextDay) && nextDateStr! <= todayStr

          return (
            <Link key={dateStr} href={`/training/session?date=${dateStr}`} className="group">
              <CalendarCell
                date={dayNum}
                status={day.isRest ? "REST" : day.status}
                isToday={isToday}
                isFuture={isFuture}
                chainLeft={chainLeft}
                chainRight={chainRight}
              />
            </Link>
          )
        })}
      </div>
      </div>

      {/* Leyenda */}
      <Legend />
    </div>
  )
}

// ─── CalendarCell ─────────────────────────────────────────────────────────────

const CELL_COLORS: Record<DayStatus, string> = {
  COMPLETED: "bg-emerald-500",
  REST: "bg-emerald-300/50",
  PARTIAL: "bg-yellow-400",
  SKIPPED: "bg-red-500/70",
  PENDING: "border border-zinc-700 bg-transparent",
}

const CHAIN_COLORS: Record<DayStatus, string> = {
  COMPLETED: "bg-emerald-500/30",
  REST: "bg-emerald-300/20",
  PARTIAL: "bg-yellow-400/30",
  SKIPPED: "bg-transparent",
  PENDING: "bg-transparent",
}

interface CalendarCellProps {
  date: number
  status: DayStatus
  isToday: boolean
  isFuture: boolean
  chainLeft: boolean
  chainRight: boolean
}

function CalendarCell({ date, status, isToday, isFuture, chainLeft, chainRight }: CalendarCellProps) {
  const circleClass = isFuture
    ? "border border-zinc-800 bg-transparent"
    : CELL_COLORS[status]

  const chainClass = CHAIN_COLORS[status]

  return (
    <div className="relative flex flex-col items-center py-1">
      {/* Banda de cadena (horizontal) */}
      <div className="absolute inset-y-0 flex items-center w-full pointer-events-none">
        {chainLeft && (
          <div className={cn("h-3 w-1/2", chainClass)} />
        )}
        {!chainLeft && <div className="w-1/2" />}
        {chainRight && (
          <div className={cn("h-3 w-1/2 ml-auto", chainClass)} />
        )}
        {!chainRight && <div className="w-1/2 ml-auto" />}
      </div>

      {/* Círculo del día */}
      <div
        className={cn(
          "relative z-10 w-8 h-8 rounded-full flex items-center justify-center",
          circleClass,
          isToday && "ring-2 ring-white ring-offset-1 ring-offset-zinc-950"
        )}
      >
        <span
          className={cn(
            "text-xs font-medium",
            isFuture
              ? "text-zinc-600"
              : status === "PENDING"
              ? "text-zinc-500"
              : "text-white"
          )}
        >
          {date}
        </span>
      </div>
    </div>
  )
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────

function Legend() {
  const items: { label: string; className: string }[] = [
    { label: "Completado", className: "bg-emerald-500" },
    { label: "Descanso", className: "bg-emerald-300/50 border border-emerald-300/30" },
    { label: "Parcial", className: "bg-yellow-400" },
    { label: "Faltado", className: "bg-red-500/70" },
    { label: "Pendiente", className: "border border-zinc-700" },
  ]

  return (
    <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-800">
      {items.map(({ label, className }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
          <div className={cn("w-3 h-3 rounded-full", className)} />
          {label}
        </div>
      ))}
    </div>
  )
}
