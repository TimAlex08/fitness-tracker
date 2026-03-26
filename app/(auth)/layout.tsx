import { Dumbbell } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">Workout</span>
        </div>
        {children}
      </div>
    </div>
  )
}
