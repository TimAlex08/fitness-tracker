/**
 * ExercisesPage — catálogo filtrable de ejercicios.
 * Server Component: lee searchParams para filtrar y obtiene datos de la DB.
 */

import Link from "next/link"
import { Suspense } from "react"
import { ExerciseCard } from "@/features/exercises/components/exercise-card"
import { ExerciseFilters } from "@/features/exercises/components/exercise-filters"
import { ExerciseActions } from "@/features/exercises/components/exercise-actions"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import type { MuscleGroup } from "@/features/exercises/types/exercise.types"
import type { ExerciseSort } from "@/features/exercises/api/exercise-repository"

const exerciseRepo = new PrismaExerciseRepository()

// ─── Grid de ejercicios ───────────────────────────────────────────────────────

const VALID_SORTS: ExerciseSort[] = ["name_asc", "name_desc", "date_desc", "date_asc"]

type ExerciseGridProps = {
  muscleGroup?: MuscleGroup
  search?: string
  sort?: ExerciseSort
}

async function ExerciseGrid({ muscleGroup, search, sort }: ExerciseGridProps) {
  const exercises = await exerciseRepo.findMany({ muscleGroup, search, sort })

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
        {search ? ` · "${search}"` : ""}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {exercises.map((exercise) => (
          <Link
            key={exercise.id}
            href={`/training/exercises/${exercise.id}`}
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <ExerciseCard exercise={exercise} />
          </Link>
        ))}
      </div>
    </>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

const VALID_MUSCLE_GROUPS: MuscleGroup[] = [
  "CHEST", "BACK", "LEGS", "SHOULDERS", "CORE", "MOBILITY", "FULL_BODY",
]

type PageProps = {
  searchParams: Promise<{ muscle?: string; q?: string; sort?: string }>
}

export default async function ExercisesPage({ searchParams }: PageProps) {
  const { muscle, q, sort } = await searchParams

  const activeMuscle =
    muscle && VALID_MUSCLE_GROUPS.includes(muscle as MuscleGroup)
      ? (muscle as MuscleGroup)
      : undefined

  const activeSort =
    sort && VALID_SORTS.includes(sort as ExerciseSort)
      ? (sort as ExerciseSort)
      : undefined

  const allExercises = await exerciseRepo.findAll()

  return (
    <div className="px-6 pb-8">
      {/* Encabezado */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <p className="text-sm text-zinc-400">
          Ejercicios del catálogo con parámetros de trabajo y notas de seguridad.
        </p>
        <ExerciseActions allExercises={allExercises} />
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <Suspense fallback={<div className="h-16" />}>
          <ExerciseFilters />
        </Suspense>
      </div>

      {/* Grid */}
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
        <ExerciseGrid muscleGroup={activeMuscle} search={q} sort={activeSort} />
      </Suspense>
    </div>
  )
}
