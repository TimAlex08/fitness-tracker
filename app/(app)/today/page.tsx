/**
 * TodayPage — vista principal de sesión activa.
 * Server Component: obtiene datos de rutina, log del día y catálogo de ejercicios.
 * Delega toda la interactividad a TodaySession (Client Component).
 */

import { CalendarDays } from "lucide-react"
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { TodaySession } from "@/features/session/components/today-session"
import { getRequiredSession } from "@/lib/get-session"

const sessionRepo = new PrismaSessionRepository()
const exerciseRepo = new PrismaExerciseRepository()

export default async function TodayPage() {
  const user = await getRequiredSession()
  const [{ routine, dailyLog }, allExercises] = await Promise.all([
    sessionRepo.getTodayData(user.id),
    exerciseRepo.findAll(),
  ])

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1 capitalize">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span>{today}</span>
        </div>
        <h1 className="text-2xl font-bold text-white">
          {routine ? routine.name : "Día de descanso"}
        </h1>
        {routine && (
          <p className="text-sm text-zinc-400 mt-1">
            {routine.durationMin && `${routine.durationMin} min estimados · `}
            {routine.exercises.length} ejercicios
          </p>
        )}
      </div>

      <TodaySession
        routine={routine}
        dailyLog={dailyLog}
        allExercises={allExercises}
      />
    </div>
  )
}
