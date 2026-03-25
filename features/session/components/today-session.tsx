"use client"

import type { Exercise, RoutineWithExercises, DailyLogWithExercises } from "@/types"
import { useSessionState } from "@/features/session/hooks/use-session-state"
import { SessionProgressCard } from "@/features/session/components/session-progress-card"
import { SessionExerciseList } from "@/features/session/components/session-exercise-list"
import { ExerciseSessionCard } from "@/features/session/components/exercise-session-card"
import { PostSessionForm } from "@/features/session/components/post-session-form"
import { RestTimer } from "@/features/session/components/rest-timer"
import { ExercisePicker } from "@/features/session/components/exercise-picker"
import { CheckCircle2, Dumbbell, Plus, Trophy, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

type TodaySessionProps = {
  routine: RoutineWithExercises | null
  dailyLog: DailyLogWithExercises | null
  allExercises: Exercise[]
}

export function TodaySession({ routine, dailyLog, allExercises }: TodaySessionProps) {
  const {
    mode,
    sessionPhase,
    setSessionPhase,
    restTimer,
    dismissRestTimer,
    exerciseStates,
    freeExercises,
    showPicker,
    setShowPicker,
    addedIds,
    updateExercise,
    handleSetReps,
    handleAddExercise,
    handleRemoveExercise,
    startFreeSession,
    handleCompleteExercise,
    handleFinishSession,
  } = useSessionState({ routine, dailyLog })

  // ── Sesión completada ─────────────────────────────────────────────────────

  if (sessionPhase === "done") {
    const completedCount = Object.values(exerciseStates).filter((s) => s.completed).length
    const total = mode === "structured" ? (routine?.exercises.length ?? 0) : freeExercises.length
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
          <Trophy className="h-7 w-7 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">¡Sesión completada!</h2>
        <p className="text-zinc-400 text-sm">{completedCount} de {total} ejercicios realizados.</p>
      </div>
    )
  }

  // ── Post-sesión ───────────────────────────────────────────────────────────

  if (sessionPhase === "post-session") {
    return <PostSessionForm onSubmit={handleFinishSession} />
  }

  // ── Modo libre ────────────────────────────────────────────────────────────

  if (mode === "free") {
    const completedCount = Object.values(exerciseStates).filter((s) => s.completed).length
    const total = freeExercises.length

    return (
      <div className="space-y-4">
        {total > 0 && (
          <SessionProgressCard
            completedCount={completedCount}
            totalCount={total}
            label="Sesión libre"
          />
        )}

        {restTimer.visible && (
          <RestTimer seconds={restTimer.seconds} onDismiss={dismissRestTimer} />
        )}

        {freeExercises.length > 0 && (
          <div className="space-y-3">
            {freeExercises.map((re) => (
              <ExerciseSessionCard
                key={re.id}
                routineExercise={re}
                state={exerciseStates[re.id]}
                onSetReps={(setIdx, reps) => handleSetReps(re.id, setIdx, reps)}
                onRpe={(rpe) => updateExercise(re.id, { rpeActual: rpe })}
                onPain={(pain) => updateExercise(re.id, { painDuring: pain })}
                onNotes={(notes) => updateExercise(re.id, { notes })}
                onComplete={() => handleCompleteExercise(re.id, re, undefined)}
              />
            ))}
          </div>
        )}

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

  // ── Sin rutina (día de descanso) ──────────────────────────────────────────

  if (!routine) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
          <Dumbbell className="h-6 w-6 text-zinc-600" />
        </div>
        <div>
          <p className="text-zinc-400 text-sm mb-1">Hoy no toca sesión principal.</p>
          <p className="text-zinc-600 text-xs">Puedes hacer tu Movilidad Diaria o una sesión libre.</p>
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

  // ── Modo estructurado ─────────────────────────────────────────────────────

  const completedCount = Object.values(exerciseStates).filter((s) => s.completed).length
  const totalCount = routine.exercises.length

  return (
    <div className="space-y-4">
      <SessionProgressCard
        completedCount={completedCount}
        totalCount={totalCount}
        onStartFree={startFreeSession}
      />

      {restTimer.visible && (
        <RestTimer seconds={restTimer.seconds} onDismiss={dismissRestTimer} />
      )}

      <SessionExerciseList
        routine={routine}
        exerciseStates={exerciseStates}
        onSetReps={handleSetReps}
        onRpe={(reId, rpe) => updateExercise(reId, { rpeActual: rpe })}
        onPain={(reId, pain) => updateExercise(reId, { painDuring: pain })}
        onNotes={(reId, notes) => updateExercise(reId, { notes })}
        onComplete={(reId, re) => handleCompleteExercise(reId, re, routine.id)}
      />

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
