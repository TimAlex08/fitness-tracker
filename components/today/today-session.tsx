"use client"

import { useState, useCallback } from "react"
import type { RoutineWithExercises, DailyLogWithExercises } from "@/types"
import {
  ExerciseSessionCard,
  type ExerciseState,
  type SetLog,
} from "./exercise-session-card"
import { RestTimer } from "./rest-timer"
import { PostSessionForm, type PostSessionData } from "./post-session-form"
import { CheckCircle2, Dumbbell, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TodaySessionProps = {
  routine: RoutineWithExercises | null
  dailyLog: DailyLogWithExercises | null
}

type RestTimerState = {
  seconds: number
  visible: boolean
}

type SessionPhase = "training" | "post-session" | "done"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initExerciseState(
  numSets: number,
  existingLog?: { repsPerSet?: string | null; rpeActual?: number | null; painDuring?: number | null; notes?: string | null; completed: boolean }
): ExerciseState {
  const sets: SetLog[] = Array.from({ length: numSets }, (_, i) => {
    const existingReps = existingLog?.repsPerSet
      ? (JSON.parse(existingLog.repsPerSet) as number[])[i] ?? 0
      : 0
    return { reps: existingReps }
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

const BLOCK_LABEL: Record<string, string> = {
  warmup: "Calentamiento",
  main: "Bloque principal",
  cooldown: "Vuelta a la calma",
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function TodaySession({ routine, dailyLog }: TodaySessionProps) {
  // ── Estado de sesión ──────────────────────────────────────────────────────
  const [dailyLogId, setDailyLogId] = useState<string | null>(
    dailyLog?.id ?? null
  )
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>(() => {
    if (dailyLog?.status === "COMPLETED") return "done"
    return "training"
  })
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    seconds: 60,
    visible: false,
  })

  // ── Estado de ejercicios ──────────────────────────────────────────────────
  const [exerciseStates, setExerciseStates] = useState<
    Record<string, ExerciseState>
  >(() => {
    if (!routine) return {}
    const map: Record<string, ExerciseState> = {}
    for (const re of routine.exercises) {
      const numSets = re.sets ?? re.exercise.defaultSets ?? 3
      const existingLog = dailyLog?.exerciseLogs.find(
        (l) => l.exerciseId === re.exerciseId
      )
      map[re.id] = initExerciseState(numSets, existingLog ?? undefined)
    }
    return map
  })

  // ── Mutadores de estado ───────────────────────────────────────────────────

  function updateExercise(reId: string, patch: Partial<ExerciseState>) {
    setExerciseStates((prev) => ({
      ...prev,
      [reId]: { ...prev[reId], ...patch },
    }))
  }

  const handleSetReps = useCallback(
    (reId: string, setIdx: number, reps: number) => {
      setExerciseStates((prev) => {
        const sets = [...prev[reId].sets]
        sets[setIdx] = { ...sets[setIdx], reps }
        return { ...prev, [reId]: { ...prev[reId], sets } }
      })
    },
    []
  )

  // ── Asegurar DailyLog existe antes de guardar ─────────────────────────────

  async function ensureDailyLog(routineId: string): Promise<string> {
    if (dailyLogId) return dailyLogId

    const res = await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routineId,
        status: "PENDING",
        startedAt: new Date().toISOString(),
      }),
    })
    const log = await res.json()
    setDailyLogId(log.id)
    return log.id
  }

  // ── Completar ejercicio ───────────────────────────────────────────────────

  const handleCompleteExercise = useCallback(
    async (reId: string, routineExercise: RoutineWithExercises["exercises"][0]) => {
      if (!routine) return
      updateExercise(reId, { submitting: true })

      try {
        const logId = await ensureDailyLog(routine.id)
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

        // Show rest timer
        const restSec =
          routineExercise.restSec ??
          routineExercise.exercise.defaultRestSec ??
          60
        setRestTimer({ seconds: restSec, visible: true })
      } catch (err) {
        console.error("Error completing exercise:", err)
        updateExercise(reId, { submitting: false })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routine, exerciseStates, dailyLogId]
  )

  // ── Finalizar sesión ──────────────────────────────────────────────────────

  async function handleFinishSession(postData: PostSessionData) {
    if (!dailyLogId && routine) {
      await ensureDailyLog(routine.id)
    }

    const completedCount = Object.values(exerciseStates).filter(
      (s) => s.completed
    ).length
    const total = routine?.exercises.length ?? 0
    const status =
      completedCount === 0
        ? "SKIPPED"
        : completedCount === total
          ? "COMPLETED"
          : "PARTIAL"

    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routineId: routine?.id,
        status,
        finishedAt: new Date().toISOString(),
        ...postData,
      }),
    })

    setSessionPhase("done")
  }

  // ── Render: sin rutina ────────────────────────────────────────────────────

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <Dumbbell className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-zinc-400 text-sm mb-1">Hoy no toca sesión principal</p>
        <p className="text-zinc-600 text-xs">
          Aprovecha para hacer tu rutina de Movilidad Diaria.
        </p>
      </div>
    )
  }

  // ── Render: sesión completada ─────────────────────────────────────────────

  if (sessionPhase === "done") {
    const completedCount = Object.values(exerciseStates).filter(
      (s) => s.completed
    ).length
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
          <Trophy className="h-7 w-7 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">
          ¡Sesión completada!
        </h2>
        <p className="text-zinc-400 text-sm">
          {completedCount} de {routine.exercises.length} ejercicios realizados.
        </p>
      </div>
    )
  }

  // ── Render: post-sesión ───────────────────────────────────────────────────

  if (sessionPhase === "post-session") {
    return <PostSessionForm onSubmit={handleFinishSession} />
  }

  // ── Render: entrenamiento ─────────────────────────────────────────────────

  const completedCount = Object.values(exerciseStates).filter(
    (s) => s.completed
  ).length
  const totalCount = routine.exercises.length
  const progressPct = (completedCount / totalCount) * 100

  // Agrupar ejercicios por bloque
  const blocks = routine.exercises.reduce<
    Record<string, typeof routine.exercises>
  >((acc, re) => {
    const block = re.block ?? "main"
    if (!acc[block]) acc[block] = []
    acc[block].push(re)
    return acc
  }, {})

  const blockOrder = ["warmup", "main", "cooldown"]
  const sortedBlocks = Object.entries(blocks).sort(
    ([a], [b]) => blockOrder.indexOf(a) - blockOrder.indexOf(b)
  )

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Progreso</span>
          <span className="text-xs text-zinc-400">
            {completedCount}/{totalCount} ejercicios
          </span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Rest timer */}
      {restTimer.visible && (
        <RestTimer
          seconds={restTimer.seconds}
          onDismiss={() => setRestTimer((t) => ({ ...t, visible: false }))}
        />
      )}

      {/* Exercise blocks */}
      {sortedBlocks.map(([block, exercises]) => (
        <div key={block}>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 px-1">
            {BLOCK_LABEL[block] ?? block}
          </p>
          <div className="space-y-3">
            {exercises.map((re) => (
              <ExerciseSessionCard
                key={re.id}
                routineExercise={re}
                state={exerciseStates[re.id]}
                onSetReps={(setIdx, reps) => handleSetReps(re.id, setIdx, reps)}
                onRpe={(rpe) => updateExercise(re.id, { rpeActual: rpe })}
                onPain={(pain) => updateExercise(re.id, { painDuring: pain })}
                onNotes={(notes) => updateExercise(re.id, { notes })}
                onComplete={() => handleCompleteExercise(re.id, re)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Finish session button */}
      <div className="pt-2 pb-6">
        {completedCount === totalCount ? (
          <Button
            onClick={() => setSessionPhase("post-session")}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Finalizar sesión
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setSessionPhase("post-session")}
            className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
          >
            Terminar sesión ({completedCount}/{totalCount} ejercicios)
          </Button>
        )}
      </div>
    </div>
  )
}
