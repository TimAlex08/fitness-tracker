"use client"

import type { Exercise, RoutineWithExercises, DailyLogWithExercises } from "@/types"
import { useSessionState } from "@/features/session/hooks/use-session-state"
import { SessionProgressCard } from "@/features/session/components/session-progress-card"
import { SessionExerciseList } from "@/features/session/components/session-exercise-list"
import { ExerciseSessionCard } from "@/features/session/components/exercise-session-card"
import { PostSessionForm } from "@/features/session/components/post-session-form"
import { RestTimer } from "@/features/session/components/rest-timer"
import { ExercisePicker } from "@/features/session/components/exercise-picker"
import { FocusProgressBar } from "@/features/session/components/focus-progress-bar"
import { SessionFocusView } from "@/features/session/components/session-focus-view"
import { DashboardView } from "@/features/session/components/dashboard-view"
import { SessionNavigationGuard } from "@/features/session/components/session-navigation-guard"
import { CalendarDays, CheckCircle2, Dumbbell, Plus, Trophy, ChevronDown, ChevronUp, LayoutList, Focus, X } from "lucide-react"
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
    const completedCount = Object.values(exerciseStates).filter((s) => s.completed).length
    const totalCount = freeExercises.length

    const handleExit = () => {
      if (window.confirm("¿Seguro que quieres salir de la sesión? Se perderá el progreso.")) {
        router.push("/")
      }
    }

    return (
      <div className="space-y-6 flex flex-col h-screen overflow-hidden">
        <SessionNavigationGuard enabled={sessionPhase === "training"} />

        {/* Header with Exit */}
        <div className="flex items-center justify-between px-6 pt-6 shrink-0">
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

        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide pb-10">
          {/* View Toggle & Progress */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 self-center">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 gap-2 rounded-lg text-xs font-medium"
              >
                <LayoutList className="h-3.5 w-3.5" />
                Lista
              </Button>
              <Button
                variant={viewMode === "focus" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("focus")}
                className="h-8 gap-2 rounded-lg text-xs font-medium"
              >
                <Focus className="h-3.5 w-3.5" />
                Enfoque
              </Button>
            </div>

            {viewMode === "focus" && totalCount > 0 && (
              <FocusProgressBar current={completedCount} total={totalCount} className="px-6" />
            )}
          </div>

          {restTimer.visible && (
            <RestTimer seconds={restTimer.seconds} onDismiss={dismissRestTimer} />
          )}

          {viewMode === "list" ? (
            <div className="space-y-4 px-6 mt-4">
              {totalCount > 0 && (
                <SessionProgressCard
                  completedCount={completedCount}
                  totalCount={totalCount}
                  label="Sesión libre"
                />
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
                      onComplete={(val) => handleCompleteExercise(re.id, re, undefined, val)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4">
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
          )}

          <div className="px-6 mt-4">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-2 w-full rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500 hover:border-zinc-600 hover:text-zinc-400 transition-colors"
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
              <div className="mt-4">
                <ExercisePicker
                  exercises={allExercises}
                  addedIds={addedIds}
                  onAdd={handleAddExercise}
                  onRemove={handleRemoveExercise}
                />
              </div>
            )}
          </div>

          <div className="pt-8 pb-6 px-6">
            {totalCount === 0 ? (
              <p className="text-center text-xs text-zinc-600 py-2 italic">
                Añade al menos un ejercicio para terminar la sesión.
              </p>
            ) : completedCount === totalCount ? (
              <Button
                onClick={() => setSessionPhase("post-session")}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-14 rounded-2xl font-black italic uppercase"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finalizar sesión
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setSessionPhase("post-session")}
                className="w-full border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs"
              >
                Terminar sesión ({completedCount}/{totalCount} ejercicios)
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Sin rutina (día de descanso) ──────────────────────────────────────────

  if (!routine) {
    return (
      <div className="flex flex-col h-screen bg-zinc-950 items-center justify-center text-center px-6">
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

  const completedCount = Object.values(exerciseStates).filter((s) => s.completed).length
  const totalCount = routine.exercises.length

  const handleExit = () => {
    if (window.confirm("¿Seguro que quieres salir de la sesión? Se perderá el progreso no guardado de este ejercicio.")) {
      router.push("/")
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-screen overflow-hidden">
      <SessionNavigationGuard enabled={sessionPhase === "training"} />

      {/* Header with Exit */}
      <div className="flex items-center justify-between px-6 pt-6 shrink-0">
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

      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide pb-10">
        {/* View Toggle & Progress */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 self-center">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 gap-2 rounded-lg text-xs font-medium"
            >
              <LayoutList className="h-3.5 w-3.5" />
              Lista
            </Button>
            <Button
              variant={viewMode === "focus" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("focus")}
              className="h-8 gap-2 rounded-lg text-xs font-medium"
            >
              <Focus className="h-3.5 w-3.5" />
              Enfoque
            </Button>
          </div>

          {viewMode === "focus" && (
            <FocusProgressBar current={completedCount} total={totalCount} className="px-6" />
          )}
        </div>

        {restTimer.visible && (
          <RestTimer seconds={restTimer.seconds} onDismiss={dismissRestTimer} />
        )}

        {viewMode === "list" ? (
          <div className="space-y-4 px-6 mt-4">
            <SessionProgressCard
              completedCount={completedCount}
              totalCount={totalCount}
              onStartFree={startFreeSession}
            />

            <SessionExerciseList
              routine={routine}
              exerciseStates={exerciseStates}
              onSetReps={handleSetReps}
              onRpe={(reId, rpe) => updateExercise(reId, { rpeActual: rpe })}
              onPain={(reId, pain) => updateExercise(reId, { painDuring: pain })}
              onNotes={(reId, notes) => updateExercise(reId, { notes })}
              onComplete={(reId, re, val) => handleCompleteExercise(reId, re, routine.id, val)}
            />
          </div>
        ) : (
          <div className="mt-4">
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
        )}

        <div className="pt-8 pb-6 px-6">
          {completedCount === totalCount ? (
            <Button
              onClick={() => setSessionPhase("post-session")}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-14 rounded-2xl font-black italic uppercase"
            >
              <CheckCircle2 className="h-5 w-5" />
              Finalizar sesión
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setSessionPhase("post-session")}
              className="w-full border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs"
            >
              Terminar sesión ({completedCount}/{totalCount} ejercicios)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
