"use client"

import { useState, useCallback } from "react"
import type {
  Exercise,
  RoutineWithExercises,
  DailyLogWithExercises,
  RoutineExerciseWithDetails,
} from "@/types"
import type { ExerciseState, SetLog } from "@/features/session/components/exercise-session-card"
import type { PostSessionData } from "@/features/session/components/post-session-form"
import { calculateCompletionStatus, parseRepsPerSet } from "@/features/session/services/session.service"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SessionPhase = "idle" | "training" | "post-session" | "done"
export type SessionMode = "structured" | "free"
export type ViewMode = "list" | "focus"

type UseSessionStateParams = {
  routine: RoutineWithExercises | null
  dailyLog: DailyLogWithExercises | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initExerciseState(
  numSets: number,
  existingLog?: {
    repsPerSet?: string | null
    rpeActual?: number | null
    painDuring?: number | null
    notes?: string | null
    completed: boolean
  }
): ExerciseState {
  const sets: SetLog[] = Array.from({ length: numSets }, (_, i) => {
    const parsedReps = parseRepsPerSet(existingLog?.repsPerSet); 
    const reps = parsedReps[i] ?? 0
    return { reps }
  })
  return {
    sets,
    rpeActual: existingLog?.rpeActual ?? null,
    painDuring: existingLog?.painDuring ?? 0,
    notes: existingLog?.notes ?? "",
    completed: existingLog?.completed ?? false,
    submitting: false,
  }
}

function toVirtualRoutineExercise(
  exercise: Exercise,
  order: number
): RoutineExerciseWithDetails {
  return {
    id: `free-${exercise.id}`,
    routineId: "",
    exerciseId: exercise.id,
    order,
    block: "main",
    sets: exercise.defaultSets,
    reps: exercise.defaultReps,
    durationSec: exercise.defaultDurationSec,
    restSec: exercise.defaultRestSec,
    tempo: exercise.defaultTempo,
    rpe: exercise.defaultRpe,
    notes: null,
    createdAt: new Date(),
    exercise,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSessionState({ routine, dailyLog }: UseSessionStateParams) {
  const [mode, setMode] = useState<SessionMode>("structured")
  const [viewMode, setViewMode] = useState<ViewMode>("focus") // Default to focus for better mobile experience
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [freeExercises, setFreeExercises] = useState<RoutineExerciseWithDetails[]>([])
  const [dailyLogId, setDailyLogId] = useState<string | null>(dailyLog?.id ?? null)
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>(() => {
    if (dailyLog?.status === "COMPLETED") return "done"
    if (dailyLog?.status === "PENDING" || dailyLog?.status === "PARTIAL") return "training"
    return "idle"
  })
  const [restTimer, setRestTimer] = useState({ seconds: 60, visible: false })
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>(() => {
    if (!routine) return {}
    const map: Record<string, ExerciseState> = {}
    for (const re of routine.exercises) {
      const numSets = re.sets ?? re.exercise.defaultSets ?? 3
      const existingLog = dailyLog?.exerciseLogs.find((l) => l.exerciseId === re.exerciseId)
      map[re.id] = initExerciseState(numSets, existingLog ?? undefined)
    }
    return map
  })

  const updateExercise = useCallback((reId: string, patch: Partial<ExerciseState>) => {
    setExerciseStates((prev) => ({ ...prev, [reId]: { ...prev[reId], ...patch } }))
  }, [])

  const handleSetReps = useCallback((reId: string, setIdx: number, reps: number) => {
    setExerciseStates((prev) => {
      const sets = [...prev[reId].sets]
      sets[setIdx] = { ...sets[setIdx], reps }
      return { ...prev, [reId]: { ...prev[reId], sets } }
    })
  }, [])

  function handleAddExercise(exercise: Exercise) {
    const vRE = toVirtualRoutineExercise(exercise, freeExercises.length)
    const numSets = exercise.defaultSets ?? 3
    setFreeExercises((prev) => [...prev, vRE])
    setExerciseStates((prev) => ({ ...prev, [vRE.id]: initExerciseState(numSets) }))
  }

  function handleRemoveExercise(exerciseId: string) {
    setFreeExercises((prev) => prev.filter((re) => re.exerciseId !== exerciseId))
    setExerciseStates((prev) => {
      const next = { ...prev }
      delete next[`free-${exerciseId}`]
      return next
    })
  }

  function startFreeSession() {
    setMode("free")
    setShowPicker(true)
  }

  async function ensureDailyLog(routineId?: string): Promise<string> {
    if (dailyLogId) return dailyLogId
    const res = await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routineId: routineId ?? null,
        isFreeSession: !routineId,
        status: "PENDING",
        startedAt: new Date().toISOString(),
      }),
    })
    const log = await res.json()
    setDailyLogId(log.id)
    return log.id
  }

  const handleCompleteExercise = useCallback(
    async (reId: string, routineExercise: RoutineExerciseWithDetails, routineId?: string) => {
      updateExercise(reId, { submitting: true })
      try {
        const logId = await ensureDailyLog(routineId)
        const state = exerciseStates[reId]
        await fetch("/api/exercise-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dailyLogId: logId,
            exerciseId: routineExercise.exerciseId,
            setsCompleted: state.sets.filter((s) => s.reps > 0).length,
            repsPerSet: state.sets.map((s) => s.reps),
            rpeActual: state.rpeActual,
            painDuring: state.painDuring,
            notes: state.notes || undefined,
          }),
        })
        updateExercise(reId, { completed: true, submitting: false })
        const restSec = routineExercise.restSec ?? routineExercise.exercise.defaultRestSec ?? 60
        setRestTimer({ seconds: restSec, visible: true })
      } catch (err) {
        console.error("Error completing exercise:", err)
        updateExercise(reId, { submitting: false })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exerciseStates, dailyLogId]
  )

  const dismissRestTimer = useCallback(() => {
    setRestTimer((t) => ({ ...t, visible: false }))
    
    // Auto-advance in Focus Mode
    if (viewMode === "focus") {
      const total = mode === "structured" ? (routine?.exercises.length ?? 0) : freeExercises.length
      if (currentExerciseIndex < total - 1) {
        setCurrentExerciseIndex(prev => prev + 1)
      }
    }
  }, [viewMode, currentExerciseIndex, mode, routine, freeExercises])

  async function handleFinishSession(postData: PostSessionData) {
    const routineId = mode === "structured" ? routine?.id : undefined
    if (!dailyLogId) await ensureDailyLog(routineId)
    const completedCount = Object.values(exerciseStates).filter((s) => s.completed).length
    const total = mode === "structured" ? (routine?.exercises.length ?? 0) : freeExercises.length
    const status = calculateCompletionStatus(completedCount, total)
    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routineId: routineId ?? null,
        isFreeSession: mode === "free",
        status,
        finishedAt: new Date().toISOString(),
        ...postData,
      }),
    })
    setSessionPhase("done")
  }

  return {
    mode,
    viewMode,
    setViewMode,
    currentExerciseIndex,
    setCurrentExerciseIndex,
    sessionPhase,
    setSessionPhase,
    restTimer,
    dismissRestTimer,
    exerciseStates,
    freeExercises,
    showPicker,
    setShowPicker,
    addedIds: new Set(freeExercises.map((re) => re.exerciseId)),
    updateExercise,
    handleSetReps,
    handleAddExercise,
    handleRemoveExercise,
    startFreeSession,
    handleCompleteExercise,
    handleFinishSession,
  }
}

