"use client"

import { useState, useCallback } from "react"
import type {
  Exercise,
  RoutineWithExercises,
  DailyLogWithExercises,
  RoutineExerciseWithDetails,
} from "@/types"
import {
  ExerciseSessionCard,
  type ExerciseState,
  type SetLog,
} from "./exercise-session-card"
import { ExercisePicker } from "./exercise-picker"
import { RestTimer } from "./rest-timer"
import { PostSessionForm, type PostSessionData } from "./post-session-form"
import {
  CheckCircle2,
  Dumbbell,
  Trophy,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TodaySessionProps = {
  routine: RoutineWithExercises | null
  dailyLog: DailyLogWithExercises | null
  allExercises: Exercise[]
}

type RestTimerState = { seconds: number; visible: boolean }
type SessionPhase = "training" | "post-session" | "done"
type SessionMode = "structured" | "free"

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

/** Convierte un Exercise en un RoutineExerciseWithDetails virtual para la sesión libre */
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

const BLOCK_LABEL: Record<string, string> = {
  warmup: "Calentamiento",
  main: "Bloque principal",
  cooldown: "Vuelta a la calma",
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function TodaySession({
  routine,
  dailyLog,
  allExercises,
}: TodaySessionProps) {
  // ── Modo de sesión ────────────────────────────────────────────────────────
  const [mode, setMode] = useState<SessionMode>("structured")
  const [showPicker, setShowPicker] = useState(false)
  const [freeExercises, setFreeExercises] = useState<
    RoutineExerciseWithDetails[]
  >([])

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

  // ── Estado de ejercicios (tanto estructurado como libre) ──────────────────
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

  // ── Mutadores ─────────────────────────────────────────────────────────────

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

  // ── Añadir / quitar ejercicios (modo libre) ───────────────────────────────

  function handleAddExercise(exercise: Exercise) {
    const order = freeExercises.length
    const vRE = toVirtualRoutineExercise(exercise, order)
    const numSets = exercise.defaultSets ?? 3
    setFreeExercises((prev) => [...prev, vRE])
    setExerciseStates((prev) => ({
      ...prev,
      [vRE.id]: initExerciseState(numSets),
    }))
  }

  function handleRemoveExercise(exerciseId: string) {
    setFreeExercises((prev) => prev.filter((re) => re.exerciseId !== exerciseId))
    setExerciseStates((prev) => {
      const next = { ...prev }
      const key = `free-${exerciseId}`
      delete next[key]
      return next
    })
  }

  const addedIds = new Set(freeExercises.map((re) => re.exerciseId))

  // ── Entrar en modo libre ──────────────────────────────────────────────────

  function startFreeSession() {
    setMode("free")
    setShowPicker(true)
  }

  // ── Asegurar DailyLog ─────────────────────────────────────────────────────

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

  // ── Completar ejercicio ───────────────────────────────────────────────────

  const handleCompleteExercise = useCallback(
    async (
      reId: string,
      routineExercise: RoutineExerciseWithDetails,
      routineId?: string
    ) => {
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
    [exerciseStates, dailyLogId]
  )

  // ── Finalizar sesión ──────────────────────────────────────────────────────

  async function handleFinishSession(postData: PostSessionData) {
    const routineId = mode === "structured" ? routine?.id : undefined
    if (!dailyLogId) await ensureDailyLog(routineId)

    const completedCount = Object.values(exerciseStates).filter(
      (s) => s.completed
    ).length
    const total =
      mode === "structured"
        ? (routine?.exercises.length ?? 0)
        : freeExercises.length

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
        routineId: routineId ?? null,
        isFreeSession: mode === "free",
        status,
        finishedAt: new Date().toISOString(),
        ...postData,
      }),
    })

    setSessionPhase("done")
  }

  // ── Render: sesión completada ─────────────────────────────────────────────

  if (sessionPhase === "done") {
    const completedCount = Object.values(exerciseStates).filter(
      (s) => s.completed
    ).length
    const total =
      mode === "structured"
        ? (routine?.exercises.length ?? 0)
        : freeExercises.length
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
          <Trophy className="h-7 w-7 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">
          ¡Sesión completada!
        </h2>
        <p className="text-zinc-400 text-sm">
          {completedCount} de {total} ejercicios realizados.
        </p>
      </div>
    )
  }

  // ── Render: post-sesión ───────────────────────────────────────────────────

  if (sessionPhase === "post-session") {
    return <PostSessionForm onSubmit={handleFinishSession} />
  }

  // ── Render: modo libre ────────────────────────────────────────────────────

  if (mode === "free") {
    const completedCount = Object.values(exerciseStates).filter(
      (s) => s.completed
    ).length
    const total = freeExercises.length
    const progressPct = total > 0 ? (completedCount / total) * 100 : 0

    return (
      <div className="space-y-4">
        {/* Barra de progreso */}
        {total > 0 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">Sesión libre</span>
              <span className="text-xs text-zinc-400">
                {completedCount}/{total} ejercicios
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Rest timer */}
        {restTimer.visible && (
          <RestTimer
            seconds={restTimer.seconds}
            onDismiss={() => setRestTimer((t) => ({ ...t, visible: false }))}
          />
        )}

        {/* Ejercicios añadidos */}
        {freeExercises.length > 0 && (
          <div className="space-y-3">
            {freeExercises.map((re) => (
              <ExerciseSessionCard
                key={re.id}
                routineExercise={re}
                state={exerciseStates[re.id]}
                onSetReps={(setIdx, reps) =>
                  handleSetReps(re.id, setIdx, reps)
                }
                onRpe={(rpe) => updateExercise(re.id, { rpeActual: rpe })}
                onPain={(pain) => updateExercise(re.id, { painDuring: pain })}
                onNotes={(notes) => updateExercise(re.id, { notes })}
                onComplete={() =>
                  handleCompleteExercise(re.id, re, undefined)
                }
              />
            ))}
          </div>
        )}

        {/* Exercise picker */}
        <div>
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-2 w-full rounded-xl border border-dashed border-zinc-700 p-3 text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir ejercicio</span>
            {showPicker ? (
              <ChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto" />
            )}
          </button>

          {showPicker && (
            <div className="mt-2">
              <ExercisePicker
                exercises={allExercises}
                addedIds={addedIds}
                onAdd={handleAddExercise}
                onRemove={handleRemoveExercise}
              />
            </div>
          )}
        </div>

        {/* Finalizar */}
        <div className="pt-2 pb-6">
          {total === 0 ? (
            <p className="text-center text-xs text-zinc-600 py-2">
              Añade al menos un ejercicio para terminar la sesión.
            </p>
          ) : completedCount === total ? (
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
              Terminar sesión ({completedCount}/{total} ejercicios)
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ── Render: modo estructurado ─────────────────────────────────────────────

  // Sin rutina → día de descanso, ofrecer sesión libre
  if (!routine) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
          <Dumbbell className="h-6 w-6 text-zinc-600" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm mb-1">
            Hoy no toca sesión principal.
          </p>
          <p className="text-zinc-600 text-xs">
            Puedes hacer tu Movilidad Diaria o una sesión libre.
          </p>
        </div>
        <Button
          onClick={startFreeSession}
          variant="outline"
          className="border-zinc-700 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400"
        >
          <Plus className="h-4 w-4 mr-2" />
          Empezar sesión libre
        </Button>
      </div>
    )
  }

  const completedCount = Object.values(exerciseStates).filter(
    (s) => s.completed
  ).length
  const totalCount = routine.exercises.length
  const progressPct = (completedCount / totalCount) * 100

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
      {/* Barra de progreso + botón sesión libre */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Progreso</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400">
              {completedCount}/{totalCount} ejercicios
            </span>
            <button
              onClick={startFreeSession}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              + Sesión libre
            </button>
          </div>
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

      {/* Bloques de ejercicios */}
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
                onSetReps={(setIdx, reps) =>
                  handleSetReps(re.id, setIdx, reps)
                }
                onRpe={(rpe) => updateExercise(re.id, { rpeActual: rpe })}
                onPain={(pain) => updateExercise(re.id, { painDuring: pain })}
                onNotes={(notes) => updateExercise(re.id, { notes })}
                onComplete={() =>
                  handleCompleteExercise(re.id, re, routine.id)
                }
              />
            ))}
          </div>
        </div>
      ))}

      {/* Finalizar sesión */}
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
