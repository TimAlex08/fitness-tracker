"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Watch, Moon, Zap, Scale } from "lucide-react"

export type PostSessionData = {
  overallRpe: number | null
  energyLevel: number | null
  sleepHours: number | null
  sleepQuality: number | null
  mood: number | null
  bodyWeight: number | null
  notes: string
  watchHrAvg: number | null
  watchHrMax: number | null
  watchCalories: number | null
  watchActiveMinutes: number | null
  watchSpO2: number | null
  watchStressScore: number | null
}

type PostSessionFormProps = {
  onSubmit: (data: PostSessionData) => Promise<void>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function NumericInput({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  unit,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  min?: number
  max?: number
  step?: number
  unit?: string
}) {
  return (
    <div>
      <Label className="text-xs text-zinc-400 mb-1 block">{label}</Label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={min}
          max={max}
          step={step ?? 1}
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value ? parseFloat(e.target.value) : null)
          }
          placeholder={placeholder ?? "—"}
          className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
        {unit && <span className="text-xs text-zinc-500">{unit}</span>}
      </div>
    </div>
  )
}

function ScaleSelector({
  label,
  value,
  max,
  onChange,
  colors,
}: {
  label: string
  value: number | null
  max: number
  onChange: (v: number) => void
  colors?: string[]
}) {
  return (
    <div>
      <Label className="text-xs text-zinc-400 mb-1.5 block">{label}</Label>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
              value === n
                ? colors?.[n - 1] ?? "bg-emerald-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function PostSessionForm({ onSubmit }: PostSessionFormProps) {
  const [data, setData] = useState<PostSessionData>({
    overallRpe: null,
    energyLevel: null,
    sleepHours: null,
    sleepQuality: null,
    mood: null,
    bodyWeight: null,
    notes: "",
    watchHrAvg: null,
    watchHrMax: null,
    watchCalories: null,
    watchActiveMinutes: null,
    watchSpO2: null,
    watchStressScore: null,
  })
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof PostSessionData>(key: K, value: PostSessionData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white mb-0.5">
          Resumen de sesión
        </h2>
        <p className="text-xs text-zinc-500">
          Todos los campos son opcionales pero mejoran el análisis.
        </p>
      </div>

      {/* Percepción subjetiva */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Zap className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Percepción subjetiva
          </span>
        </div>

        <ScaleSelector
          label="RPE general de la sesión (1-10)"
          value={data.overallRpe}
          max={10}
          onChange={(v) => set("overallRpe", v)}
        />
        <ScaleSelector
          label="Nivel de energía pre-entrenamiento (1-5)"
          value={data.energyLevel}
          max={5}
          onChange={(v) => set("energyLevel", v)}
        />
        <ScaleSelector
          label="Estado de ánimo (1-5)"
          value={data.mood}
          max={5}
          onChange={(v) => set("mood", v)}
        />
      </div>

      {/* Sueño */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Moon className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Sueño (noche anterior)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumericInput
            label="Horas dormidas"
            value={data.sleepHours}
            onChange={(v) => set("sleepHours", v)}
            placeholder="7.5"
            min={0}
            max={24}
            step={0.5}
            unit="h"
          />
          <ScaleSelector
            label="Calidad del sueño (1-5)"
            value={data.sleepQuality}
            max={5}
            onChange={(v) => set("sleepQuality", v)}
          />
        </div>
      </div>

      {/* Peso corporal */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Scale className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Cuerpo
          </span>
        </div>
        <NumericInput
          label="Peso corporal"
          value={data.bodyWeight}
          onChange={(v) => set("bodyWeight", v)}
          placeholder="75.5"
          min={0}
          step={0.1}
          unit="kg"
        />
      </div>

      {/* Samsung Watch */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <Watch className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Samsung Watch 5 (opcional)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumericInput
            label="FC promedio"
            value={data.watchHrAvg}
            onChange={(v) => set("watchHrAvg", v)}
            placeholder="132"
            unit="bpm"
          />
          <NumericInput
            label="FC máxima"
            value={data.watchHrMax}
            onChange={(v) => set("watchHrMax", v)}
            placeholder="168"
            unit="bpm"
          />
          <NumericInput
            label="Calorías activas"
            value={data.watchCalories}
            onChange={(v) => set("watchCalories", v)}
            placeholder="320"
            unit="kcal"
          />
          <NumericInput
            label="Minutos activos"
            value={data.watchActiveMinutes}
            onChange={(v) => set("watchActiveMinutes", v)}
            placeholder="40"
            unit="min"
          />
          <NumericInput
            label="SpO2 promedio"
            value={data.watchSpO2}
            onChange={(v) => set("watchSpO2", v)}
            placeholder="98"
            unit="%"
          />
          <NumericInput
            label="Nivel de estrés"
            value={data.watchStressScore}
            onChange={(v) => set("watchStressScore", v)}
            placeholder="25"
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Notas */}
      <div>
        <Label className="text-xs text-zinc-400 mb-1.5 block">
          Notas generales
        </Label>
        <Textarea
          value={data.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Cómo te sentiste, qué mejorar, observaciones..."
          className="text-sm bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600 resize-none min-h-[80px]"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
      >
        {submitting ? "Guardando sesión..." : "Finalizar y guardar sesión"}
      </Button>
    </div>
  )
}
