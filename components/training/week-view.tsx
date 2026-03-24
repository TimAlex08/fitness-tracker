"use client"

/**
 * WeekView — vista semanal del dashboard de entrenamiento.
 * Muestra 7 tarjetas con estado de cada día.
 * El día de hoy tiene una tarjeta grande con botón de inicio de sesión.
 */

import Link from "next/link"
import { cn } from "@/lib/utils"
import { DayCell } from "./day-cell"
import type { WeekData, WeekDay } from "@/types/training"
import type { CompletionStatus } from "@prisma/client"

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const STATUS_LABEL: Record<CompletionStatus | "REST", string> = {
  COMPLETED: "Completado",
  PARTIAL: "Parcial",
  SKIPPED: "Faltado",
  PENDING: "Pendiente",
  REST: "Descanso",
}

interface WeekViewProps {
  data: WeekData
}

export function WeekView({ data }: WeekViewProps) {
  const today = data.days.find((d) => d.isToday)
  const otherDays = data.days.filter((d) => !d.isToday)

  return (
    <div className="space-y-4">
      {/* Tira de estado rápido */}
      <div className="flex items-center justify-between px-1">
        {data.days.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-xs text-zinc-500">{DAY_LABELS[day.dayOfWeek]}</span>
            <DayCell
              status={day.isRest ? "REST" : day.dailyLog?.status ?? "PENDING"}
              isToday={day.isToday}
            />
          </div>
        ))}
      </div>

      {/* Card grande — hoy */}
      {today && <TodayCard day={today} />}

      {/* Cards compactos — resto de la semana */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {otherDays.map((day) => (
          <CompactDayCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  )
}

// ─── Card de hoy ──────────────────────────────────────────────────────────────

function TodayCard({ day }: { day: WeekDay }) {
  const log = day.dailyLog
  const routine = day.routine
  const isCompleted = log?.status === "COMPLETED"
  const isInProgress = log && log.status === "PENDING"

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-1">
            Hoy
          </p>
          <h2 className="text-xl font-bold text-white">
            {day.isRest ? "Día de descanso" : (routine?.name ?? "Sin rutina")}
          </h2>
          {routine && (
            <p className="text-sm text-zinc-400 mt-1">
              {routine.exerciseCount} ejercicios
              {routine.estimatedDuration && ` · ~${routine.estimatedDuration} min`}
              {routine.rpeTarget && ` · RPE ${routine.rpeTarget}`}
            </p>
          )}
        </div>
        <DayCell
          status={day.isRest ? "REST" : (log?.status ?? "PENDING")}
          isToday
          size="md"
        />
      </div>

      {/* Estado si ya hay log */}
      {log && !day.isRest && (
        <div className="flex items-center gap-4 text-sm text-zinc-400 border-t border-zinc-800 pt-3">
          {log.exercisesCompleted > 0 && (
            <span>{log.exercisesCompleted}/{routine?.exerciseCount ?? "?"} ejercicios</span>
          )}
          {log.rpeActual && <span>RPE {log.rpeActual}</span>}
          {log.durationMin && <span>{log.durationMin} min</span>}
          <span className="ml-auto font-medium text-white">
            {STATUS_LABEL[log.status]}
          </span>
        </div>
      )}

      {/* Botón de acción */}
      {!day.isRest && (
        <Link
          href="/training/session"
          className={cn(
            "flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
            isCompleted
              ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              : "bg-emerald-600 text-white hover:bg-emerald-500"
          )}
        >
          {isCompleted
            ? "Ver sesión"
            : isInProgress
            ? "Continuar sesión →"
            : "Iniciar sesión →"}
        </Link>
      )}
    </div>
  )
}

// ─── Card compacto ────────────────────────────────────────────────────────────

function CompactDayCard({ day }: { day: WeekDay }) {
  const log = day.dailyLog
  const status = day.isRest ? "REST" : (log?.status ?? "PENDING")

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {DAY_LABELS[day.dayOfWeek]}{" "}
          {new Date(day.date + "T00:00:00").getDate()}
        </span>
        <DayCell status={status} size="md" />
      </div>
      <p className="text-sm font-medium text-zinc-300 truncate">
        {day.isRest ? "Descanso" : (day.routine?.name ?? "Sin rutina")}
      </p>
      {log && !day.isRest && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-zinc-500">
          {log.rpeActual && <span>RPE {log.rpeActual}</span>}
          {log.durationMin && <span>{log.durationMin} min</span>}
        </div>
      )}
      {!log && !day.isRest && (
        <p className="text-xs text-zinc-600">{STATUS_LABEL[status as CompletionStatus]}</p>
      )}
    </div>
  )
}
