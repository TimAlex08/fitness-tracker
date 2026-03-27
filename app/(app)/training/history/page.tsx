import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"
import { TrainingDashboard } from "@/features/training/components/training-dashboard"

const trainingRepo = new PrismaTrainingRepository()

export default async function TrainingHistoryPage() {
  const weekData = await trainingRepo.getWeekData(new Date())

  return (
    <div className="px-4 pb-6 max-w-3xl mx-auto">
      <TrainingDashboard weekData={weekData} />
    </div>
  )
}
