"use client"

/**
 * ExerciseFilters — SRP aplicado:
 * Responsabilidad única: chips de filtro que sincronizan
 * el grupo muscular seleccionado con los search params de la URL.
 * La URL es la fuente de verdad — no hay estado local.
 * Es client component porque usa useRouter y useSearchParams.
 */

import { useRouter, useSearchParams } from "next/navigation"
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

  function handleSelect(value: FilterOption["value"]) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "ALL") {
      params.delete("muscle")
    } else {
      params.set("muscle", value)
    }
    router.push(`/exercises?${params.toString()}`)
  }

  return (
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
            onClick={() => handleSelect(option.value)}
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
  )
}
