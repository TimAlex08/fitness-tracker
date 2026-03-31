import type {
  Exercise,
  ExerciseFamily,
  Collection,
  Program,
  ProgramRoutine,
  ScheduleOverride,
  Routine,
  RoutineExercise,
  DailyLog,
  ExerciseLog,
  BodyMeasurement,
  MuscleGroup,
  MovementType,
  ExerciseCategory,
  JointStress,
  SessionType,
  CompletionStatus,
  FormQuality,
  FamilyRole,
  ScheduleOverrideType,
  SessionSource,
} from "@prisma/client"

// ─── Re-export Prisma enums ───────────────────────────────────────────────────

export type {
  MuscleGroup,
  MovementType,
  ExerciseCategory,
  JointStress,
  SessionType,
  CompletionStatus,
  FormQuality,
  FamilyRole,
  ScheduleOverrideType,
  SessionSource,
}

// ─── Re-export model types ────────────────────────────────────────────────────

export type {
  Exercise,
  ExerciseFamily,
  Collection,
  Program,
  ProgramRoutine,
  ScheduleOverride,
  Routine,
  RoutineExercise,
  DailyLog,
  ExerciseLog,
  BodyMeasurement,
}

// ─── Exercise with family ─────────────────────────────────────────────────────

export interface ExerciseWithFamily extends Exercise {
  family: ExerciseFamily | null
}

export interface ExerciseWithLogs extends Exercise {
  exerciseLogs: ExerciseLog[]
}

// ─── Routine with exercises ───────────────────────────────────────────────────

export interface RoutineExerciseWithDetails extends RoutineExercise {
  exercise: Exercise
}

export interface RoutineWithExercises extends Routine {
  exercises: RoutineExerciseWithDetails[]
}

// ─── ProgramRoutine with routine and overrides ────────────────────────────────

export interface ProgramRoutineWithDetails extends ProgramRoutine {
  routine: RoutineWithExercises
  overrides: ScheduleOverride[]
}

// ─── Program with routines ────────────────────────────────────────────────────

export interface ProgramWithRoutines extends Program {
  programRoutines: ProgramRoutineWithDetails[]
}

// ─── Collection with programs ─────────────────────────────────────────────────

export interface CollectionWithPrograms extends Collection {
  programs: Program[]
}

// ─── DailyLog with exercises ──────────────────────────────────────────────────

export interface ExerciseLogWithExercise extends ExerciseLog {
  exercise: Exercise
}

export interface DailyLogWithExercises extends DailyLog {
  routine: Routine | null
  exerciseLogs: ExerciseLogWithExercise[]
}

// ─── /today response ─────────────────────────────────────────────────────────

export interface TodayRoutineEntry {
  routineId: string
  programRoutineId: string
  source: "PATTERN" | "OVERRIDE_ADDED" | "OVERRIDE_MOVED"
  routine: RoutineWithExercises
}

export interface TodayResponse {
  entries: TodayRoutineEntry[]
  dailyLogs: DailyLogWithExercises[]
  isRestDay: boolean
}

// ─── Exercise block (UI grouping) ─────────────────────────────────────────────

export interface ExerciseBlock {
  name: string
  exercises: RoutineExerciseWithDetails[]
}

// ─── Reps parsed ─────────────────────────────────────────────────────────────

export type RepsPerSet = number[]