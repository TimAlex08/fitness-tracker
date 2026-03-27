import type {
  Exercise,
  Program,
  Phase,
  Routine,
  RoutineExercise,
  ProgramDay,
  ExerciseOverride,
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
} from "@prisma/client"

// ---------- Re-export Prisma enums ---------- //

export type {
  MuscleGroup,
  MovementType,
  ExerciseCategory,
  JointStress,
  SessionType,
  CompletionStatus,
  FormQuality,
}

// ---------- Re-export model types ---------- //

export type {
  Exercise,
  Program,
  Phase,
  Routine,
  RoutineExercise,
  ProgramDay,
  ExerciseOverride,
  DailyLog,
  ExerciseLog,
  BodyMeasurement,
}

// ---------- Ejercicio con relaciones ---------- //

export interface ExerciseWithVariants extends Exercise {
  parent: Exercise | null
  variants: Exercise[]
}

export interface ExerciseWithLogs extends Exercise {
  exerciseLogs: ExerciseLog[]
}

// ---------- Rutina con ejercicios ---------- //

export interface RoutineExerciseWithDetails extends RoutineExercise {
  exercise: Exercise
}

export interface RoutineWithExercises extends Routine {
  exercises: RoutineExerciseWithDetails[]
}

// ---------- ProgramDay con rutina y overrides ---------- //

export interface ProgramDayWithRoutine extends ProgramDay {
  routine: RoutineWithExercises
  overrides: ExerciseOverride[]
}

// ---------- Programa con jerarquía completa ---------- //

export interface PhaseWithDays extends Phase {
  programDays: ProgramDayWithRoutine[]
}

export interface ProgramWithPhases extends Program {
  phases: PhaseWithDays[]
}

// ---------- DailyLog con ejercicios ---------- //

export interface ExerciseLogWithExercise extends ExerciseLog {
  exercise: Exercise
}

export interface DailyLogWithExercises extends DailyLog {
  routine: Routine | null
  exerciseLogs: ExerciseLogWithExercise[]
}

// ---------- /today response ---------- //

export interface TodayResponse {
  routine: RoutineWithExercises | null
  dailyLog: DailyLogWithExercises | null
  isFreeDay: boolean
}

// ---------- Bloque de ejercicios (agrupación UI) ---------- //

export interface ExerciseBlock {
  name: string
  exercises: RoutineExerciseWithDetails[]
}

// ---------- Reps parsed ---------- //

export type RepsPerSet = number[]
