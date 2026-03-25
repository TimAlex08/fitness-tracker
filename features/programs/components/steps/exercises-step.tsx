"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"
import { ExercisePicker } from "@/features/session/components/exercise-picker"
import type { CreatePhaseBody, CreateRoutineBody, CreateRoutineExerciseBody } from "../../schemas/program.schema"
import type { Exercise } from "@/types"
import { Input } from "@/components/ui/input"

const DAYS = [
  { id: "monday", label: "Lun" },
  { id: "tuesday", label: "Mar" },
  { id: "wednesday", label: "Mié" },
  { id: "thursday", label: "Jue" },
  { id: "friday", label: "Vie" },
  { id: "saturday", label: "Sáb" },
  { id: "sunday", label: "Dom" },
]

interface ExercisesStepProps {
  phases: CreatePhaseBody[]
  allExercises: Exercise[]
  onChange: (phases: CreatePhaseBody[]) => void
}

export function ExercisesStep({ phases, allExercises, onChange }: ExercisesStepProps) {
  const [activePhaseIdx, setActivePhaseIdx] = React.useState(0)
  const [activeRoutineIdx, setActiveRoutineIdx] = React.useState(0)
  const [showPicker, setShowPicker] = React.useState(false)

  const currentPhase = phases[activePhaseIdx]
  const currentRoutine = currentPhase.routines[activeRoutineIdx]

  const updateRoutine = (patch: Partial<CreateRoutineBody>) => {
    const nextPhases = [...phases]
    const phase = nextPhases[activePhaseIdx]
    const routines = [...phase.routines]
    routines[activeRoutineIdx] = { ...routines[activeRoutineIdx], ...patch }
    phase.routines = routines
    onChange(nextPhases)
  }

  const handleAddExercise = (exercise: Exercise) => {
    const nextExercises = [...currentRoutine.exercises]
    const newExercise: CreateRoutineExerciseBody = {
      exerciseId: exercise.id,
      order: nextExercises.length,
      block: "main",
      sets: exercise.defaultSets ?? 3,
      reps: exercise.defaultReps ?? 10,
      restSec: exercise.defaultRestSec ?? 60,
      tempo: exercise.defaultTempo ?? "2-0-1-0",
      rpe: exercise.defaultRpe ?? 8,
    }
    updateRoutine({ exercises: [...nextExercises, newExercise] })
  }

  const removeExercise = (idx: number) => {
    const nextExercises = currentRoutine.exercises
      .filter((_, i) => i !== idx)
      .map((e, i) => ({ ...e, order: i }))
    updateRoutine({ exercises: nextExercises })
  }

  const updateExerciseData = (idx: number, patch: Partial<CreateRoutineExerciseBody>) => {
    const nextExercises = [...currentRoutine.exercises]
    nextExercises[idx] = { ...nextExercises[idx], ...patch }
    updateRoutine({ exercises: nextExercises })
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="text-center mb-6">
        <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Diseña tu Entrenamiento</h2>
        <p className="text-zinc-500 text-sm px-8">
          Añade ejercicios y define los parámetros para cada día de cada fase.
        </p>
      </div>

      {/* Phase Selector */}
      <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto scrollbar-hide">
        {phases.map((p, i) => (
          <button
            key={i}
            onClick={() => { setActivePhaseIdx(i); setActiveRoutineIdx(0); }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all shrink-0",
              activePhaseIdx === i ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Day Selector for Current Phase */}
      <div className="flex gap-2 p-1 bg-zinc-950 border border-zinc-900 rounded-2xl overflow-x-auto scrollbar-hide">
        {currentPhase.routines.map((r, i) => {
          const dayLabel = DAYS.find(d => d.id === r.dayOfWeek)?.label ?? ""
          return (
            <button
              key={r.dayOfWeek}
              onClick={() => setActiveRoutineIdx(i)}
              className={cn(
                "flex-1 min-w-[70px] py-3 rounded-xl flex flex-col items-center gap-1 transition-all border",
                activeRoutineIdx === i 
                  ? "bg-zinc-800 text-white border-zinc-700 shadow-xl" 
                  : "text-zinc-600 border-transparent"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">{dayLabel}</span>
              <span className="text-xs font-medium">{r.exercises.length} ej.</span>
            </button>
          )
        })}
      </div>

      {/* Exercise List for Current Routine */}
      <div className="space-y-4">
        {currentRoutine.exercises.map((re, idx) => {
          const exercise = allExercises.find(e => e.id === re.exerciseId)
          return (
            <Card key={`${re.exerciseId}-${idx}`} className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-right-4 duration-300">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-700 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white truncate max-w-[180px]">{exercise?.name}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                        {exercise?.muscleGroup}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-red-400 h-8 w-8" onClick={() => removeExercise(idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-600 ml-1 tracking-tighter">Series</label>
                    <Input 
                      type="number" 
                      value={re.sets ?? ""} 
                      onChange={(e) => updateExerciseData(idx, { sets: parseInt(e.target.value) || 0 })}
                      className="h-8 bg-zinc-950 border-zinc-800 text-xs px-2 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-600 ml-1 tracking-tighter">Reps</label>
                    <Input 
                      type="number" 
                      value={re.reps ?? ""} 
                      onChange={(e) => updateExerciseData(idx, { reps: parseInt(e.target.value) || 0 })}
                      className="h-8 bg-zinc-950 border-zinc-800 text-xs px-2 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-600 ml-1 tracking-tighter">Desc. (s)</label>
                    <Input 
                      type="number" 
                      value={re.restSec ?? ""} 
                      onChange={(e) => updateExerciseData(idx, { restSec: parseInt(e.target.value) || 0 })}
                      className="h-8 bg-zinc-950 border-zinc-800 text-xs px-2 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-zinc-600 ml-1 tracking-tighter">RPE obj.</label>
                    <Input 
                      type="number" 
                      value={re.rpe ?? ""} 
                      onChange={(e) => updateExerciseData(idx, { rpe: parseInt(e.target.value) || 0 })}
                      className="h-8 bg-zinc-950 border-zinc-800 text-xs px-2 text-center"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        <Button
          onClick={() => setShowPicker(true)}
          className="w-full bg-zinc-900 border border-dashed border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 h-16 rounded-3xl flex flex-col gap-1 transition-all"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Añadir Ejercicio</span>
        </Button>
      </div>

      {/* Exercise Picker Modal Overlay */}
      {showPicker && (
        <div className="fixed inset-0 z-50 bg-zinc-950 overflow-y-auto animate-in slide-in-from-bottom duration-300">
          <div className="p-4 flex items-center justify-between border-b border-zinc-900 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-10">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Catálogo</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowPicker(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4">
            <ExercisePicker
              exercises={allExercises}
              addedIds={new Set(currentRoutine.exercises.map(e => e.exerciseId))}
              onAdd={handleAddExercise}
              onRemove={(id) => {
                const idx = currentRoutine.exercises.findIndex(e => e.exerciseId === id)
                if (idx >= 0) removeExercise(idx)
              }}
            />
          </div>
          <div className="sticky bottom-0 p-4 bg-gradient-to-t from-zinc-950 pt-8">
            <Button onClick={() => setShowPicker(false)} className="w-full bg-emerald-600 hover:bg-emerald-500 h-12 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-emerald-950/20">
              Listo ({currentRoutine.exercises.length} añadidos)
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function X({ className, onClick }: { className?: string, onClick?: () => void }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" fill="none" 
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      className={className}
      onClick={onClick}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  )
}
