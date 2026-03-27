"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RoutineForm } from "./routine-form"
import type { Routine } from "@/types"

type Props = { routine: Routine }

export function RoutineHeaderActions({ routine }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar la rutina "${routine.name}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/routines/${routine.id}`, { method: "DELETE" })
      if (res.ok) router.push("/training/routines")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="border-zinc-700 text-zinc-400 hover:text-white gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-800 gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <RoutineForm open={editOpen} onOpenChange={setEditOpen} routine={routine} />
    </>
  )
}
