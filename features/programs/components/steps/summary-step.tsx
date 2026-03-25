"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Calendar, Dumbbell, AlertCircle, Loader2 } from "lucide-react"
import type { CreateProgramBody } from "../../schemas/program.schema"
import type { Exercise } from "@/types"

const DAYS = [
  { id: "monday", label: "Lunes" },
  { id: "tuesday", label: "Martes" },
  { id: "wednesday", label: "Miércoles" },
  { id: "thursday", label: "Jueves" },
  { id: "friday", label: "Viernes" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
]

interface SummaryStepProps {
  data: CreateProgramBody
  allExercises: Exercise[]
  isSubmitting: boolean
  error: string | null
}

export function SummaryStep({ data, allExercises, isSubmitting, error }: SummaryStepProps) {
  return (
    <div className="space-y-6 pb-12">
      <div className="text-center mb-8">
        <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Revisión Final</h2>
        <p className="text-zinc-500 text-sm px-8">
          Todo listo. Revisa tu programa antes de activarlo.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex gap-3 items-center animate-in fade-in zoom-in-95 duration-300">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Program Header Summary */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden shadow-xl border-l-4 border-l-emerald-500">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-white mb-1">{data.name}</h3>
          <p className="text-sm text-zinc-400 italic mb-4">{data.description || "Sin descripción"}</p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-zinc-800 text-zinc-300 hover:bg-zinc-800 border-zinc-700">
              {data.phases.length} {data.phases.length === 1 ? "Fase" : "Fases"}
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Se activará al guardar
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tree */}
      <div className="space-y-4">
        {data.phases.map((phase, pIdx) => (
          <div key={pIdx} className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-zinc-700">
                {pIdx + 1}
              </div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{phase.name} (Semanas {phase.weekStart}-{phase.weekEnd})</h4>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-zinc-800 ml-3">
              {phase.routines.map((routine, rIdx) => (
                <div key={rIdx} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-sm font-bold text-white">{DAYS.find(d => d.id === routine.dayOfWeek)?.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">
                      {routine.exercises.length} Ejercicios
                    </span>
                  </div>

                  <div className="space-y-2">
                    {routine.exercises.map((re, eIdx) => {
                      const exercise = allExercises.find(e => e.id === re.exerciseId)
                      return (
                        <div key={eIdx} className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/30 last:border-0">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Dumbbell className="h-3 w-3 text-zinc-600 shrink-0" />
                            <span className="text-zinc-300 truncate">{exercise?.name}</span>
                          </div>
                          <div className="text-zinc-500 font-mono text-[10px] shrink-0 ml-4">
                            {re.sets}x{re.reps} @RPE{re.rpe}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 z-[60] bg-zinc-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
          <p className="text-white font-bold uppercase tracking-widest text-sm">Guardando programa...</p>
        </div>
      )}
    </div>
  )
}
