/**
 * Dashboard — pantalla de bienvenida.
 * Server Component: obtiene métricas reales de la base de datos.
 * Responsabilidad: orquestar datos y presentar el resumen del estado actual.
 */

import { Dumbbell, Flame, CalendarDays } from "lucide-react"
import { getExerciseCount } from "@/lib/exercises"

// ─── Componente de tarjeta de métrica ────────────────────────────────────────

type StatCardProps = {
  label: string
  value: string | number
  description: string
  icon: React.ReactNode
  accent?: string
}

function StatCard({ label, value, description, icon, accent = "text-zinc-400" }: StatCardProps) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 flex gap-4 items-start">
      <div className={`mt-0.5 shrink-0 ${accent}`} aria-hidden="true">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
        <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const exerciseCount = await getExerciseCount()

  // Fecha formateada en español
  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="px-6 py-8 max-w-2xl">
      {/* Saludo */}
      <div className="mb-8">
        <p className="text-sm text-zinc-500 capitalize mb-1">{today}</p>
        <h1 className="text-2xl font-bold text-white">
          Bienvenido de vuelta 💪
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Estás en la{" "}
          <span className="text-emerald-400 font-medium">
            Fase Cero — Integridad Estructural
          </span>
          . Registra cada sesión para ver tu progreso.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <StatCard
          label="Ejercicios en catálogo"
          value={exerciseCount}
          description="Ejercicios cargados en la Fase Cero, listos para registrar."
          icon={<Dumbbell className="h-5 w-5" />}
          accent="text-emerald-400"
        />
        <StatCard
          label="Racha actual"
          value="0 días"
          description="Completa tu primera sesión para iniciar la racha."
          icon={<Flame className="h-5 w-5" />}
          accent="text-orange-400"
        />
        <StatCard
          label="Sesión de hoy"
          value="Sin registrar"
          description="La página /today estará disponible en el próximo sprint."
          icon={<CalendarDays className="h-5 w-5" />}
          accent="text-sky-400"
        />
      </div>

      {/* Llamado a la acción */}
      <div className="mt-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4">
        <p className="text-sm font-medium text-emerald-400 mb-1">
          ¿Por dónde empezar?
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Explora el catálogo de ejercicios para ver los movimientos de tu
          programa. Cada tarjeta muestra el volumen objetivo, tempo y notas de
          seguridad.
        </p>
      </div>
    </div>
  )
}
