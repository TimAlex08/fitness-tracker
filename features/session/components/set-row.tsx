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
    <div className="flex items-center gap-3 py-0.5">
      <span className="text-[10px] uppercase font-bold text-zinc-600 w-12 shrink-0">Set {index + 1}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={999}
          value={reps || ""}
          onChange={(e) => onReps(parseInt(e.target.value, 10) || 0)}
          placeholder={isIsometric ? `${targetDuration ?? 30}` : `${targetReps ?? 0}`}
          className="w-14 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-center text-xs text-white placeholder-zinc-700 focus:border-emerald-500/50 focus:outline-none transition-all"
        />
        <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">
          {isIsometric ? "Seg" : "Reps"}
        </span>
      </div>
    </div>
  )
}
