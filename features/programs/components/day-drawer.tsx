"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
}

const SESSION_TYPE_COLOR: Record<string, string> = {
  TRAINING: "text-emerald-400",
  MOBILITY: "text-blue-400",
  REST: "text-zinc-500",
  DELOAD: "text-yellow-400",
}

export interface RoutineOption {
  id: string
  name: string
  sessionType: string
  durationMin: number | null
}

// All current days for the phase (used to rebuild the full list on save)
export interface PhaseDay {
  routineId: string
  dayOfWeek: string
}

type Props = {
  programId: string
  phaseId: string
  dayOfWeek: string
  allPhaseDays: PhaseDay[]  // all days for this phase
  routines: RoutineOption[]
  onClose: () => void
  onSaved: () => void
}

export function DayDrawer({
  programId,
  phaseId,
  dayOfWeek,
  allPhaseDays,
  routines,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const current = allPhaseDays
      .filter((d) => d.dayOfWeek === dayOfWeek)
      .map((d) => d.routineId)
    setSelectedIds(current)
    setSearch("")
    setError(null)
  }, [dayOfWeek, allPhaseDays])

  const filtered = routines.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggleRoutine(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      // Keep all other days, replace entries for this dayOfWeek
      const otherDays = allPhaseDays.filter((d) => d.dayOfWeek !== dayOfWeek)
      const updatedDays = selectedIds.map((routineId) => ({ routineId, dayOfWeek }))
      const allDays = [...otherDays, ...updatedDays]

      const res = await fetch(
        `/api/programs/${programId}/phases/${phaseId}/days`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: allDays }),
        }
      )
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error guardando")
        return
      }
      router.refresh()
      onSaved()
    } catch {
      setError("Error de red. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const selectedRoutines = routines.filter((r) => selectedIds.includes(r.id))

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
        <SheetTitle className="text-white">
          {DAY_LABELS[dayOfWeek] ?? dayOfWeek}
        </SheetTitle>
        <p className="text-xs text-zinc-500 mt-1">
          Selecciona las rutinas para este día.
        </p>
      </SheetHeader>

      {/* Selected tags */}
      {selectedRoutines.length > 0 && (
        <div className="px-6 pb-3 shrink-0 flex flex-wrap gap-2">
          {selectedRoutines.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-600/20 border border-emerald-600/40 text-emerald-400"
            >
              {r.name}
              <button
                type="button"
                onClick={() => toggleRoutine(r.id)}
                className="hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="px-6 pb-3 shrink-0">
        <Input
          placeholder="Buscar rutina..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
          autoFocus
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 space-y-1.5">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">Sin resultados</p>
        ) : (
          filtered.map((r) => {
            const isSelected = selectedIds.includes(r.id)
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRoutine(r.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  isSelected
                    ? "bg-emerald-600/10 border-emerald-600/40"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <p className={`text-sm font-medium ${isSelected ? "text-emerald-400" : "text-white"}`}>
                  {r.name}
                </p>
                <p className={`text-xs mt-0.5 ${SESSION_TYPE_COLOR[r.sessionType] ?? "text-zinc-500"}`}>
                  {r.sessionType}{r.durationMin ? ` · ${r.durationMin} min` : ""}
                </p>
              </button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 shrink-0 border-t border-zinc-800 space-y-2">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-zinc-700 text-zinc-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
