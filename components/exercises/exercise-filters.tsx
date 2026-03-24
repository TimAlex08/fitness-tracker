"use client"

/**
 * ExerciseFilters — SRP aplicado:
 * Responsabilidad única: chips de filtro de grupo muscular + búsqueda por nombre.
 * La URL es la fuente de verdad — no hay estado local.
 * Es client component porque usa useRouter y useSearchParams.
 */

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { useTransition } from "react"
import { cn } from "@/lib/utils"
import type { MuscleGroup } from "@/types/exercise"

type FilterOption = {
  value: MuscleGroup | "ALL"
  label: string
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: "ALL", label: "Todos" },
  { value: "CHEST", label: "Pecho" },
  { value: "BACK", label: "Espalda" },
  { value: "LEGS", label: "Piernas" },
  { value: "SHOULDERS", label: "Hombros" },
  { value: "CORE", label: "Core" },
  { value: "MOBILITY", label: "Movilidad" },
  { value: "FULL_BODY", label: "Completo" },
]

export function ExerciseFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get("muscle") ?? "ALL"
  const query = searchParams.get("q") ?? ""
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

  function handleMuscle(value: FilterOption["value"]) {
    const qs = buildParams({ muscle: value === "ALL" ? null : value })
    router.push(`/exercises${qs ? `?${qs}` : ""}`)
  }

  function handleSearch(value: string) {
    startTransition(() => {
      const qs = buildParams({ q: value || null })
      router.push(`/exercises${qs ? `?${qs}` : ""}`)
    })
  }

  return (
    <div className="space-y-3">
      {/* Búsqueda por nombre */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        <input
          type="search"
          defaultValue={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar ejercicio..."
          className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-0"
        />
      </div>

      {/* Chips de grupo muscular */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar por grupo muscular"
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = active === option.value

          return (
            <button
              key={option.value}
              onClick={() => handleMuscle(option.value)}
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
