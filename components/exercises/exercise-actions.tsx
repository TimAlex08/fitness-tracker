"use client"

/**
 * ExerciseActions — SRP:
 * Responsabilidad: botón "Nuevo ejercicio" + apertura del Sheet de creación.
 * Client component porque maneja el estado open del Sheet.
 */

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExerciseForm } from "@/components/exercises/exercise-form"
import type { Exercise } from "@/types"

type ExerciseActionsProps = {
  allExercises: Exercise[]
}

export function ExerciseActions({ allExercises }: ExerciseActionsProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
        size="sm"
      >
        <Plus className="h-4 w-4" />
        Nuevo ejercicio
      </Button>

      <ExerciseForm
        open={open}
        onOpenChange={setOpen}
        exercise={null}
        allExercises={allExercises}
      />
    </>
  )
}
