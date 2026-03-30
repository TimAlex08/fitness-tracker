"use client"

import type { Exercise, RoutineWithExercises, DailyLogWithExercises } from "@/types"
import { useSessionState } from "@/features/session/hooks/use-session-state"
import { PostSessionForm } from "@/features/session/components/post-session-form"
import { RestTimer } from "@/features/session/components/rest-timer"
import { ExercisePicker } from "@/features/session/components/exercise-picker"
import { SessionFocusView } from "@/features/session/components/session-focus-view"
import { DashboardView } from "@/features/session/components/dashboard-view"
import { SessionNavigationGuard } from "@/features/session/components/session-navigation-guard"
import { CalendarDays, CheckCircle2, Dumbbell, Plus, Trophy, ChevronDown, ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type TodaySessionProps = {
  routine: RoutineWithExercises | null
  dailyLog: DailyLogWithExercises | null
  allExercises: Exercise[]
  today: string
}

export function TodaySession({ routine, dailyLog, allExercises, today }: TodaySessionProps) {
  const router = useRouter()
  const {
    mode,
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
    addedIds,
    updateExercise,
    handleSetReps,
    handleAddExercise,
    handleRemoveExercise,
    startFreeSession,
    handleCompleteExercise,
    handleFinishSession,
  } = useSessionState({ routine, dailyLog })

  // ── Dashboard / Idle ──────────────────────────────────────────────────────

  if (sessionPhase === "idle") {
    return (
      <div className="space-y-6 flex flex-col h-screen overflow-hidden">
        {/* Header with Exit */}
        <div className="flex items-center justify-between px-6 pt-6 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">Preparación</span>
            <h2 className="text-sm font-bold text-white tracking-tight italic uppercase">{routine?.name || "Sesión"}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="rounded-full h-10 w-10 text-zinc-500 hover:text-white hover:bg-zinc-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto px-6 pb-10 scrollbar-hide">
          {/* Encabezado descriptivo */}
          <div className="mb-8 animate-in fade-in duration-500 mt-4">
            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1 capitalize">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>{today}</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">
              {routine ? routine.name : "Día de descanso"}
            </h1>
            {routine && (
              <p className="text-sm text-zinc-400 mt-2 font-medium">
                {routine.durationMin && `${routine.durationMin} min estimados · `}
                {routine.exercises.length} ejercicios programados
              </p>
            )}
          </div>

          <DashboardView 
            routine={routine} 
            onStart={() => setSessionPhase("training")} 
            onStartFree={startFreeSession} 
          />
        </div>
      </div>
    )
  }

  // ── Sesión completada ─────────────────────────────────────────────────────

  if (sessionPhase === "done") {
    const completedCount = Object.values(exerciseStates).filter((s) => s.completed).length
    const total = mode === "structured" ? (routine?.exercises.length ?? 0) : freeExercises.length
    return (
      <div className="flex flex-col h-screen bg-zinc-950 items-center justify-center text-center px-6">
        <div className="h-20 w-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 shadow-inner shadow-emerald-500/10">
          <Trophy className="h-10 w-10 text-emerald-400" aria-hidden="true" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tight">¡Sesión completada!</h2>
        <p className="text-zinc-500 text-base font-medium mb-12">{completedCount} de {total} ejercicios realizados con éxito.</p>
        
        <Button 
          onClick={() => router.push("/")}
          className="w-full max-w-xs h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic rounded-2xl shadow-lg shadow-emerald-900/20"
        >
          Volver al Inicio
        </Button>
      </div>
    )
  }

  // ── Post-sesión ───────────────────────────────────────────────────────────

  if (sessionPhase === "post-session") {
    return (
      <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">Finalización</span>
            <h2 className="text-sm font-bold text-white tracking-tight italic uppercase">Resumen de sesión</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-hide mt-6">
          <PostSessionForm onSubmit={handleFinishSession} />
        </div>
      </div>
    )
  }

  // ── Modo libre ────────────────────────────────────────────────────────────

  if (mode === "free") {
    const handleExit = () => {
      if (window.confirm("¿Seguro que quieres salir de la sesión? Se perderá el progreso.")) {
        router.push("/")
      }
    }

    return (
      <div className="flex flex-col h-screen overflow-hidden bg-zinc-950">
        <SessionNavigationGuard enabled={sessionPhase === "training"} />

        {/* Header with Exit - Fixed */}
        <div className="flex items-center justify-between px-6 pt-6 shrink-0 z-50">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">Sesión libre activa</span>
            <h2 className="text-sm font-bold text-white tracking-tight italic uppercase">Entrenamiento libre</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExit}
            className="rounded-full h-10 w-10 text-zinc-500 hover:text-white hover:bg-zinc-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Dynamic Content Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Picker Trigger (Free Mode only) */}
          <div className="px-6 py-2 shrink-0">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-2 w-full rounded-xl border border-dashed border-zinc-800 p-3 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:border-zinc-700 hover:text-zinc-400 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Gestionar ejercicios</span>
              {showPicker ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
            </button>
            {showPicker && (
              <div className="mt-4 max-h-[40vh] overflow-y-auto scrollbar-hide bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
                <ExercisePicker
                  exercises={allExercises}
                  addedIds={addedIds}
                  onAdd={handleAddExercise}
                  onRemove={handleRemoveExercise}
                />
              </div>
            )}
          </div>

          {restTimer.visible && (
            <RestTimer seconds={restTimer.seconds} onDismiss={dismissRestTimer} />
          )}

          <div className="flex-1 min-h-0">
            <SessionFocusView
              exercises={freeExercises}
              exerciseStates={exerciseStates}
              currentExerciseIndex={currentExerciseIndex}
              onSetExerciseIndex={setCurrentExerciseIndex}
              onSetReps={handleSetReps}
              onRpe={(reId, rpe) => updateExercise(reId, { rpeActual: rpe })}
              onPain={(reId, pain) => updateExercise(reId, { painDuring: pain })}
              onNotes={(reId, notes) => updateExercise(reId, { notes })}
              onComplete={(reId, re, val) => handleCompleteExercise(reId, re, undefined, val)}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Sin rutina (día de descanso) ──────────────────────────────────────────

  if (!routine) {
    return (
      <div className="flex flex-col h-screen bg-zinc-950 items-center justify-center text-center px-6 overflow-hidden">
        <div className="h-20 w-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8 shadow-inner shadow-zinc-800/10">
          <Dumbbell className="h-10 w-10 text-zinc-600" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tight">Día de Descanso</h2>
        <p className="text-zinc-500 text-base font-medium mb-12">No hay rutina programada para hoy. Puedes hacer movilidad o una sesión libre.</p>
        
        <div className="flex flex-col w-full max-w-xs gap-4">
          <Button 
            onClick={startFreeSession}
            className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-2xl shadow-lg shadow-blue-900/20"
          >
            Empezar sesión libre
          </Button>
          <Button 
            variant="ghost"
            onClick={() => router.push("/")}
            className="w-full h-14 text-zinc-500 font-bold uppercase tracking-widest text-xs"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    )
  }

  // ── Modo estructurado ─────────────────────────────────────────────────────

  const handleExit = () => {
    if (window.confirm("¿Seguro que quieres salir de la sesión? Se perderá el progreso no guardado de este ejercicio.")) {
      router.push("/")
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950">
      <SessionNavigationGuard enabled={sessionPhase === "training"} />

      {/* Header with Exit - Fixed */}
      <div className="flex items-center justify-between px-6 pt-6 shrink-0 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">Sesión activa</span>
          <h2 className="text-sm font-bold text-white tracking-tight italic uppercase">{routine.name}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExit}
          className="rounded-full h-10 w-10 text-zinc-500 hover:text-white hover:bg-zinc-900"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Dynamic Content Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {restTimer.visible && (
          <RestTimer seconds={restTimer.seconds} onDismiss={dismissRestTimer} />
        )}

        <div className="flex-1 min-h-0">
          <SessionFocusView
            exercises={routine.exercises}
            exerciseStates={exerciseStates}
            currentExerciseIndex={currentExerciseIndex}
            onSetExerciseIndex={setCurrentExerciseIndex}
            onSetReps={handleSetReps}
            onRpe={(reId, rpe) => updateExercise(reId, { rpeActual: rpe })}
            onPain={(reId, pain) => updateExercise(reId, { painDuring: pain })}
            onNotes={(reId, notes) => updateExercise(reId, { notes })}
            onComplete={(reId, re, val) => handleCompleteExercise(reId, re, routine.id, val)}
          />
        </div>
      </div>
    </div>
  )
}
