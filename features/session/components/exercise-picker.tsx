"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Check } from "lucide-react"
import type { Exercise } from "@/types"

// ─── Mapas de presentación ────────────────────────────────────────────────────

const MUSCLE_LABEL: Record<string, string> = {
  CHEST: "Pecho",
  BACK: "Espalda",
  LEGS: "Piernas",
  SHOULDERS: "Hombros",
  CORE: "Core",
  MOBILITY: "Movilidad",
  FULL_BODY: "Completo",
}

const MUSCLE_COLOR: Record<string, string> = {
  CHEST: "border-blue-500/40 text-blue-400",
  BACK: "border-purple-500/40 text-purple-400",
  LEGS: "border-green-500/40 text-green-400",
  SHOULDERS: "border-orange-500/40 text-orange-400",
  CORE: "border-yellow-500/40 text-yellow-400",
  MOBILITY: "border-teal-500/40 text-teal-400",
  FULL_BODY: "border-zinc-500/40 text-zinc-400",
}

const ALL_MUSCLE_GROUPS = [
  "CHEST",
  "BACK",
  "LEGS",
  "SHOULDERS",
  "CORE",
  "MOBILITY",
  "FULL_BODY",
] as const

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ExercisePickerProps = {
  exercises: Exercise[]
  addedIds: Set<string>
  onAdd: (exercise: Exercise) => void
  onRemove: (exerciseId: string) => void
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function ExercisePicker({
  exercises,
  addedIds,
  onAdd,
  onRemove,
}: ExercisePickerProps) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = !activeFilter || ex.muscleGroup === activeFilter
      return matchesSearch && matchesFilter
    })
  }, [exercises, search, activeFilter])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Buscador */}
      <div className="p-3 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio..."
            aria-label="Buscar ejercicio"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          />
        </div>
      </div>

      {/* Filtros de grupo muscular */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-zinc-800 scrollbar-none">
        <button
          onClick={() => setActiveFilter(null)}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
            activeFilter === null
              ? "bg-zinc-700 border-zinc-600 text-white"
              : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          Todos
        </button>
        {ALL_MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg}
            onClick={() => setActiveFilter(activeFilter === mg ? null : mg)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
              activeFilter === mg
                ? "bg-zinc-700 border-zinc-600 text-white"
                : `border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300`
            }`}
          >
            {MUSCLE_LABEL[mg]}
          </button>
        ))}
      </div>

      {/* Lista de ejercicios */}
      <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800/50">
        {filtered.length === 0 && (
          <p className="text-center text-xs text-zinc-600 py-6">
            No hay ejercicios con ese filtro.
          </p>
        )}
        {filtered.map((ex) => {
          const added = addedIds.has(ex.id)
          const color = MUSCLE_COLOR[ex.muscleGroup] ?? MUSCLE_COLOR.FULL_BODY

          return (
            <div
              key={ex.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm text-white leading-snug truncate">
                  {ex.name}
                </p>
                <p className={`text-xs mt-0.5 ${color.split(" ")[1]}`}>
                  {MUSCLE_LABEL[ex.muscleGroup]}
                  {ex.defaultSets && ex.defaultReps
                    ? ` · ${ex.defaultSets}×${ex.defaultReps}`
                    : ex.defaultSets && ex.defaultDurationSec
                      ? ` · ${ex.defaultSets}×${ex.defaultDurationSec}s`
                      : ""}
                </p>
              </div>
              <button
                onClick={() => (added ? onRemove(ex.id) : onAdd(ex))}
                className={`shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  added
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-3 w-3" />
                    Añadido
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" />
                    Añadir
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
