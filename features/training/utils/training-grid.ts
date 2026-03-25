/**
 * Utilidades puras de training — sin imports de Prisma.
 * Seguro para usar en Client Components y Server Components.
 */

import type { YearDay, HeatmapCell, HeatmapWeek, DayStatus } from "@/features/training/types/training.types"

/** JS getDay() (0=Dom) → índice europeo (0=Lun, 6=Dom) */
function jsDayToWeekIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

/**
 * Calcula racha actual y máxima.
 * Un día "bueno" es COMPLETED o isRest.
 * SKIPPED rompe la racha. PENDING no la afecta.
 */
export function calculateStreak(
  days: { date: string; status: DayStatus; isRest: boolean }[]
): { current: number; max: number } {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const todayStr = new Date().toISOString().split("T")[0]

  let maxStreak = 0
  let run = 0
  for (const day of sorted) {
    if (day.date > todayStr) break
    if (day.status === "COMPLETED" || day.isRest) {
      run++
      maxStreak = Math.max(maxStreak, run)
    } else if (day.status === "SKIPPED") {
      run = 0
    }
  }

  const pastDays = sorted.filter((d) => d.date <= todayStr).reverse()
  let currentStreak = 0
  for (const day of pastDays) {
    if (day.status === "COMPLETED" || day.isRest) {
      currentStreak++
    } else if (day.status === "SKIPPED") {
      break
    }
  }

  return { current: currentStreak, max: maxStreak }
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

/**
 * Retorna un array de 7 fechas centradas en baseDate (3 antes, hoy, 3 después).
 */
export function getCenteredWeek(baseDate: Date): Date[] {
  const days: Date[] = []
  for (let i = -3; i <= 3; i++) {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + i)
    days.push(d)
  }
  return days
}
