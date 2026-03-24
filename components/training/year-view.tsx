"use client"

/**
 * YearView — heatmap anual estilo GitHub.
 * Muestra una celda por día del año, coloreada según estado.
 * Eje X: semanas, Eje Y: días de semana (Lun–Dom).
 */

import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildYearGrid } from "@/lib/training"
import type { YearData, DayStatus, HeatmapCell } from "@/types/training"

const MONTH_NAMES_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]
const DAY_LABELS = ["Lun", "", "Mié", "", "Vie", "", "Dom"]

const CELL_COLORS: Record<DayStatus, string> = {
  COMPLETED: "bg-emerald-500 hover:bg-emerald-400",
  REST: "bg-emerald-300/40 hover:bg-emerald-300/60",
  PARTIAL: "bg-yellow-400 hover:bg-yellow-300",
  SKIPPED: "bg-red-500/60 hover:bg-red-500/80",
  PENDING: "bg-zinc-800 hover:bg-zinc-700",
}

interface YearViewProps {
  data: YearData
  year: number
}

export function YearView({ data, year }: YearViewProps) {
  const weeks = buildYearGrid(data.days)
  const { totalSessions, currentStreak, maxStreak } = data.summary

  // Calcular posición de labels de meses
  const monthLabels = getMonthLabels(data.days, weeks.length)

  return (
    <div className="space-y-4">
      {/* Header con métricas */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <h2 className="text-lg font-semibold text-white">{year}</h2>
        <span className="text-zinc-400">{totalSessions} sesiones</span>
        <div className="flex items-center gap-1 text-orange-400 font-medium">
          <Flame className="h-4 w-4" />
          <span>Racha: {currentStreak} días</span>
        </div>
        <span className="text-zinc-500">Máxima: {maxStreak} días</span>
      </div>

      {/* Grid del heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Labels de meses */}
          <div className="flex gap-1 pl-8">
            {weeks.map((_, weekIdx) => {
              const label = monthLabels.get(weekIdx)
              return (
                <div key={weekIdx} className="w-3 text-xs text-zinc-600">
                  {label ?? ""}
                </div>
              )
            })}
          </div>

          {/* Filas por día de semana */}
          {Array.from({ length: 7 }, (_, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-1">
              {/* Label del día */}
              <div className="w-7 text-right text-xs text-zinc-600 pr-1 shrink-0">
                {DAY_LABELS[rowIdx]}
              </div>

              {/* Celdas */}
              {weeks.map((week, weekIdx) => {
                const cell = week[rowIdx]
                return (
                  <HeatmapSquare
                    key={`${weekIdx}-${rowIdx}`}
                    cell={cell}
                    year={year}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
        <span>Menos</span>
        {(["PENDING", "PARTIAL", "COMPLETED", "REST"] as DayStatus[]).map((s) => (
          <div
            key={s}
            className={cn("w-3 h-3 rounded-sm", CELL_COLORS[s].split(" ")[0])}
          />
        ))}
        <span>Más</span>
      </div>
    </div>
  )
}

// ─── Celda individual del heatmap ─────────────────────────────────────────────

function HeatmapSquare({ cell, year }: { cell: HeatmapCell; year: number }) {
  if (!cell.date) {
    return <div className="w-3 h-3" />
  }

  const status = cell.isRest ? "REST" : (cell.status ?? "PENDING")
  const label = formatTooltip(cell.date, status, year)

  return (
    <div
      title={label}
      className={cn(
        "w-3 h-3 rounded-sm transition-colors cursor-default",
        CELL_COLORS[status]
      )}
    />
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTooltip(dateStr: string, status: DayStatus, year: number): string {
  const date = new Date(dateStr + "T00:00:00")
  const formatted = date.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  const statusLabels: Record<DayStatus, string> = {
    COMPLETED: "Completado",
    REST: "Descanso",
    PARTIAL: "Parcial",
    SKIPPED: "Faltado",
    PENDING: "Pendiente",
  }
  return `${formatted} — ${statusLabels[status]}`
}

/**
 * Calcula qué semana (índice de columna) corresponde al inicio de cada mes.
 * Devuelve un Map<weekIndex, monthLabel>.
 */
function getMonthLabels(
  days: { date: string }[],
  totalWeeks: number
): Map<number, string> {
  const labels = new Map<number, string>()
  if (days.length === 0) return labels

  const year = new Date(days[0].date + "T00:00:00").getFullYear()
  const jan1 = new Date(year, 0, 1)
  const jan1WeekOffset = (() => {
    const d = jan1.getDay()
    return d === 0 ? 6 : d - 1
  })()

  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(year, m, 1)
    const dayOfYear = Math.floor(
      (monthStart.getTime() - jan1.getTime()) / 86400000
    )
    const weekIdx = Math.floor((dayOfYear + jan1WeekOffset) / 7)
    if (weekIdx < totalWeeks) {
      labels.set(weekIdx, MONTH_NAMES_SHORT[m])
    }
  }

  return labels
}
