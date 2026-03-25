"use client"

/**
 * TrainingDashboard — orquestador de vistas del dashboard de entrenamiento.
 * Maneja el selector Semana / Mes / Año y hace lazy fetch de los datos
 * de mes y año al cambiar de vista por primera vez.
 */

import { useState } from "react"
import { WeekView } from "./week-view"
import { MonthView } from "./month-view"
import { YearView } from "./year-view"
import { WeeklyStrip } from "./weekly-strip"
import { Plus, LayoutList, Calendar, History } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { WeekData, MonthData, YearData, DayStatus } from "@/features/training/types/training.types"

type View = "week" | "month" | "year"

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
      {/* Weekly Quick Access Strip */}
      <WeeklyStrip 
        daysData={weekData.days.map(d => ({ 
          date: d.date, 
          status: (d.isRest ? "REST" : d.dailyLog?.status ?? "PENDING") as DayStatus 
        }))} 
        className="-mx-4 md:mx-0 md:rounded-2xl"
      />

      {/* Header con selector de vista */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold text-white">Entrenamiento</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Semana {weekData.weekNumber} · {capitalize(weekData.month)} {weekData.year}
          </p>
        </div>

        <Link href="/training/program/new">
          <Button variant="outline" size="sm" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 gap-2 h-9 rounded-xl">
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Nuevo Programa</span>
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 self-center">
          <Button
            variant={view === "week" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => switchView("week")}
            className="h-8 gap-2 rounded-lg text-xs font-medium"
          >
            <LayoutList className="h-3.5 w-3.5" />
            Semana
          </Button>
          <Button
            variant={view === "month" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => switchView("month")}
            className="h-8 gap-2 rounded-lg text-xs font-medium"
          >
            <Calendar className="h-3.5 w-3.5" />
            Mes
          </Button>
          <Button
            variant={view === "year" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => switchView("year")}
            className="h-8 gap-2 rounded-lg text-xs font-medium"
          >
            <History className="h-3.5 w-3.5" />
            Año
          </Button>
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
