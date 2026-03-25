"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calendar, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreatePhaseBody } from "../../schemas/program.schema"

const DAYS = [
  { id: "monday", label: "Lun" },
  { id: "tuesday", label: "Mar" },
  { id: "wednesday", label: "Mié" },
  { id: "thursday", label: "Jue" },
  { id: "friday", label: "Vie" },
  { id: "saturday", label: "Sáb" },
  { id: "sunday", label: "Dom" },
]

interface StructureStepProps {
  phases: CreatePhaseBody[]
  onChange: (phases: CreatePhaseBody[]) => void
}

export function StructureStep({ phases, onChange }: StructureStepProps) {
  const addPhase = () => {
    const lastPhase = phases[phases.length - 1]
    const nextWeekStart = lastPhase ? lastPhase.weekEnd + 1 : 1
    const newPhase: CreatePhaseBody = {
      name: `Fase ${phases.length + 1}`,
      order: phases.length,
      weekStart: nextWeekStart,
      weekEnd: nextWeekStart + 3,
      description: "",
      rpeTarget: "7-8",
      tempoDefault: "3-0-1-0",
      benchmarks: "",
      routines: [],
    }
    onChange([...phases, newPhase])
  }

  const removePhase = (index: number) => {
    if (phases.length <= 1) return
    const nextPhases = phases.filter((_, i) => i !== index).map((p, i) => ({ ...p, order: i }))
    onChange(nextPhases)
  }

  const updatePhase = (index: number, patch: Partial<CreatePhaseBody>) => {
    const nextPhases = [...phases]
    nextPhases[index] = { ...nextPhases[index], ...patch }
    onChange(nextPhases)
  }

  const toggleDay = (phaseIndex: number, dayId: string) => {
    const phase = phases[phaseIndex]
    const routines = [...phase.routines]
    const existingIndex = routines.findIndex(r => r.dayOfWeek === dayId)

    if (existingIndex >= 0) {
      routines.splice(existingIndex, 1)
    } else {
      const dayLabel = DAYS.find(d => d.id === dayId)?.label ?? ""
      routines.push({
        name: `Entrenamiento ${dayLabel}`,
        dayOfWeek: dayId,
        sessionType: "TRAINING",
        exercises: [],
      })
    }
    updatePhase(phaseIndex, { routines })
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center mb-8">
        <div className="h-16 w-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Estructura del Programa</h2>
        <p className="text-zinc-500 text-sm px-8">
          Define las fases de tu programa y qué días entrenarás en cada una.
        </p>
      </div>

      <div className="space-y-6">
        {phases.map((phase, pIdx) => (
          <Card key={pIdx} className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-800/50 p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 h-6">
                  Fase {pIdx + 1}
                </Badge>
                <input
                  value={phase.name}
                  onChange={(e) => updatePhase(pIdx, { name: e.target.value })}
                  className="bg-transparent border-none text-white font-bold focus:ring-0 p-0 text-sm w-40"
                />
              </div>
              {phases.length > 1 && (
                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-red-400 h-8 w-8" onClick={() => removePhase(pIdx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Weeks Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Semana Inicio</Label>
                  <Input
                    type="number"
                    value={phase.weekStart}
                    onChange={(e) => updatePhase(pIdx, { weekStart: parseInt(e.target.value) || 1 })}
                    className="bg-zinc-950 border-zinc-800 h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Semana Fin</Label>
                  <Input
                    type="number"
                    value={phase.weekEnd}
                    onChange={(e) => updatePhase(pIdx, { weekEnd: parseInt(e.target.value) || 1 })}
                    className="bg-zinc-950 border-zinc-800 h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Day Selector */}
              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Días de Entrenamiento
                </Label>
                <div className="flex justify-between gap-1">
                  {DAYS.map((day) => {
                    const isActive = phase.routines.some(r => r.dayOfWeek === day.id)
                    return (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(pIdx, day.id)}
                        className={cn(
                          "flex-1 aspect-square rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center border",
                          isActive 
                            ? "bg-emerald-500 text-white border-emerald-400 shadow-lg scale-105" 
                            : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-zinc-600 italic text-center">
                  Selecciona los días que realizarás sesiones en esta fase.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addPhase}
          className="w-full border-dashed border-zinc-800 bg-transparent text-zinc-500 hover:text-white hover:border-zinc-600 h-12 rounded-2xl gap-2"
        >
          <Plus className="h-4 w-4" />
          Añadir Fase
        </Button>
      </div>
    </div>
  )
}
