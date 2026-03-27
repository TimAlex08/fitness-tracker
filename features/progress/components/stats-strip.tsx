import { Flame, CalendarCheck, TrendingUp, Activity } from "lucide-react"
import type { ProgressStats } from "../types/progress.types"

interface StatsStripProps {
  stats: ProgressStats
}

interface StatProps {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}

function Stat({ icon, label, value, accent }: StatProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl bg-zinc-900 border border-zinc-800 flex-1 min-w-0">
      <div className={accent}>{icon}</div>
      <p className="text-xl font-bold text-white leading-none">{value}</p>
      <p className="text-xs text-zinc-500 text-center leading-tight">{label}</p>
    </div>
  )
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="flex gap-3">
      <Stat
        icon={<Flame className="h-5 w-5" />}
        label="Racha"
        value={`${stats.streak}d`}
        accent="text-orange-400"
      />
      <Stat
        icon={<CalendarCheck className="h-5 w-5" />}
        label="Este mes"
        value={`${stats.sessionsThisMonth}`}
        accent="text-emerald-400"
      />
      <Stat
        icon={<TrendingUp className="h-5 w-5" />}
        label="Adherencia"
        value={`${stats.adherencePercent}%`}
        accent="text-sky-400"
      />
      <Stat
        icon={<Activity className="h-5 w-5" />}
        label="RPE medio"
        value={stats.avgRpe !== null ? `${stats.avgRpe}` : "—"}
        accent="text-purple-400"
      />
    </div>
  )
}
