import type { PhaseInfo, ProgressStats } from "../types/progress.types"
import { Target } from "lucide-react"

interface PhaseBenchmarksProps {
  phase: PhaseInfo
  stats: ProgressStats
}

export function PhaseBenchmarks({ phase, stats }: PhaseBenchmarksProps) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
        Benchmarks de fase
      </h2>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">{phase.name}</span>
          {phase.weekStart !== null && phase.weekEnd !== null && (
            <span className="text-xs text-zinc-500 ml-auto">
              Sem. {phase.weekStart}–{phase.weekEnd}
            </span>
          )}
        </div>

        <div className="divide-y divide-zinc-800">
          {phase.rpeTarget && (
            <BenchmarkRow
              label="RPE objetivo"
              target={phase.rpeTarget}
              actual={stats.avgRpe !== null ? `${stats.avgRpe}/10` : null}
              ok={
                stats.avgRpe !== null
                  ? isRpeOnTarget(stats.avgRpe, phase.rpeTarget)
                  : null
              }
            />
          )}

          <BenchmarkRow
            label="Sesiones este mes"
            target="≥ 8"
            actual={`${stats.sessionsThisMonth}`}
            ok={stats.sessionsThisMonth >= 8}
          />

          <BenchmarkRow
            label="Adherencia"
            target="≥ 80%"
            actual={`${stats.adherencePercent}%`}
            ok={stats.adherencePercent >= 80}
          />
        </div>
      </div>
    </div>
  )
}

function isRpeOnTarget(actual: number, target: string): boolean {
  const match = target.match(/(\d+)-(\d+)/)
  if (match) {
    return actual >= parseFloat(match[1]) && actual <= parseFloat(match[2])
  }
  const single = parseFloat(target)
  if (!isNaN(single)) return Math.abs(actual - single) <= 0.5
  return false
}

function BenchmarkRow({
  label,
  target,
  actual,
  ok,
}: {
  label: string
  target: string
  actual: string | null
  ok: boolean | null
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-600">Objetivo: {target}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{actual ?? "—"}</span>
        {ok !== null && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              ok
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {ok ? "✓" : "✗"}
          </span>
        )}
      </div>
    </div>
  )
}
