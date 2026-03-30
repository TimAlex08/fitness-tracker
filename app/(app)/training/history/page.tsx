import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"
import { TrainingDashboard } from "@/features/training/components/training-dashboard"
import { getRequiredSession } from "@/lib/get-session"

const trainingRepo = new PrismaTrainingRepository()

export default async function TrainingHistoryPage() {
  const user = await getRequiredSession()
  const weekData = await trainingRepo.getWeekData(new Date(), user.id)

  return (
    <div className="px-4 pb-6 max-w-3xl mx-auto">
      <TrainingDashboard weekData={weekData} />
    </div>
  )
}
