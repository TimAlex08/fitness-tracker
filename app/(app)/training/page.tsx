/**
 * TrainingPage — dashboard principal de entrenamiento.
 * Server Component: pre-carga la semana actual.
 * Delega la interactividad (cambio de vista) a TrainingDashboard.
 */

import { getWeekData } from "@/lib/training"
import { TrainingDashboard } from "@/components/training/training-dashboard"

export default async function TrainingPage() {
  const weekData = await getWeekData(new Date())

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <TrainingDashboard weekData={weekData} />
    </div>
  )
}
