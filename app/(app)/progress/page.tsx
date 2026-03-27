/**
 * ProgressPage — Sprint 4: "Veo mi avance".
 * Server Component: obtiene todos los datos de progreso y los pasa a componentes de UI.
 */

import { getRequiredSession } from "@/lib/get-session"
import { PrismaProgressRepository } from "@/features/progress/api/prisma-progress-repository"
import { prisma } from "@/lib/prisma"
import { StatsStrip } from "@/features/progress/components/stats-strip"
import { VolumeChart } from "@/features/progress/components/volume-chart"
import { ExerciseProgressionList } from "@/features/progress/components/exercise-progression"
import { PainTracker } from "@/features/progress/components/pain-tracker"
import { PhaseBenchmarks } from "@/features/progress/components/phase-benchmarks"
import { MeasurementsSection } from "@/features/progress/components/measurements-section"
import { ExportButton } from "@/features/progress/components/export-button"

const progressRepo = new PrismaProgressRepository()

export default async function ProgressPage() {
  const user = await getRequiredSession()

  const [progressData, measurements] = await Promise.all([
    progressRepo.getProgressData(user.id),
    prisma.bodyMeasurement.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ])

  const { stats, weeklyVolume, exerciseProgressions, weeklyPain, phase } = progressData

  return (
    <div className="px-4 pb-10 max-w-2xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-white">Progreso</h1>
        <ExportButton />
      </div>

      {/* Stats strip */}
      <StatsStrip stats={stats} />

      {/* Volumen semanal */}
      <VolumeChart data={weeklyVolume} />

      {/* Progresión por ejercicio */}
      <ExerciseProgressionList progressions={exerciseProgressions} />

      {/* Dolor semanal */}
      <PainTracker data={weeklyPain} />

      {/* Benchmarks de fase */}
      {phase && <PhaseBenchmarks phase={phase} stats={stats} />}

      {/* Mediciones corporales */}
      <MeasurementsSection
        initialMeasurements={measurements.map((m) => ({
          id: m.id,
          date: m.date.toISOString(),
          weight: m.weight,
          waistCm: m.waistCm,
          hipCm: m.hipCm,
          chestCm: m.chestCm,
          armCm: m.armCm,
          thighCm: m.thighCm,
        }))}
      />
    </div>
  )
}
