/**
 * ExercisesPage — catálogo filtrable de ejercicios.
 * Server Component: lee searchParams para filtrar y obtiene datos de la DB.
 * Responsabilidad: orquestar filtros + datos + presentación del grid.
 */

import { Suspense } from "react"
import { ExerciseCard } from "@/components/exercises/exercise-card"
import { ExerciseFilters } from "@/components/exercises/exercise-filters"
import { getExercises } from "@/lib/exercises"
import type { MuscleGroup } from "@/types/exercise"

// ─── Grid de ejercicios ───────────────────────────────────────────────────────

type ExerciseGridProps = {
  muscleGroup?: MuscleGroup
}

async function ExerciseGrid({ muscleGroup }: ExerciseGridProps) {
  const exercises = await getExercises(muscleGroup)

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-zinc-400 text-sm">
          No hay ejercicios para este filtro.
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="text-xs text-zinc-500 mb-4">
        {exercises.length} ejercicio{exercises.length !== 1 ? "s" : ""}
        {muscleGroup ? ` en ${muscleGroup.toLowerCase()}` : " en el catálogo"}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
      </div>
    </>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

type PageProps = {
  searchParams: Promise<{ muscle?: string }>
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const { muscle } = await searchParams

  // Validar que el valor sea un MuscleGroup conocido
  const VALID_MUSCLE_GROUPS: MuscleGroup[] = [
    "CHEST", "BACK", "LEGS", "SHOULDERS", "CORE", "MOBILITY", "FULL_BODY",
  ]
  const activeMuscle =
    muscle && VALID_MUSCLE_GROUPS.includes(muscle as MuscleGroup)
      ? (muscle as MuscleGroup)
      : undefined

  return (
    <div className="px-6 py-8">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Catálogo de ejercicios
        </h1>
        <p className="text-sm text-zinc-400">
          Ejercicios de la Fase Cero con parámetros de trabajo y notas de
          seguridad.
        </p>
      </div>

      {/* Filtros — client component envuelto en Suspense (requiere useSearchParams) */}
      <div className="mb-6">
        <Suspense fallback={<div className="h-8" />}>
          <ExerciseFilters />
        </Suspense>
      </div>

      {/* Grid — suspense para streaming mientras carga de DB */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse"
              />
            ))}
          </div>
        }
      >
        <ExerciseGrid muscleGroup={activeMuscle} />
      </Suspense>
    </div>
  )
}
