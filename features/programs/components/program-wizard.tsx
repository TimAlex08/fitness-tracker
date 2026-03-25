"use client"

import * as React from "react"
import { useProgramBuilder } from "../hooks/use-program-builder"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, X, RotateCcw, Loader2 } from "lucide-react"
import { ProgramInfoStep } from "./steps/program-info-step"
import { StructureStep } from "./steps/structure-step"
import { ExercisesStep } from "./steps/exercises-step"
import { SummaryStep } from "./steps/summary-step"
import { cn } from "@/lib/utils"
import type { Exercise } from "@/types"
import { useRouter } from "next/navigation"

const STEP_LABELS = [
  "Información Básica",
  "Estructura y Fases",
  "Rellenar Ejercicios",
  "Resumen y Activación",
]

export function ProgramWizard() {
  const router = useRouter()
  const {
    step,
    nextStep,
    prevStep,
    data,
    updateProgramInfo,
    updatePhases,
    resetBuilder,
    isReady,
  } = useProgramBuilder()

  const [allExercises, setAllExercises] = React.useState<Exercise[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch("/api/exercises")
      .then(res => res.json())
      .then(setAllExercises)
  }, [])

  if (!isReady) return <div className="p-8 text-center text-zinc-500">Iniciando asistente...</div>

  const progress = (step / 4) * 100

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Error al guardar el programa")
      }

      resetBuilder()
      router.push("/training")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado")
      setIsSubmitting(false)
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  const canAdvance = () => {
    if (step === 1) return data.name.length >= 3
    if (step === 2) return data.phases.every(p => p.routines.length > 0)
    if (step === 3) return data.phases.every(p => p.routines.every(r => r.exercises.length > 0))
    return true
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" className="text-zinc-500" onClick={() => window.history.back()}>
            <X className="h-5 w-5" />
          </Button>

          <div className="flex-1 text-center">
            <h1 className="text-sm font-bold text-white uppercase tracking-widest">Creador de Programa</h1>
            <p className="text-[10px] text-zinc-500 font-medium uppercase mt-0.5">Paso {step}: {STEP_LABELS[step - 1]}</p>
          </div>

          <Button variant="ghost" size="icon" className="text-zinc-500" onClick={resetBuilder}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-w-xl mx-auto mt-3">
          <Progress value={progress} className="h-1 bg-zinc-900" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4 overflow-y-auto">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {step === 1 && (
            <ProgramInfoStep
              name={data.name}
              description={data.description ?? ""}
              onChange={updateProgramInfo}
            />
          )}

          {step === 2 && (
            <StructureStep
              phases={data.phases}
              onChange={updatePhases}
            />
          )}

          {step === 3 && (
            <ExercisesStep
              phases={data.phases}
              allExercises={allExercises}
              onChange={updatePhases}
            />
          )}

          {step === 4 && (
            <SummaryStep
              data={data}
              allExercises={allExercises}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="sticky bottom-0 bg-zinc-950 border-t border-zinc-900 p-4 pb-8">
        <div className="max-w-xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={isSubmitting}
            className={cn("flex-1 bg-zinc-900 border-zinc-800 text-zinc-400 h-12 rounded-xl", step === 1 && "invisible")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>
          <Button
            onClick={step === 4 ? handleSubmit : nextStep}
            disabled={!canAdvance() || isSubmitting}
            className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : step === 4 ? (
              "Finalizar y Activar"
            ) : (
              "Siguiente Paso"
            )}
            {step < 4 && !isSubmitting && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </footer>
    </div>
  )
}
