"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProgramForm({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setName("")
    setDescription("")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("El nombre es obligatorio."); return }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isActive: true,
          phases: [
            {
              name: "Fase 1",
              order: 0,
              weekStart: 1,
              weekEnd: 4,
            },
          ],
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error guardando."); return }

      reset()
      onOpenChange(false)
      router.push(`/training/plan?program=${data.id}`)
      router.refresh()
    } catch {
      setError("Error de red. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-zinc-950 border-zinc-800 overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-white">Nuevo programa</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Nombre *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Fase Cero — Integridad Estructural"
              autoFocus
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600"
            />
          </div>

          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo, contexto..."
              className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600 resize-none min-h-[80px]"
            />
          </div>

          <p className="text-xs text-zinc-500">
            Se creará con una fase inicial vacía. Luego podrás asignar rutinas a cada día.
          </p>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onOpenChange(false) }}
              className="flex-1 border-zinc-700 text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {saving ? "Creando..." : "Crear programa"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
