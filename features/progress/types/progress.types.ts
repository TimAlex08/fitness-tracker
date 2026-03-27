export interface ProgressStats {
  streak: number
  sessionsThisMonth: number
  adherencePercent: number
  avgRpe: number | null
}

export interface WeeklyVolume {
  weekLabel: string
  weekStart: string // ISO date "YYYY-MM-DD"
  exercisesCompleted: number
  setsCompleted: number
}

export interface ExerciseSession {
  date: string
  reps: number[]
  rpeActual: number | null
  painDuring: number | null
  formQuality: string | null
}

export interface ExerciseProgression {
  exerciseId: string
  exerciseName: string
  sessions: ExerciseSession[]
}

export interface WeeklyPain {
  weekLabel: string
  avgPain: number | null
}

export interface PhaseInfo {
  name: string
  rpeTarget: string | null
  weekStart: number | null
  weekEnd: number | null
}

export interface ProgressData {
  stats: ProgressStats
  weeklyVolume: WeeklyVolume[]
  exerciseProgressions: ExerciseProgression[]
  weeklyPain: WeeklyPain[]
  phase: PhaseInfo | null
}
