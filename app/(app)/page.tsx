/**
 * Vista General — Overview Dashboard
 * Rediseño basado en el plan 2026-03-30.
 */

import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"
import { PrismaProgressRepository } from "@/features/progress/api/prisma-progress-repository"
import { getRequiredSession } from "@/lib/get-session"
import { OverviewDashboard } from "@/features/session/components/overview-dashboard"

const trainingRepo = new PrismaTrainingRepository()
const progressRepo = new PrismaProgressRepository()

export default async function OverviewPage() {
  const user = await getRequiredSession()

  // Pre-carga de datos para los 7 días de la semana y métricas de progreso
  const [weekData, progressData] = await Promise.all([
    trainingRepo.getWeekData(new Date(), user.id),
    progressRepo.getProgressData(user.id),
  ])

  return (
    <OverviewDashboard
      weekDays={weekData.days}
      streak={progressData.stats.streak}
      sessionsThisMonth={progressData.stats.sessionsThisMonth}
    />
  )
}
