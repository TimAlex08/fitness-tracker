"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { LayoutGrid, Info } from "lucide-react"

interface ProgramInfoStepProps {
  name: string
  description: string
  onChange: (name: string, description: string) => void
}

export function ProgramInfoStep({ name, description, onChange }: ProgramInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <LayoutGrid className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Define tu Programa</h2>
        <p className="text-zinc-500 text-sm px-8">
          Empecemos por darle un nombre y una descripción a tu nuevo bloque de entrenamiento.
        </p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="program-name" className="text-xs uppercase font-bold tracking-widest text-zinc-500 ml-1">
              Nombre del Programa
            </Label>
            <Input
              id="program-name"
              placeholder="Ej: Empuje y Tracción Intermedio"
              value={name}
              onChange={(e) => onChange(e.target.value, description)}
              className="bg-zinc-950 border-zinc-800 text-white h-12 rounded-xl focus:border-emerald-500/50"
            />
            {name.length > 0 && name.length < 3 && (
              <p className="text-[10px] text-orange-400 ml-1 font-medium italic">
                El nombre debe tener al menos 3 caracteres
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-description" className="text-xs uppercase font-bold tracking-widest text-zinc-500 ml-1">
              Descripción (Opcional)
            </Label>
            <Textarea
              id="program-description"
              placeholder="Ej: Enfocado en hipertrofia de tren superior con frecuencia 2..."
              value={description}
              onChange={(e) => onChange(name, e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-400 h-32 rounded-2xl resize-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex gap-3 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
            <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-500 leading-relaxed italic">
              Este programa reemplazará a tu programa actual como el bloque activo una vez que lo finalices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
