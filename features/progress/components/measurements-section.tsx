"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Measurement {
  id: string
  date: string
  weight: number | null
  waistCm: number | null
  hipCm: number | null
  chestCm: number | null
  armCm: number | null
  thighCm: number | null
}

interface MeasurementsSectionProps {
  initialMeasurements: Measurement[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function MeasurementsSection({ initialMeasurements }: MeasurementsSectionProps) {
  const [measurements, setMeasurements] = useState(initialMeasurements)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weight: "",
    waistCm: "",
    hipCm: "",
    chestCm: "",
    armCm: "",
    thighCm: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const payload: Record<string, string | number> = { date: form.date }
    if (form.weight) payload.weight = parseFloat(form.weight)
    if (form.waistCm) payload.waistCm = parseFloat(form.waistCm)
    if (form.hipCm) payload.hipCm = parseFloat(form.hipCm)
    if (form.chestCm) payload.chestCm = parseFloat(form.chestCm)
    if (form.armCm) payload.armCm = parseFloat(form.armCm)
    if (form.thighCm) payload.thighCm = parseFloat(form.thighCm)

    const res = await fetch("/api/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const created = await res.json()
      setMeasurements((prev) => [
        {
          id: created.id,
          date: created.date,
          weight: created.weight,
          waistCm: created.waistCm,
          hipCm: created.hipCm,
          chestCm: created.chestCm,
          armCm: created.armCm,
          thighCm: created.thighCm,
        },
        ...prev,
      ])
      setShowForm(false)
      setForm({ date: new Date().toISOString().split("T")[0], weight: "", waistCm: "", hipCm: "", chestCm: "", armCm: "", thighCm: "" })
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Mediciones corporales
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="h-7 gap-1 text-xs text-zinc-400 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 mb-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-zinc-500 mb-1 block">Fecha</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="h-9 text-sm bg-zinc-800 border-zinc-700"
                required
              />
            </div>
            <Field label="Peso (kg)" value={form.weight} onChange={(v) => setForm((f) => ({ ...f, weight: v }))} />
            <Field label="Cintura (cm)" value={form.waistCm} onChange={(v) => setForm((f) => ({ ...f, waistCm: v }))} />
            <Field label="Cadera (cm)" value={form.hipCm} onChange={(v) => setForm((f) => ({ ...f, hipCm: v }))} />
            <Field label="Pecho (cm)" value={form.chestCm} onChange={(v) => setForm((f) => ({ ...f, chestCm: v }))} />
            <Field label="Brazo (cm)" value={form.armCm} onChange={(v) => setForm((f) => ({ ...f, armCm: v }))} />
            <Field label="Muslo (cm)" value={form.thighCm} onChange={(v) => setForm((f) => ({ ...f, thighCm: v }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-xs">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="text-xs bg-emerald-600 hover:bg-emerald-500">
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      )}

      {measurements.length === 0 ? (
        <p className="text-sm text-zinc-600 py-4">
          Aún no hay mediciones registradas.
        </p>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {["Fecha", "Peso", "Cintura", "Cadera", "Pecho", "Brazo", "Muslo"].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-zinc-600 font-normal whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measurements.map((m) => (
                  <tr key={m.id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">{formatDate(m.date)}</td>
                    <td className="py-3 px-4 text-zinc-300">{m.weight !== null ? `${m.weight} kg` : "—"}</td>
                    <td className="py-3 px-4 text-zinc-300">{m.waistCm !== null ? `${m.waistCm}` : "—"}</td>
                    <td className="py-3 px-4 text-zinc-300">{m.hipCm !== null ? `${m.hipCm}` : "—"}</td>
                    <td className="py-3 px-4 text-zinc-300">{m.chestCm !== null ? `${m.chestCm}` : "—"}</td>
                    <td className="py-3 px-4 text-zinc-300">{m.armCm !== null ? `${m.armCm}` : "—"}</td>
                    <td className="py-3 px-4 text-zinc-300">{m.thighCm !== null ? `${m.thighCm}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label className="text-xs text-zinc-500 mb-1 block">{label}</Label>
      <Input
        type="number"
        step="0.1"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="h-9 text-sm bg-zinc-800 border-zinc-700"
      />
    </div>
  )
}
