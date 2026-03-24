/**
 * Utilidades puras de training — sin imports de Prisma.
 * Seguro para usar en Client Components.
 */

import type { YearDay, HeatmapCell, HeatmapWeek } from "@/types/training"

/** JS getDay() (0=Dom) → índice europeo (0=Lun, 6=Dom) */
function jsDayToWeekIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

/**
 * Convierte el array lineal de días en una matriz de semanas para el heatmap.
 * Cada semana tiene 7 celdas (Lun–Dom). Se añaden celdas vacías al inicio
 * para alinear el primer día del año con su día de semana correcto.
 */
export function buildYearGrid(days: YearDay[]): HeatmapWeek[] {
  if (days.length === 0) return []

  const firstDate = new Date(days[0].date + "T00:00:00")
  const startPadding = jsDayToWeekIndex(firstDate.getDay())

  const cells: HeatmapCell[] = []

  for (let i = 0; i < startPadding; i++) {
    cells.push({ date: null, status: null, isRest: false })
  }

  for (const day of days) {
    cells.push({ date: day.date, status: day.status, isRest: day.isRest })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, status: null, isRest: false })
  }

  const weeks: HeatmapWeek[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return weeks
}
