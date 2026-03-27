"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Dumbbell, Clock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RoutineForm } from "@/features/routines/components/routine-form"
import type { RoutineListItem } from "@/features/routines/api/prisma-routine-repository"

const SESSION_TYPE_LABEL: Record<string, string> = {
  TRAINING: "Entrenamiento",
  MOBILITY: "Movilidad",
  REST: "Descanso",
  DELOAD: "Deload",
}

const SESSION_TYPE_COLOR: Record<string, string> = {
  TRAINING: "text-emerald-400",
  MOBILITY: "text-teal-400",
  REST: "text-zinc-400",
  DELOAD: "text-yellow-400",
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<RoutineListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    fetch("/api/routines")
      .then((r) => r.json())
      .then((data) => setRoutines(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [createOpen]) // refetch cuando se cierra el formulario

  return (
    <div className="px-6 pb-8">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-zinc-400">
          {loading ? "Cargando..." : `${routines.length} rutina${routines.length !== 1 ? "s" : ""}`}
        </p>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Nueva rutina
        </Button>
      </div>

      {/* Lista */}
      {!loading && routines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-zinc-800 p-4 mb-4">
            <Dumbbell className="h-6 w-6 text-zinc-500" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Sin rutinas</h2>
          <p className="text-sm text-zinc-500 max-w-xs mb-6">
            Crea tu primera rutina para empezar a estructurar tus entrenamientos.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nueva rutina
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <Link
              key={routine.id}
              href={`/training/routines/${routine.id}`}
              className="flex items-center justify-between px-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${SESSION_TYPE_COLOR[routine.sessionType] ?? "text-zinc-400"}`}>
                    {SESSION_TYPE_LABEL[routine.sessionType] ?? routine.sessionType}
                  </span>
                  {routine.durationMin && (
                    <>
                      <span className="text-zinc-700">·</span>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {routine.durationMin} min
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                  {routine.name}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {routine.exerciseCount} ejercicio{routine.exerciseCount !== 1 ? "s" : ""}
                  {routine.lastUsed && (
                    <> · última vez {new Date(routine.lastUsed).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</>
                  )}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      )}

      <RoutineForm open={createOpen} onOpenChange={setCreateOpen} routine={null} />
    </div>
  )
}
