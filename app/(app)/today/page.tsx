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
  const [todayData, allExercises] = await Promise.all([
    sessionRepo.getTodayData(user.id),
    exerciseRepo.findAll(),
  ])

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  // TODO(Plan B): Handle multiple routines. For now, we take the first one.
  const routine = todayData.entries[0]?.routine ?? null
  const dailyLog = todayData.dailyLogs[0] ?? null

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <TodaySession
        routine={routine}
        dailyLog={dailyLog}
        allExercises={allExercises}
        today={today}
      />
    </div>
  )
}