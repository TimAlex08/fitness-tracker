"use client"

type SetRowProps = {
  index: number
  reps: number
  isIsometric: boolean
  targetReps?: number | null
  targetDuration?: number | null
  onReps: (reps: number) => void
}

export function SetRow({ index, reps, isIsometric, targetReps, targetDuration, onReps }: SetRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-600 w-12 shrink-0">Serie {index + 1}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          max={999}
          value={reps || ""}
          onChange={(e) => onReps(parseInt(e.target.value, 10) || 0)}
          placeholder={isIsometric ? `${targetDuration ?? 30}s` : `${targetReps ?? 0}`}
          className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-center text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
        <span className="text-xs text-zinc-600">{isIsometric ? "s" : "reps"}</span>
      </div>
    </div>
  )
}
