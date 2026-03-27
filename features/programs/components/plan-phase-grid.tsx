"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { DayDrawer, type RoutineOption, type PhaseDay } from "./day-drawer"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
type DayOfWeek = typeof DAYS[number]

const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "LUN",
  tuesday: "MAR",
  wednesday: "MIÉ",
  thursday: "JUE",
  friday: "VIE",
  saturday: "SÁB",
  sunday: "DOM",
}

const SESSION_TYPE_COLOR: Record<string, string> = {
  TRAINING: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
  MOBILITY: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  REST: "bg-zinc-800 text-zinc-500 border-zinc-700",
  DELOAD: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
}

interface ProgramDayInfo {
  id: string
  routineId: string
  dayOfWeek: string
  routine: {
    id: string
    name: string
    sessionType: string
    durationMin: number | null
  }
}

type Props = {
  programId: string
  phase: {
    id: string
    name: string
    weekStart: number
    weekEnd: number
  }
  programDays: ProgramDayInfo[]
  routines: RoutineOption[]
}

export function PlanPhaseGrid({ programId, phase, programDays, routines }: Props) {
  const [drawerDay, setDrawerDay] = useState<DayOfWeek | null>(null)

  const allPhaseDays: PhaseDay[] = programDays.map((d) => ({
    routineId: d.routineId,
    dayOfWeek: d.dayOfWeek,
  }))

  function getDayRoutines(day: DayOfWeek) {
    return programDays.filter((d) => d.dayOfWeek === day)
  }

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Phase header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{phase.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Semanas {phase.weekStart}–{phase.weekEnd}
            </p>
          </div>
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 divide-x divide-zinc-800">
          {DAYS.map((day) => {
            const dayRoutines = getDayRoutines(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => setDrawerDay(day)}
                className="flex flex-col items-center gap-1.5 p-2 min-h-[80px] hover:bg-zinc-800/50 transition-colors group"
              >
                <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  {DAY_SHORT[day]}
                </span>

                {dayRoutines.length > 0 ? (
                  <div className="flex flex-col gap-1 w-full">
                    {dayRoutines.map((d) => (
                      <span
                        key={d.id}
                        className={`text-[9px] leading-tight px-1 py-0.5 rounded border text-center truncate w-full ${
                          SESSION_TYPE_COLOR[d.routine.sessionType] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {d.routine.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-zinc-700 group-hover:text-zinc-600 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Drawer */}
      <Sheet open={drawerDay !== null} onOpenChange={(open) => { if (!open) setDrawerDay(null) }}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-zinc-950 border-zinc-800 p-0 flex flex-col">
          {drawerDay && (
            <DayDrawer
              programId={programId}
              phaseId={phase.id}
              dayOfWeek={drawerDay}
              allPhaseDays={allPhaseDays}
              routines={routines}
              onClose={() => setDrawerDay(null)}
              onSaved={() => setDrawerDay(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
