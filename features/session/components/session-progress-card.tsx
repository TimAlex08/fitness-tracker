"use client"

type SessionProgressCardProps = {
  completedCount: number
  totalCount: number
  label?: string
  onStartFree?: () => void
}

export function SessionProgressCard({
  completedCount,
  totalCount,
  label,
  onStartFree,
}: SessionProgressCardProps) {
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">{label ?? "Progreso"}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            {completedCount}/{totalCount} ejercicios
          </span>
          {onStartFree && (
            <button
              onClick={onStartFree}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              + Sesión libre
            </button>
          )}
        </div>
      </div>
      <div
        className="h-2 rounded-full bg-zinc-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${completedCount} de ${totalCount} ejercicios completados`}
      >
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}
