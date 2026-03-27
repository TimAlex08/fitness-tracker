import { TrainingTabs } from "@/components/training/training-tabs"

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <div className="pt-6 px-6">
        <h1 className="text-2xl font-bold text-white mb-4">Entrenamiento</h1>
      </div>
      <TrainingTabs />
      <div>{children}</div>
    </div>
  )
}
