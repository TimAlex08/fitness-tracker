/**
 * Dashboard — pantalla de bienvenida.
 * Server Component: obtiene métricas reales de la base de datos.
 */

import Link from "next/link"
import { Dumbbell, Flame, CalendarDays, ArrowRight } from "lucide-react"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { PrismaProgressRepository } from "@/features/progress/api/prisma-progress-repository"
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"
import { getRequiredSession } from "@/lib/get-session"

const exerciseRepo = new PrismaExerciseRepository()
const progressRepo = new PrismaProgressRepository()
const sessionRepo = new PrismaSessionRepository()

// ─── Componente de tarjeta de métrica ────────────────────────────────────────

type StatCardProps = {
  label: string
  value: string | number
  description: string
  icon: React.ReactNode
  accent?: string
  href?: string
}

function StatCard({ label, value, description, icon, accent = "text-zinc-400", href }: StatCardProps) {
  const content = (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 flex gap-4 items-start hover:border-zinc-700 transition-colors">
      <div className={`mt-0.5 shrink-0 ${accent}`} aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-zinc-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
        <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      </div>
      {href && <ArrowRight className="h-4 w-4 text-zinc-700 mt-1 shrink-0" />}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  return content
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getRequiredSession()

  const [exerciseCount, stats, todayData] = await Promise.all([
    exerciseRepo.count(),
    progressRepo.getProgressData(user.id).then((d) => d.stats),
    sessionRepo.getTodayData(user.id),
  ])

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const todayStatus = todayData.dailyLog
    ? todayData.dailyLog.status === "COMPLETED"
      ? "Completada"
      : todayData.dailyLog.status === "PARTIAL"
        ? "En progreso"
        : "Pendiente"
    : todayData.routine
      ? "Sin iniciar"
      : "Día de descanso"

  const todayDesc = todayData.routine
    ? `${todayData.routine.name} · ${todayData.routine.exercises.length} ejercicios`
    : "No hay rutina programada para hoy."

  return (
    <div className="px-6 py-8 max-w-2xl">
      {/* Saludo */}
      <div className="mb-8">
        <p className="text-sm text-zinc-500 capitalize mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-white">
          Bienvenido de vuelta
        </h1>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <StatCard
          label="Sesión de hoy"
          value={todayStatus}
          description={todayDesc}
          icon={<CalendarDays className="h-5 w-5" />}
          accent="text-sky-400"
          href="/today"
        />
        <StatCard
          label="Racha actual"
          value={`${stats.streak} días`}
          description={
            stats.streak > 0
              ? `${stats.sessionsThisMonth} sesiones este mes · ${stats.adherencePercent}% adherencia`
              : "Completa tu primera sesión para iniciar la racha."
          }
          icon={<Flame className="h-5 w-5" />}
          accent="text-orange-400"
          href="/progress"
        />
        <StatCard
          label="Ejercicios en catálogo"
          value={exerciseCount}
          description="Ejercicios disponibles para registrar en tus sesiones."
          icon={<Dumbbell className="h-5 w-5" />}
          accent="text-emerald-400"
          href="/training/exercises"
        />
      </div>

      {/* CTA rápido */}
      <div className="mt-8">
        <Link
          href="/today"
          className="flex items-center justify-between px-5 py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors group"
        >
          <div>
            <p className="text-sm font-medium text-emerald-400 mb-0.5">
              Ir a la sesión de hoy
            </p>
            <p className="text-xs text-zinc-500">
              {todayData.routine
                ? `Tienes ${todayData.routine.exercises.length} ejercicios programados`
                : "Día de descanso o movilidad"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
