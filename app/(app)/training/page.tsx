/**
 * TrainingPage — dashboard principal de entrenamiento.
 * Server Component: pre-carga la semana actual.
 * Delega la interactividad (cambio de vista) a TrainingDashboard.
 */

import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"
import { TrainingDashboard } from "@/features/training/components/training-dashboard"

const trainingRepo = new PrismaTrainingRepository()

export default async function TrainingPage() {
  const weekData = await trainingRepo.getWeekData(new Date())

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <TrainingDashboard weekData={weekData} />
    </div>
  )
}
