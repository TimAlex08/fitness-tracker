"use client"

import { useState } from "react"
import { Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExerciseForm } from "@/features/exercises/components/exercise-form"
import { ImportExercisesDialog } from "@/features/exercises/components/import-exercises-dialog"

export function ExerciseActions() {
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setImportOpen(true)}
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-400 hover:text-white gap-1.5"
        >
          <Upload className="h-4 w-4" />
          Importar
        </Button>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <ExerciseForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        exercise={null}
      />

      <ImportExercisesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </>
  )
}
