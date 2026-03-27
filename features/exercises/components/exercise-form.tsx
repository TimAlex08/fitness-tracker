"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Exercise } from "@/types"

// ─── Opciones de select ───────────────────────────────────────────────────────

const MUSCLE_GROUPS = [
  { value: "CHEST", label: "Pecho" },
  { value: "BACK", label: "Espalda" },
  { value: "LEGS", label: "Piernas" },
  { value: "SHOULDERS", label: "Hombros" },
  { value: "CORE", label: "Core" },
  { value: "MOBILITY", label: "Movilidad" },
  { value: "FULL_BODY", label: "Cuerpo completo" },
]

const MOVEMENT_TYPES = [
  { value: "PUSH", label: "Empuje" },
  { value: "PULL", label: "Jalón" },
  { value: "SQUAT", label: "Sentadilla" },
  { value: "HINGE", label: "Bisagra" },
  { value: "CARRY", label: "Cargada" },
  { value: "ISOMETRIC", label: "Isométrico" },
  { value: "MOBILITY", label: "Movilidad" },
  { value: "ACTIVATION", label: "Activación" },
]

const CATEGORIES = [
  { value: "STANDARD", label: "Estándar" },
  { value: "REGRESSION", label: "Regresión" },
  { value: "PROGRESSION", label: "Progresión" },
  { value: "PREHAB", label: "Prehab" },
  { value: "WARMUP", label: "Calentamiento" },
  { value: "COOLDOWN", label: "Vuelta a la calma" },
]

const JOINT_STRESS_OPTIONS = [
  { value: "NONE", label: "Sin estrés articular" },
  { value: "LOW", label: "Bajo" },
  { value: "MODERATE", label: "Moderado" },
  { value: "HIGH", label: "Alto" },
]

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FormData = {
  name: string
  slug: string
  description: string
  muscleGroup: string
  movementType: string
  category: string
  difficulty: number
  parentId: string
  defaultSets: string
  defaultReps: string
  defaultDurationSec: string
  defaultRestSec: string
  defaultTempo: string
  defaultRpe: string
  jointStress: string
  targetJoints: string
  contraindications: string
  safetyNotes: string
  bodyweightPercent: string
}

type ExerciseFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise?: Exercise | null
  allExercises: Exercise[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function exerciseToForm(exercise: Exercise): FormData {
  return {
    name: exercise.name,
    slug: exercise.slug,
    description: exercise.description ?? "",
    muscleGroup: exercise.muscleGroup,
    movementType: exercise.movementType,
    category: exercise.category,
    difficulty: exercise.difficulty,
    parentId: exercise.parentId ?? "",
    defaultSets: exercise.defaultSets?.toString() ?? "",
    defaultReps: exercise.defaultReps?.toString() ?? "",
    defaultDurationSec: exercise.defaultDurationSec?.toString() ?? "",
    defaultRestSec: exercise.defaultRestSec?.toString() ?? "60",
    defaultTempo: exercise.defaultTempo ?? "",
    defaultRpe: exercise.defaultRpe?.toString() ?? "",
    jointStress: exercise.jointStress,
    targetJoints: exercise.targetJoints ?? "",
    contraindications: exercise.contraindications ?? "",
    safetyNotes: exercise.safetyNotes ?? "",
    bodyweightPercent: exercise.bodyweightPercent?.toString() ?? "",
  }
}

const EMPTY_FORM: FormData = {
  name: "",
  slug: "",
  description: "",
  muscleGroup: "",
  movementType: "",
  category: "STANDARD",
  difficulty: 1,
  parentId: "",
  defaultSets: "3",
  defaultReps: "",
  defaultDurationSec: "",
  defaultRestSec: "60",
  defaultTempo: "",
  defaultRpe: "",
  jointStress: "LOW",
  targetJoints: "",
  contraindications: "",
  safetyNotes: "",
  bodyweightPercent: "",
}

// ─── Sub-componentes de campo ─────────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <Label className="text-xs text-zinc-400 mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="text-xs text-zinc-600 mt-1">{hint}</p>}
    </div>
  )
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "—"}
        className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600"
      />
    </Field>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ExerciseForm({
  open,
  onOpenChange,
  exercise,
  allExercises,
}: ExerciseFormProps) {
  const router = useRouter()
  const isEditing = !!exercise
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Sync form when exercise prop changes
  useEffect(() => {
    setForm(exercise ? exerciseToForm(exercise) : EMPTY_FORM)
    setError(null)
  }, [exercise, open])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Auto-generate slug from name when creating
      if (key === "name" && !isEditing) {
        next.slug = generateSlug(value as string)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.muscleGroup || !form.movementType) {
      setError("Nombre, grupo muscular y tipo de movimiento son obligatorios.")
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || generateSlug(form.name),
      description: form.description.trim() || null,
      muscleGroup: form.muscleGroup,
      movementType: form.movementType,
      category: form.category,
      difficulty: form.difficulty,
      parentId: form.parentId || null,
      defaultSets: form.defaultSets ? parseInt(form.defaultSets) : null,
      defaultReps: form.defaultReps ? parseInt(form.defaultReps) : null,
      defaultDurationSec: form.defaultDurationSec
        ? parseInt(form.defaultDurationSec)
        : null,
      defaultRestSec: form.defaultRestSec ? parseInt(form.defaultRestSec) : 60,
      defaultTempo: form.defaultTempo.trim() || null,
      defaultRpe: form.defaultRpe ? parseInt(form.defaultRpe) : null,
      jointStress: form.jointStress,
      targetJoints: form.targetJoints.trim() || null,
      contraindications: form.contraindications.trim() || null,
      safetyNotes: form.safetyNotes.trim() || null,
      bodyweightPercent: form.bodyweightPercent
        ? parseFloat(form.bodyweightPercent)
        : null,
    }

    try {
      const url = isEditing
        ? `/api/exercises/${exercise!.id}`
        : "/api/exercises"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error guardando ejercicio.")
        return
      }

      onOpenChange(false)
      router.refresh()

      if (!isEditing) {
        router.push(`/training/exercises/${data.id}`)
      }
    } catch {
      setError("Error de red. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  // Exercises available as parent (exclude itself and its descendants)
  const parentOptions = allExercises.filter((ex) => ex.id !== exercise?.id)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-zinc-950 border-zinc-800 overflow-y-auto"
      >
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-white">
            {isEditing ? "Editar ejercicio" : "Nuevo ejercicio"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
          {/* Nombre + Slug */}
          <Field label="Nombre *">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej: Flexiones en pared"
              className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600"
            />
          </Field>

          <Field label="Slug" hint="Identificador único en URL. Se genera automáticamente.">
            <Input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="flexiones-en-pared"
              className="bg-zinc-800 border-zinc-700 text-zinc-400 placeholder-zinc-600 font-mono text-sm"
            />
          </Field>

          <Field label="Descripción">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Instrucciones técnicas, cues de forma..."
              className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600 resize-none min-h-[80px]"
            />
          </Field>

          {/* Clasificación */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Grupo muscular *">
              <Select
                value={form.muscleGroup}
                onValueChange={(v) => set("muscleGroup", v)}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {MUSCLE_GROUPS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-zinc-300">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tipo de movimiento *">
              <Select
                value={form.movementType}
                onValueChange={(v) => set("movementType", v)}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {MOVEMENT_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-zinc-300">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Categoría">
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v)}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {CATEGORIES.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-zinc-300">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Estrés articular">
              <Select
                value={form.jointStress}
                onValueChange={(v) => set("jointStress", v)}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {JOINT_STRESS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-zinc-300">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Dificultad */}
          <Field label={`Dificultad: ${form.difficulty}/10`}>
            <input
              type="range"
              min={1}
              max={10}
              value={form.difficulty}
              onChange={(e) => set("difficulty", parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-0.5">
              <span>Fácil</span>
              <span>Difícil</span>
            </div>
          </Field>

          {/* Parámetros por defecto */}
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">
              Parámetros por defecto
            </p>
            <div className="grid grid-cols-2 gap-4">
              <NumField label="Series" value={form.defaultSets} onChange={(v) => set("defaultSets", v)} placeholder="3" />
              <NumField label="Reps" value={form.defaultReps} onChange={(v) => set("defaultReps", v)} placeholder="12" />
              <NumField label="Duración (s)" value={form.defaultDurationSec} onChange={(v) => set("defaultDurationSec", v)} placeholder="30" hint="Para isométricos" />
              <NumField label="Descanso (s)" value={form.defaultRestSec} onChange={(v) => set("defaultRestSec", v)} placeholder="60" />
              <Field label="Tempo">
                <Input
                  value={form.defaultTempo}
                  onChange={(e) => set("defaultTempo", e.target.value)}
                  placeholder="2-1-2-0"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600 font-mono"
                />
              </Field>
              <NumField label="RPE objetivo" value={form.defaultRpe} onChange={(v) => set("defaultRpe", v)} placeholder="6" />
            </div>
          </div>

          {/* Jerarquía */}
          <Field label="Ejercicio padre" hint="Para regressions/progressions. Indica el ejercicio estándar del que deriva.">
            <Select
              value={form.parentId || "none"}
              onValueChange={(v) => set("parentId", v === "none" ? "" : v)}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Ninguno" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 max-h-48">
                <SelectItem value="none" className="text-zinc-400">
                  Ninguno
                </SelectItem>
                {parentOptions.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id} className="text-zinc-300">
                    {ex.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Seguridad */}
          <Field label="Articulaciones comprometidas" hint="Ej: rodillas, hombro anterior">
            <Input
              value={form.targetJoints}
              onChange={(e) => set("targetJoints", e.target.value)}
              placeholder="rodillas, lumbares..."
              className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600"
            />
          </Field>

          <Field label="Notas de seguridad">
            <Textarea
              value={form.safetyNotes}
              onChange={(e) => set("safetyNotes", e.target.value)}
              placeholder="Puntos críticos de técnica y advertencias..."
              className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600 resize-none min-h-[60px]"
            />
          </Field>

          <Field label="Contraindicaciones">
            <Textarea
              value={form.contraindications}
              onChange={(e) => set("contraindications", e.target.value)}
              placeholder="Evitar si..."
              className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600 resize-none min-h-[60px]"
            />
          </Field>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Acciones */}
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
              {saving
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear ejercicio"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
