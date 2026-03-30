"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { X, GripVertical } from "lucide-react"
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

export interface PhaseDay {
  routineId: string
  dayOfWeek: string
}

type Props = {
  programId: string
  phaseId: string
  dayOfWeek: string
  allPhaseDays: PhaseDay[]
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
  // selectedIds preserva el orden definido por el usuario
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Drag state para la lista ordenada
  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => {
    const current = allPhaseDays
      .filter((d) => d.dayOfWeek === dayOfWeek)
      .map((d) => d.routineId)
    setSelectedIds(current)
    setSearch("")
    setError(null)
  }, [dayOfWeek, allPhaseDays])

  // selectedRoutines respeta el orden de selectedIds
  const selectedRoutines = selectedIds
    .map((id) => routines.find((r) => r.id === id))
    .filter((r): r is RoutineOption => r !== undefined)

  const filtered = routines.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggleRoutine(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────

  function handleDragStart(idx: number) {
    dragIdx.current = idx
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx.current !== null && dragIdx.current !== idx) {
      setDragOverIdx(idx)
    }
  }

  function handleDrop(toIdx: number) {
    const fromIdx = dragIdx.current
    if (fromIdx === null || fromIdx === toIdx) return
    setSelectedIds((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
    dragIdx.current = null
    setDragOverIdx(null)
  }

  function handleDragEnd() {
    dragIdx.current = null
    setDragOverIdx(null)
  }

  // ── Guardar ────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const otherDays = allPhaseDays.filter((d) => d.dayOfWeek !== dayOfWeek)
      // Preservar el orden de selectedIds al construir los días
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

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
        <SheetTitle className="text-white">
          {DAY_LABELS[dayOfWeek] ?? dayOfWeek}
        </SheetTitle>
        <p className="text-xs text-zinc-500 mt-1">
          Selecciona y ordena las rutinas para este día.
        </p>
      </SheetHeader>

      {/* Lista ordenada de rutinas seleccionadas */}
      {selectedRoutines.length > 0 && (
        <div className="px-6 pb-4 shrink-0 space-y-1.5">
          <p className="text-xs text-zinc-600 mb-2">
            Orden de ejecución — arrastra para reordenar
          </p>
          {selectedRoutines.map((r, idx) => (
            <div
              key={r.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                dragIdx.current === idx
                  ? "opacity-40 border-zinc-700 bg-zinc-900"
                  : dragOverIdx === idx
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900"
              }`}
            >
              <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 shrink-0">
                <GripVertical className="h-4 w-4" />
              </div>
              <span className="text-xs text-zinc-600 w-4 shrink-0">{idx + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className={`text-xs ${SESSION_TYPE_COLOR[r.sessionType] ?? "text-zinc-500"}`}>
                  {r.sessionType}{r.durationMin ? ` · ${r.durationMin} min` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleRoutine(r.id)}
                className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="px-6 pb-3 shrink-0">
        <Input
          placeholder="Buscar rutina..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar rutina"
          className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
          autoFocus={selectedRoutines.length === 0}
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
