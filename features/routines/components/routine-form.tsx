"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Routine } from "@/types"

const SESSION_TYPES = [
  { value: "TRAINING",  label: "Entrenamiento" },
  { value: "MOBILITY",  label: "Movilidad"     },
  { value: "REST",      label: "Descanso"       },
  { value: "DELOAD",    label: "Deload"         },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  routine?: Routine | null  // null = crear, Routine = editar
}

export function RoutineForm({ open, onOpenChange, routine }: Props) {
  const router = useRouter()
  const isEditing = !!routine

  const [name, setName] = useState("")
  const [sessionType, setSessionType] = useState("TRAINING")
  const [durationMin, setDurationMin] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (routine) {
      setName(routine.name)
      setSessionType(routine.sessionType)
      setDurationMin(routine.durationMin?.toString() ?? "")
      setDescription(routine.description ?? "")
    } else {
      setName("")
      setSessionType("TRAINING")
      setDurationMin("")
      setDescription("")
    }
    setError(null)
  }, [routine, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("El nombre es obligatorio."); return }

    setSaving(true)
    setError(null)

    const payload = {
      name: name.trim(),
      sessionType,
      durationMin: durationMin ? parseInt(durationMin) : null,
      description: description.trim() || null,
    }

    try {
      const url = isEditing ? `/api/routines/${routine!.id}` : "/api/routines"
      const method = isEditing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error guardando."); return }

      onOpenChange(false)
      if (!isEditing) {
        router.push(`/training/routines/${data.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError("Error de red. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-zinc-950 border-zinc-800 overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-white">
            {isEditing ? "Editar rutina" : "Nueva rutina"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Nombre *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Full Body A"
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-zinc-400 mb-1.5 block">Tipo de sesión</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-zinc-300">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-zinc-400 mb-1.5 block">Duración (min)</Label>
              <Input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="45"
                className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-400 mb-1.5 block">Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas sobre esta rutina..."
              className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600 resize-none min-h-[80px]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-zinc-700 text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar" : "Crear rutina"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
