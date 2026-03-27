"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Check, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Exercise } from "@/types"
import type { RoutineWithExercises } from "../api/prisma-routine-repository"

// ─── Tipos locales ────────────────────────────────────────────────────────────

type Block = "warmup" | "main" | "cooldown"

interface LocalExercise {
  exerciseId: string
  name: string
  muscleGroup: string
  order: number
  block: Block
  sets: string
  reps: string
  durationSec: string
  restSec: string
  tempo: string
  rpe: string
  notes: string
}

const BLOCK_LABELS: Record<Block, string> = {
  warmup: "Calentamiento",
  main: "Bloque principal",
  cooldown: "Vuelta a la calma",
}

const BLOCKS: Block[] = ["warmup", "main", "cooldown"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function routineExerciseToLocal(re: RoutineWithExercises["exercises"][0]): LocalExercise {
  return {
    exerciseId: re.exerciseId,
    name: re.exercise.name,
    muscleGroup: re.exercise.muscleGroup,
    order: re.order,
    block: (re.block ?? "main") as Block,
    sets: re.sets?.toString() ?? "",
    reps: re.reps?.toString() ?? "",
    durationSec: re.durationSec?.toString() ?? "",
    restSec: re.restSec?.toString() ?? "",
    tempo: re.tempo ?? "",
    rpe: re.rpe?.toString() ?? "",
    notes: re.notes ?? "",
  }
}

function localToPayload(ex: LocalExercise, idx: number) {
  return {
    exerciseId: ex.exerciseId,
    order: idx,
    block: ex.block,
    sets: ex.sets ? parseInt(ex.sets) : null,
    reps: ex.reps ? parseInt(ex.reps) : null,
    durationSec: ex.durationSec ? parseInt(ex.durationSec) : null,
    restSec: ex.restSec ? parseInt(ex.restSec) : null,
    tempo: ex.tempo || null,
    rpe: ex.rpe ? parseFloat(ex.rpe) : null,
    notes: ex.notes || null,
  }
}

// ─── Sub-componente: fila de ejercicio ────────────────────────────────────────

function ExerciseRow({
  ex,
  idx,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onChange,
  onRemove,
}: {
  ex: LocalExercise
  idx: number
  isDragging: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  onChange: (field: keyof LocalExercise, value: string) => void
  onRemove: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`bg-zinc-900 border rounded-xl p-4 space-y-3 transition-all cursor-default ${
        isDragging
          ? "opacity-40 border-zinc-700"
          : isDragOver
            ? "border-emerald-500 shadow-[0_0_0_1px] shadow-emerald-500/40"
            : "border-zinc-800"
      }`}
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag handle */}
          <div
            className="shrink-0 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Arrastra para reordenar"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <span className="text-xs text-zinc-600 shrink-0 w-5 text-right">{idx + 1}.</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{ex.name}</p>
            <p className="text-xs text-zinc-500">{ex.muscleGroup}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Bloque */}
      <div className="flex gap-1">
        {BLOCKS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => onChange("block", b)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              ex.block === b
                ? "bg-emerald-600/20 border-emerald-600/50 text-emerald-400"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
            }`}
          >
            {BLOCK_LABELS[b]}
          </button>
        ))}
      </div>

      {/* Parámetros */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: "sets",        label: "Series",     placeholder: "3"       },
          { key: "reps",        label: "Reps",       placeholder: "10"      },
          { key: "durationSec", label: "Duración s",  placeholder: "30"     },
          { key: "restSec",     label: "Descanso s",  placeholder: "60"     },
          { key: "tempo",       label: "Tempo",       placeholder: "2-1-2-0" },
          { key: "rpe",         label: "RPE",         placeholder: "7"      },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
            <Input
              value={(ex as unknown as Record<string, string>)[key]}
              onChange={(e) => onChange(key as keyof LocalExercise, e.target.value)}
              placeholder={placeholder}
              className="h-8 text-xs bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

type Props = {
  routine: RoutineWithExercises
  allExercises: Exercise[]
}

export function RoutineExerciseEditor({ routine, allExercises }: Props) {
  const router = useRouter()
  const [exercises, setExercises] = useState<LocalExercise[]>(
    routine.exercises.map(routineExerciseToLocal)
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  // ── Drag & drop state ───────────────────────────────────────────────────────

  const dragIdx = useRef<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

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
    setExercises((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
    setSaved(false)
    dragIdx.current = null
    setDragOverIdx(null)
  }

  function handleDragEnd() {
    dragIdx.current = null
    setDragOverIdx(null)
  }

  // ── Mutaciones locales ──────────────────────────────────────────────────────

  function updateExercise(idx: number, field: keyof LocalExercise, value: string) {
    setExercises((prev) => prev.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex))
    setSaved(false)
  }

  function removeExercise(idx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== idx))
    setSaved(false)
  }

  function addExercise(exercise: Exercise) {
    const alreadyIn = exercises.some((ex) => ex.exerciseId === exercise.id)
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        order: prev.length,
        block: "main",
        sets: exercise.defaultSets?.toString() ?? "3",
        reps: exercise.defaultReps?.toString() ?? "",
        durationSec: exercise.defaultDurationSec?.toString() ?? "",
        restSec: exercise.defaultRestSec?.toString() ?? "60",
        tempo: exercise.defaultTempo ?? "",
        rpe: exercise.defaultRpe?.toString() ?? "",
        notes: "",
      },
    ])
    if (alreadyIn) return
    setPickerOpen(false)
    setPickerSearch("")
    setSaved(false)
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/routines/${routine.id}/exercises`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises: exercises.map(localToPayload) }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error guardando")
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setError("Error de red. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  // ── Filtro de picker ────────────────────────────────────────────────────────

  const filteredExercises = allExercises.filter((ex) =>
    ex.name.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  // ── Agrupación por bloque (solo visual) ─────────────────────────────────────

  const byBlock = BLOCKS.map((block) => ({
    block,
    label: BLOCK_LABELS[block],
    items: exercises
      .map((ex, originalIdx) => ({ ex, originalIdx }))
      .filter(({ ex }) => ex.block === block),
  })).filter(({ items }) => items.length > 0)

  const ungrouped = exercises
    .map((ex, originalIdx) => ({ ex, originalIdx }))
    .filter(({ ex }) => !BLOCKS.includes(ex.block))

  return (
    <div className="space-y-6">
      {exercises.length === 0 ? (
        <div className="text-center py-12 text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-xl">
          No hay ejercicios. Agrega el primero.
        </div>
      ) : (
        <>
          {byBlock.map(({ block, label, items }) => (
            <div key={block}>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                {label}
              </p>
              <div className="space-y-3">
                {items.map(({ ex, originalIdx }) => (
                  <ExerciseRow
                    key={`${ex.exerciseId}-${originalIdx}`}
                    ex={ex}
                    idx={originalIdx}
                    isDragging={dragIdx.current === originalIdx}
                    isDragOver={dragOverIdx === originalIdx}
                    onDragStart={() => handleDragStart(originalIdx)}
                    onDragOver={(e) => handleDragOver(e, originalIdx)}
                    onDrop={() => handleDrop(originalIdx)}
                    onDragEnd={handleDragEnd}
                    onChange={(field, value) => updateExercise(originalIdx, field, value)}
                    onRemove={() => removeExercise(originalIdx)}
                  />
                ))}
              </div>
            </div>
          ))}
          {ungrouped.map(({ ex, originalIdx }) => (
            <ExerciseRow
              key={`${ex.exerciseId}-${originalIdx}`}
              ex={ex}
              idx={originalIdx}
              isDragging={dragIdx.current === originalIdx}
              isDragOver={dragOverIdx === originalIdx}
              onDragStart={() => handleDragStart(originalIdx)}
              onDragOver={(e) => handleDragOver(e, originalIdx)}
              onDrop={() => handleDrop(originalIdx)}
              onDragEnd={handleDragEnd}
              onChange={(field, value) => updateExercise(originalIdx, field, value)}
              onRemove={() => removeExercise(originalIdx)}
            />
          ))}
        </>
      )}

      {/* Botón agregar */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="w-full border border-dashed border-zinc-700 hover:border-emerald-600 rounded-xl py-3 text-sm text-zinc-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Agregar ejercicio
      </button>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Guardar */}
      <Button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
      >
        {saving ? "Guardando..." : saved ? (
          <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Guardado</span>
        ) : "Guardar cambios"}
      </Button>

      {/* Sheet: picker de ejercicios */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-zinc-950 border-zinc-800 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
            <SheetTitle className="text-white">Agregar ejercicio</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-2 shrink-0">
            <Input
              placeholder="Buscar..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-1.5 mt-2">
            {filteredExercises.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">Sin resultados</p>
            ) : (
              filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => addExercise(ex)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <p className="text-sm font-medium text-white">{ex.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {ex.muscleGroup} · {ex.movementType}
                  </p>
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
