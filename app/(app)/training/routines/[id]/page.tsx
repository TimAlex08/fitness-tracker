import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PrismaRoutineRepository } from "@/features/routines/api/prisma-routine-repository"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { getRequiredSession } from "@/lib/get-session"
import { RoutineExerciseEditor } from "@/features/routines/components/routine-exercise-editor"
import { RoutineHeaderActions } from "@/features/routines/components/routine-header-actions"

const routineRepo = new PrismaRoutineRepository()
const exerciseRepo = new PrismaExerciseRepository()

const SESSION_TYPE_LABEL: Record<string, string> = {
  TRAINING: "Entrenamiento",
  MOBILITY: "Movilidad",
  REST: "Descanso",
  DELOAD: "Deload",
}

type PageProps = { params: Promise<{ id: string }> }

export default async function RoutineDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getRequiredSession()

  const [routine, allExercises] = await Promise.all([
    routineRepo.findById(id, user.id),
    exerciseRepo.findAll(),
  ])

  if (!routine) notFound()

  return (
    <div className="px-6 pb-8 max-w-2xl mx-auto">
      {/* Navegación */}
      <Link
        href="/training/routines"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Rutinas
      </Link>

      {/* Cabecera */}
      <div className="mb-8">
        <p className="text-xs text-zinc-500 mb-1">
          {SESSION_TYPE_LABEL[routine.sessionType] ?? routine.sessionType}
          {routine.durationMin ? ` · ${routine.durationMin} min` : ""}
        </p>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">{routine.name}</h1>
          <RoutineHeaderActions routine={routine} />
        </div>
        {routine.description && (
          <p className="text-sm text-zinc-400 mt-2">{routine.description}</p>
        )}
      </div>

      {/* Editor de ejercicios */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
          Ejercicios · {routine.exercises.length}
        </h2>
        <RoutineExerciseEditor routine={routine} allExercises={allExercises} />
      </div>
    </div>
  )
}
