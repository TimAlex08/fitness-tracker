"use client"

/**
 * ExerciseFilters — chips de grupo muscular + búsqueda + ordenamiento.
 * La URL es la fuente de verdad — no hay estado local.
 */

import { useRouter, useSearchParams } from "next/navigation"
import { Search, ArrowUpDown } from "lucide-react"
import { useTransition } from "react"
import { cn } from "@/lib/utils"
import type { MuscleGroup } from "@/features/exercises/types/exercise.types"
import type { ExerciseSort } from "@/features/exercises/api/exercise-repository"

type FilterOption = {
  value: MuscleGroup | "ALL"
  label: string
}

type SortOption = {
  value: ExerciseSort
  label: string
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: "ALL",       label: "Todos" },
  { value: "CHEST",     label: "Pecho" },
  { value: "BACK",      label: "Espalda" },
  { value: "LEGS",      label: "Piernas" },
  { value: "SHOULDERS", label: "Hombros" },
  { value: "CORE",      label: "Core" },
  { value: "MOBILITY",  label: "Movilidad" },
  { value: "FULL_BODY", label: "Completo" },
]

const SORT_OPTIONS: SortOption[] = [
  { value: "name_asc",  label: "Nombre A→Z" },
  { value: "name_desc", label: "Nombre Z→A" },
  { value: "date_desc", label: "Más recientes" },
  { value: "date_asc",  label: "Más antiguos" },
]

const BASE_PATH = "/training/exercises"

export function ExerciseFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get("muscle") ?? "ALL"
  const query = searchParams.get("q") ?? ""
  const sort = (searchParams.get("sort") as ExerciseSort) ?? "name_asc"
  const [, startTransition] = useTransition()

  function buildParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") {
        params.delete(key)
      } else {
        params.set(key, val)
      }
    }
    return params.toString()
  }

  function navigate(updates: Record<string, string | null>) {
    startTransition(() => {
      const qs = buildParams(updates)
      router.push(`${BASE_PATH}${qs ? `?${qs}` : ""}`)
    })
  }

  return (
    <div className="space-y-3">
      {/* Fila: búsqueda + ordenamiento */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
          <input
            type="search"
            defaultValue={query}
            onChange={(e) => navigate({ q: e.target.value || null })}
            placeholder="Buscar ejercicio..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-0"
          />
        </div>

        {/* Selector de orden */}
        <div className="relative">
          <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => navigate({ sort: e.target.value === "name_asc" ? null : e.target.value })}
            className="h-full pl-7 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600 appearance-none cursor-pointer hover:border-zinc-600 transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chips de grupo muscular */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por grupo muscular">
        {FILTER_OPTIONS.map((option) => {
          const isActive = active === option.value
          return (
            <button
              key={option.value}
              onClick={() => navigate({ muscle: option.value === "ALL" ? null : option.value })}
              aria-pressed={isActive}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors border",
                isActive
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
