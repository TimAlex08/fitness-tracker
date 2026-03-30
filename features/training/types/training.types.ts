import type { CompletionStatus, SessionType } from "@prisma/client"

// DayStatus extends CompletionStatus with REST (día sin rutina asignada)
export type DayStatus = CompletionStatus | "REST"

export interface RoutineSummary {
  id: string
  name: string
  exerciseCount: number
  estimatedDuration: number | null
  rpeTarget: string | null
  sessionType: SessionType
  exercises?: { name: string; sets: number | null; reps: number | null }[]
}

export interface DailyLogSummary {
  status: CompletionStatus
  rpeActual: number | null
  durationMin: number | null
  exercisesCompleted: number
}

// ─── Week ──────────────────────────────────────────────────────────────────────

export interface WeekDay {
  date: string         // ISO YYYY-MM-DD
  dayOfWeek: number    // 0 = Monday, 6 = Sunday
  isToday: boolean
  isRest: boolean
  routine: RoutineSummary | null
  dailyLog: DailyLogSummary | null
}

export interface WeekData {
  weekNumber: number
  year: number
  month: string        // e.g. "marzo"
  days: WeekDay[]
}

// ─── Month ─────────────────────────────────────────────────────────────────────

export interface MonthDay {
  date: string
  status: DayStatus
  isRest: boolean
}

export interface MonthData {
  days: MonthDay[]
  currentStreak: number
  adherence: number     // 0–100 percentage
  completedDays: number
  totalPastDays: number
}

// ─── Year ──────────────────────────────────────────────────────────────────────

export interface YearDay {
  date: string
  status: DayStatus
  isRest: boolean
}

export interface YearSummary {
  totalSessions: number
  currentStreak: number
  maxStreak: number
}

export interface YearData {
  days: YearDay[]
  summary: YearSummary
}

// ─── Heatmap grid ──────────────────────────────────────────────────────────────

export interface HeatmapCell {
  date: string | null    // null = padding cell
  status: DayStatus | null
  isRest: boolean
}

export type HeatmapWeek = HeatmapCell[]  // always 7 cells (Mon–Sun)
