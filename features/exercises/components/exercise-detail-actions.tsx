"use client"

/**
 * ExerciseDetailActions — SRP:
 * Responsabilidad: botones Editar y Eliminar en la página de detalle.
 * Client component porque gestiona el estado del Sheet de edición y
 * la confirmación de borrado.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExerciseForm } from "@/features/exercises/components/exercise-form"
import type { Exercise } from "@/types"

type ExerciseDetailActionsProps = {
  exercise: Exercise
  allExercises: Exercise[]
}

export function ExerciseDetailActions({
  exercise,
  allExercises,
}: ExerciseDetailActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${exercise.name}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/exercises/${exercise.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setDeleteError(data.error ?? "Error al eliminar.")
        return
      }
      router.push("/exercises")
      router.refresh()
    } catch {
      setDeleteError("Error de red. Inténtalo de nuevo.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditOpen(true)}
          className="border-zinc-700 text-zinc-400 hover:text-white gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="border-red-900/60 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>

      {deleteError && (
        <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mt-2">
          {deleteError}
        </p>
      )}

      <ExerciseForm
        open={editOpen}
        onOpenChange={setEditOpen}
        exercise={exercise}
        allExercises={allExercises}
      />
    </>
  )
}
