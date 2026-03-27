import type { ExerciseProgression } from "../types/progress.types"

const FORM_LABEL: Record<string, string> = {
  PERFECT: "✦",
  GOOD: "✓",
  FAIR: "~",
  POOR: "✗",
}

const FORM_COLOR: Record<string, string> = {
  PERFECT: "text-emerald-400",
  GOOD: "text-green-400",
  FAIR: "text-yellow-400",
  POOR: "text-red-400",
}

interface ExerciseProgressionProps {
  progressions: ExerciseProgression[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
  })
}

function repsLabel(reps: number[]): string {
  if (reps.length === 0) return "—"
  const allSame = reps.every((r) => r === reps[0])
  return allSame ? `${reps.length}×${reps[0]}` : reps.join(", ")
}

function TrendArrow({ sessions }: { sessions: ExerciseProgression["sessions"] }) {
  if (sessions.length < 2) return null
  const first = sessions[0].reps.reduce((s, r) => s + r, 0)
  const last = sessions[sessions.length - 1].reps.reduce((s, r) => s + r, 0)
  if (last > first) return <span className="text-emerald-400 text-xs">↑</span>
  if (last < first) return <span className="text-red-400 text-xs">↓</span>
  return <span className="text-zinc-500 text-xs">→</span>
}

export function ExerciseProgressionList({ progressions }: ExerciseProgressionProps) {
  if (progressions.length === 0) {
    return (
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
          Progresión por ejercicio
        </h2>
        <p className="text-sm text-zinc-600 py-4">
          Completa al menos 2 sesiones del mismo ejercicio para ver la progresión.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
        Progresión por ejercicio
      </h2>
      <div className="space-y-4">
        {progressions.map((prog) => (
          <div key={prog.exerciseId} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-medium text-white">{prog.exerciseName}</span>
              <TrendArrow sessions={prog.sessions} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-4 text-zinc-600 font-normal">Fecha</th>
                    <th className="text-left py-2 px-4 text-zinc-600 font-normal">Reps</th>
                    <th className="text-left py-2 px-4 text-zinc-600 font-normal">RPE</th>
                    <th className="text-left py-2 px-4 text-zinc-600 font-normal">Forma</th>
                    <th className="text-left py-2 px-4 text-zinc-600 font-normal">Dolor</th>
                  </tr>
                </thead>
                <tbody>
                  {prog.sessions.map((session) => (
                    <tr key={session.date} className="border-b border-zinc-800/50 last:border-0">
                      <td className="py-2.5 px-4 text-zinc-400">{formatDate(session.date)}</td>
                      <td className="py-2.5 px-4 font-mono text-zinc-300">{repsLabel(session.reps)}</td>
                      <td className="py-2.5 px-4 text-zinc-300">
                        {session.rpeActual !== null ? `${session.rpeActual}` : "—"}
                      </td>
                      <td className="py-2.5 px-4">
                        {session.formQuality ? (
                          <span className={FORM_COLOR[session.formQuality] ?? "text-zinc-400"}>
                            {FORM_LABEL[session.formQuality] ?? session.formQuality}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {session.painDuring !== null ? (
                          <span
                            className={
                              session.painDuring === 0
                                ? "text-emerald-400"
                                : session.painDuring <= 2
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }
                          >
                            {session.painDuring}/5
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
