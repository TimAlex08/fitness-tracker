import { Dumbbell } from "lucide-react"

export default function RoutinesPage() {
  return (
    <div className="px-6 pb-8 flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-zinc-800 p-4 mb-4">
        <Dumbbell className="h-6 w-6 text-zinc-500" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-1">Rutinas</h2>
      <p className="text-sm text-zinc-500 max-w-xs">
        Aquí podrás crear y gestionar tus rutinas. Próximamente en el Paso 4.
      </p>
    </div>
  )
}
