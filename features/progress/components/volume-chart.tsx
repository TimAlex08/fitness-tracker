import type { WeeklyVolume } from "../types/progress.types"

interface VolumeChartProps {
  data: WeeklyVolume[]
}

export function VolumeChart({ data }: VolumeChartProps) {
  const maxExercises = Math.max(...data.map((d) => d.exercisesCompleted), 1)

  const hasAnyData = data.some((d) => d.exercisesCompleted > 0)

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
        Volumen semanal
      </h2>

      {!hasAnyData ? (
        <p className="text-sm text-zinc-600 py-4">
          Completa sesiones para ver el volumen semanal.
        </p>
      ) : (
        <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 pt-4 pb-3">
          <div className="flex items-end gap-2 h-28">
            {data.map((week) => {
              const heightPct =
                maxExercises > 0 ? (week.exercisesCompleted / maxExercises) * 100 : 0
              const isCurrentWeek =
                week.weekStart === data[data.length - 1].weekStart

              return (
                <div key={week.weekStart} className="flex flex-col items-center gap-1 flex-1 min-w-0 h-full justify-end">
                  <span className="text-[10px] text-zinc-500 leading-none">
                    {week.exercisesCompleted > 0 ? week.exercisesCompleted : ""}
                  </span>
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      isCurrentWeek ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                    style={{ height: `${Math.max(heightPct, week.exercisesCompleted > 0 ? 8 : 0)}%` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 mt-2 border-t border-zinc-800 pt-2">
            {data.map((week) => (
              <div key={week.weekStart} className="flex-1 min-w-0 text-center">
                <span className="text-[10px] text-zinc-600">{week.weekLabel}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-2">Ejercicios completados por semana</p>
        </div>
      )}
    </div>
  )
}
