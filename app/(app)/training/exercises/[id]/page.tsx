/**
 * ExerciseDetailPage — Server Component.
 * Muestra todos los detalles de un ejercicio: descripción, parámetros,
 * seguridad, jerarquía de variantes e historial de rendimiento.
 */

import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ExerciseDetailActions } from "@/features/exercises/components/exercise-detail-actions"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import type { Exercise } from "@/types"

const exerciseRepo = new PrismaExerciseRepository()

// ─── Mapas de presentación ────────────────────────────────────────────────────

const MUSCLE_LABEL: Record<string, string> = {
  CHEST: "Pecho", BACK: "Espalda", LEGS: "Piernas", SHOULDERS: "Hombros",
  CORE: "Core", MOBILITY: "Movilidad", FULL_BODY: "Cuerpo completo",
}
const MUSCLE_COLOR: Record<string, string> = {
  CHEST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  BACK: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  LEGS: "bg-green-500/15 text-green-400 border-green-500/30",
  SHOULDERS: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  CORE: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  MOBILITY: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  FULL_BODY: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}
const CATEGORY_LABEL: Record<string, string> = {
  STANDARD: "Estándar", REGRESSION: "Regresión", PROGRESSION: "Progresión",
  PREHAB: "Prehab", WARMUP: "Calentamiento", COOLDOWN: "Vuelta a la calma",
}
const CATEGORY_COLOR: Record<string, string> = {
  STANDARD: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  REGRESSION: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  PROGRESSION: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PREHAB: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  WARMUP: "bg-green-500/15 text-green-400 border-green-500/30",
  COOLDOWN: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
}
const MOVEMENT_LABEL: Record<string, string> = {
  PUSH: "Empuje", PULL: "Jalón", SQUAT: "Sentadilla", HINGE: "Bisagra",
  CARRY: "Cargada", ISOMETRIC: "Isométrico", MOBILITY: "Movilidad", ACTIVATION: "Activación",
}
const JOINT_STRESS_COLOR: Record<string, string> = {
  NONE: "bg-emerald-500", LOW: "bg-green-400", MODERATE: "bg-yellow-400", HIGH: "bg-red-400",
}
const JOINT_STRESS_LABEL: Record<string, string> = {
  NONE: "Sin estrés articular", LOW: "Bajo", MODERATE: "Moderado", HIGH: "Alto",
}
const FORM_QUALITY_LABEL: Record<string, string> = {
  PERFECT: "Perfecta", GOOD: "Buena", FAIR: "Regular", POOR: "Pobre",
}

// ─── Sección genérica ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
        {title}
      </h2>
      {children}
    </div>
  )
}

// ─── Fila de dato ─────────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm text-white text-right max-w-[60%]">{value}</span>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { id } = await params
  const exercise = await exerciseRepo.findById(id)

  if (!exercise) notFound()

  // TODO(Plan E): Add ExerciseFamily and logs
  const hasLogs = exercise.exerciseLogs?.length > 0

  return (
    <div className="px-6 pb-8 max-w-3xl mx-auto">
      {/* Navegación */}
      <Link
        href="/training/exercises"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Ejercicios
      </Link>

      {/* Encabezado */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Badge
              variant="outline"
              className={`text-xs border ${MUSCLE_COLOR[exercise.muscleGroup] ?? ""}`}
            >
              {MUSCLE_LABEL[exercise.muscleGroup] ?? exercise.muscleGroup}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs border ${CATEGORY_COLOR[exercise.category] ?? ""}`}
            >
              {CATEGORY_LABEL[exercise.category] ?? exercise.category}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-white">{exercise.name}</h1>
          {exercise.description && (
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed max-w-prose">
              {exercise.description}
            </p>
          )}
        </div>

        <ExerciseDetailActions
          exercise={exercise as Exercise}
        />
      </div>

      <div className="space-y-8">
        {/* Parámetros de trabajo */}
        <Section title="Parámetros de trabajo">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 pb-0">
              <DataRow label="Series" value={exercise.defaultSets} />
              <DataRow label="Reps" value={exercise.defaultReps} />
              <DataRow label="Duración" value={exercise.defaultDurationSec ? `${exercise.defaultDurationSec}s` : null} />
              <DataRow label="Descanso" value={exercise.defaultRestSec ? `${exercise.defaultRestSec}s` : null} />
              <DataRow label="Tempo" value={exercise.defaultTempo} />
              <DataRow label="RPE objetivo" value={exercise.defaultRpe ? `${exercise.defaultRpe}/10` : null} />
              <DataRow label="Tipo de movimiento" value={MOVEMENT_LABEL[exercise.movementType] ?? exercise.movementType} />
              <DataRow label="Dificultad" value={`${exercise.difficulty}/10`} />
              <DataRow label="Peso corporal %" value={exercise.bodyweightPercent ? `${exercise.bodyweightPercent}%` : null} />
            </CardContent>
          </Card>
        </Section>

        {/* Seguridad */}
        <Section title="Seguridad articular">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-4 pb-0">
              <DataRow
                label="Estrés articular"
                value={
                  <span className="flex items-center gap-2 justify-end">
                    <span className={`h-2 w-2 rounded-full ${JOINT_STRESS_COLOR[exercise.jointStress] ?? "bg-zinc-500"}`} />
                    {JOINT_STRESS_LABEL[exercise.jointStress] ?? exercise.jointStress}
                  </span>
                }
              />
              <DataRow label="Articulaciones" value={exercise.targetJoints} />
              {exercise.safetyNotes && (
                <div className="py-3 border-b border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Notas de seguridad</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{exercise.safetyNotes}</p>
                </div>
              )}
              {exercise.contraindications && (
                <div className="py-3">
                  <p className="text-xs text-zinc-500 mb-1">Contraindicaciones</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{exercise.contraindications}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>

        {/* TODO(Plan E): Add ExerciseFamily hierarchy view here */}

        {/* Historial de rendimiento */}
        <Section title="Historial reciente">
          {hasLogs ? (
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">Fecha</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">Series × Reps</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">RPE</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">Forma</th>
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500">Dolor</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.exerciseLogs.map((log) => {
                    const reps = Array.isArray(log.repsPerSet) ? log.repsPerSet as unknown as number[] : []
                    const repsStr = reps.length
                      ? `${reps.length} × [${reps.join(", ")}]`
                      : "—"
                    const date = log.dailyLog?.date
                      ? new Date(log.dailyLog.date).toLocaleDateString("es", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—"

                    return (
                      <tr
                        key={log.id}
                        className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40"
                      >
                        <td className="py-3 px-4 text-zinc-400">{date}</td>
                        <td className="py-3 px-4 font-mono text-zinc-300">{repsStr}</td>
                        <td className="py-3 px-4 text-zinc-300">
                          {log.rpeActual ? `${log.rpeActual}/10` : "—"}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {log.formQuality ? FORM_QUALITY_LABEL[log.formQuality] ?? log.formQuality : "—"}
                        </td>
                        <td className="py-3 px-4">
                          {log.painDuring !== null && log.painDuring !== undefined ? (
                            <span
                              className={
                                log.painDuring === 0
                                  ? "text-emerald-400"
                                  : log.painDuring <= 2
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }
                            >
                              {log.painDuring}/5
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 py-4">
              Aún no hay registros para este ejercicio.
            </p>
          )}
        </Section>
      </div>
    </div>
  )
}