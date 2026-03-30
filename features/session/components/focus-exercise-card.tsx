"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Info, PlayCircle, ChevronDown, ChevronUp } from "lucide-react"
import type { RoutineExerciseWithDetails } from "@/types"
import type { ExerciseState } from "@/features/session/components/exercise-session-card"
import { SimplifiedExerciseForm } from "@/features/session/components/simplified-exercise-form"
import { cn } from "@/lib/utils"
import Image from "next/image"
import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type FocusExerciseCardProps = {
  routineExercise: RoutineExerciseWithDetails
  state: ExerciseState
  onSetReps: (setIdx: number, reps: number) => void
  onRpe: (rpe: number) => void
  onPain: (pain: number) => void
  onNotes: (notes: string) => void
  onComplete: (actualValue?: number) => void
  className?: string
  isLastExercise?: boolean
  sessionProgress?: number // Porcentaje de progreso de la sesión 0-100
}

const MUSCLE_COLOR: Record<string, string> = {
  CHEST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BACK: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  LEGS: "bg-green-500/15 text-green-400 border-green-500/30",
  SHOULDERS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  CORE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  MOBILITY: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  FULL_BODY: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}

function formatTarget(re: RoutineExerciseWithDetails): string {
  const sets = re.sets ?? re.exercise.defaultSets
  const reps = re.reps ?? re.exercise.defaultReps
  const dur = re.durationSec ?? re.exercise.defaultDurationSec
  if (!sets) return "—"
  if (reps) return `${sets} × ${reps} reps`
  if (dur) return `${sets} × ${dur}s`
  return `${sets} series`
}

export function FocusExerciseCard({
  routineExercise: re,
  state,
  onRpe,
  onPain,
  onComplete,
  className,
  isLastExercise,
  sessionProgress = 0,
}: FocusExerciseCardProps) {
  const isIsometric = !re.reps && !re.exercise.defaultReps
  const muscleColor = MUSCLE_COLOR[re.exercise.muscleGroup] ?? MUSCLE_COLOR.FULL_BODY

  return (
    <div
      className={cn(
        "flex flex-col w-full h-full bg-zinc-950 overflow-hidden relative",
        state.completed && "bg-emerald-950/5",
        className
      )}
    >
      {/* ─── Visual Area (Top 50%) ───────────────────────────────────────────── */}
      <div className="relative h-1/2 bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
        {re.exercise.imageUrl ? (
          <Image
            src={re.exercise.imageUrl}
            alt={re.exercise.name}
            fill
            className="object-cover opacity-70"
            priority
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-800">
            <PlayCircle className="h-16 w-16" />
            <span className="text-xs uppercase tracking-[0.3em] font-black">Video No Disponible</span>
          </div>
        )}

        {/* Floating Overlays */}
        <div className="absolute top-4 left-4 z-20">
          <Badge variant="outline" className={cn("bg-zinc-950/60 backdrop-blur-md border border-zinc-700/50 uppercase tracking-[0.2em] text-[10px] font-black px-2 py-0.5", muscleColor)}>
            {re.block === "warmup" ? "Calentamiento" : re.block === "cooldown" ? "Calma" : re.exercise.muscleGroup}
          </Badge>
        </div>

        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <button className="h-10 w-10 rounded-full bg-zinc-950/60 backdrop-blur-md border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                <Info className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-zinc-950 border-zinc-900 text-white w-[85%] sm:w-[400px]">
              <SheetHeader className="text-left">
                <SheetTitle className="text-2xl font-black italic uppercase text-white">{re.exercise.name}</SheetTitle>
                <SheetDescription className="text-zinc-500 font-medium">
                  Información detallada y técnica
                </SheetDescription>
              </SheetHeader>
              <div className="mt-8 space-y-6">
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-black mb-2">Descripción</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">{re.exercise.description || "Sin descripción disponible."}</p>
                </div>
                {re.exercise.safetyNotes && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-orange-400 font-black mb-2">Notas de Seguridad</h4>
                    <p className="text-orange-200/70 text-xs leading-relaxed">{re.exercise.safetyNotes}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-2">Equipamiento</h4>
                  <div className="flex flex-wrap gap-2">
                    {re.exercise.equipment?.map((eq) => (
                      <Badge key={eq} variant="secondary" className="bg-zinc-900 text-zinc-400 border-zinc-800 uppercase text-[9px]">
                        {eq}
                      </Badge>
                    ))}
                    {(!re.exercise.equipment || re.exercise.equipment.length === 0) && (
                      <span className="text-[10px] text-zinc-600 font-medium">No requiere equipo especial</span>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {state.completed && (
            <div className="bg-emerald-500 text-black rounded-full h-10 w-10 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-6 left-6 z-20 max-w-[80%]">
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight italic uppercase drop-shadow-2xl">
            {re.exercise.name}
          </h2>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
        
        {/* Border / Progress bar at junction */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-zinc-900 z-30">
          <div 
            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700"
            style={{ width: `${sessionProgress}%` }}
          />
        </div>
      </div>

      {/* ─── Control Area (Bottom 50%) ────────────────────────────────────────── */}
      <div className="h-1/2 flex flex-col relative">
        {!state.completed ? (
          <SimplifiedExerciseForm
            isIsometric={isIsometric}
            targetDuration={re.durationSec ?? re.exercise.defaultDurationSec}
            targetReps={re.reps ?? re.exercise.defaultReps}
            targetString={formatTarget(re)}
            tempo={re.tempo}
            submitting={state.submitting}
            rpeActual={state.rpeActual}
            painDuring={state.painDuring}
            onRpe={onRpe}
            onPain={onPain}
            onComplete={onComplete}
            isLastExercise={isLastExercise}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="h-24 w-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-emerald-500/20 relative">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-20" />
            </div>
            <h4 className="text-3xl font-black text-white mb-2 tracking-tight uppercase italic">¡Completado!</h4>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              Ejercicio registrado. Desliza para el siguiente o usa el botón de finalizar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

