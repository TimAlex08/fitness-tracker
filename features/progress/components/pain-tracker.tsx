import type { WeeklyPain } from "../types/progress.types"

interface PainTrackerProps {
  data: WeeklyPain[]
}

function painColor(avg: number | null): string {
  if (avg === null) return "bg-zinc-800"
  if (avg === 0) return "bg-emerald-500"
  if (avg <= 1.5) return "bg-yellow-400"
  if (avg <= 3) return "bg-orange-400"
  return "bg-red-500"
}

export function PainTracker({ data }: PainTrackerProps) {
  const hasAnyData = data.some((d) => d.avgPain !== null)

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
        Dolor promedio semanal
      </h2>

      {!hasAnyData ? (
        <p className="text-sm text-zinc-600 py-4">
          Registra dolor en tus sesiones para ver el seguimiento.
        </p>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 pt-4 pb-3">
          <div className="flex items-end gap-2 h-20">
            {data.map((week) => {
              const heightPct = week.avgPain !== null ? (week.avgPain / 5) * 100 : 0
              return (
                <div key={week.weekLabel} className="flex flex-col items-center gap-1 flex-1 min-w-0 h-full justify-end">
                  <span className="text-[10px] text-zinc-500 leading-none">
                    {week.avgPain !== null ? week.avgPain : ""}
                  </span>
                  <div
                    className={`w-full rounded-t-sm transition-all ${painColor(week.avgPain)}`}
                    style={{ height: `${Math.max(heightPct, week.avgPain !== null ? 8 : 0)}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 mt-2 border-t border-zinc-800 pt-2">
            {data.map((week) => (
              <div key={week.weekLabel} className="flex-1 min-w-0 text-center">
                <span className="text-[10px] text-zinc-600">{week.weekLabel}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-zinc-600">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500 inline-block" />0 sin dolor</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-yellow-400 inline-block" />1-2 leve</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-orange-400 inline-block" />3 moderado</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-500 inline-block" />4-5 alto</span>
          </div>
        </div>
      )}
    </div>
  )
}
