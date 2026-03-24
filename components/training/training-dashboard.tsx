"use client"

/**
 * TrainingDashboard — orquestador de vistas del dashboard de entrenamiento.
 * Maneja el selector Semana / Mes / Año y hace lazy fetch de los datos
 * de mes y año al cambiar de vista por primera vez.
 */

import { useState } from "react"
import { cn } from "@/lib/utils"
import { WeekView } from "./week-view"
import { MonthView } from "./month-view"
import { YearView } from "./year-view"
import type { WeekData, MonthData, YearData } from "@/types/training"

type View = "week" | "month" | "year"

const VIEW_LABELS: { id: View; label: string }[] = [
  { id: "week", label: "Semana" },
  { id: "month", label: "Mes" },
  { id: "year", label: "Año" },
]

interface TrainingDashboardProps {
  weekData: WeekData
}

export function TrainingDashboard({ weekData }: TrainingDashboardProps) {
  const [view, setView] = useState<View>("week")
  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [yearData, setYearData] = useState<YearData | null>(null)
  const [loading, setLoading] = useState(false)

  const now = new Date()

  async function switchView(next: View) {
    setView(next)

    if (next === "month" && !monthData) {
      setLoading(true)
      const res = await fetch(
        `/api/training/month?year=${now.getFullYear()}&month=${now.getMonth() + 1}`
      )
      const data: MonthData = await res.json()
      setMonthData(data)
      setLoading(false)
    }

    if (next === "year" && !yearData) {
      setLoading(true)
      const res = await fetch(`/api/training/year?year=${now.getFullYear()}`)
      const data: YearData = await res.json()
      setYearData(data)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de vista */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Entrenamiento</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Semana {weekData.weekNumber} · {capitalize(weekData.month)} {weekData.year}
          </p>
        </div>

        <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
          {VIEW_LABELS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => switchView(id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                view === id
                  ? "bg-zinc-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la vista activa */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">
          Cargando...
        </div>
      ) : (
        <>
          {view === "week" && <WeekView data={weekData} />}
          {view === "month" && monthData && (
            <MonthView
              data={monthData}
              year={now.getFullYear()}
              month={now.getMonth() + 1}
              onMonthChange={async (y, m) => {
                setLoading(true)
                const res = await fetch(`/api/training/month?year=${y}&month=${m}`)
                const data: MonthData = await res.json()
                setMonthData(data)
                setLoading(false)
              }}
            />
          )}
          {view === "year" && yearData && (
            <YearView data={yearData} year={now.getFullYear()} />
          )}
        </>
      )}
    </div>
  )
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
