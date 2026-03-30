"use client"

import * as React from "react"

interface MetricsPairProps {
  streak: number
  sessionsThisMonth: number
  targetSessions?: number
}

export function MetricsPair({
  streak,
  sessionsThisMonth,
  targetSessions = 10,
}: MetricsPairProps) {
  const progressPercent = Math.min((sessionsThisMonth / targetSessions) * 100, 100)
  const remaining = targetSessions - sessionsThisMonth

  return (
    <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3 lg:gap-4 h-full">
      {/* Racha */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 lg:p-5 space-y-2 flex flex-col justify-between">
        <div className="text-xl lg:text-2xl">🔥</div>
        <div>
          <div className="text-[22px] lg:text-[34px] font-bold text-white leading-tight">
            {streak} {streak === 1 ? "día" : "días"}
          </div>
          <div className="text-xs text-zinc-500 font-medium">Racha actual</div>
          <div className="hidden lg:block text-[11px] text-zinc-500 mt-1">
            {streak === 0 ? "Empieza hoy" : "Sigue así, vas muy bien 💪"}
          </div>
        </div>
      </div>

      {/* Meta mensual */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 lg:p-5 space-y-2 flex flex-col justify-between">
        <div className="text-xl lg:text-2xl">🎯</div>
        <div>
          <div className="text-[22px] lg:text-[34px] font-bold text-white leading-tight">
            {sessionsThisMonth} / {targetSessions}
          </div>
          <div className="text-xs text-zinc-500 font-medium">Sesiones del mes</div>
          
          <div className="mt-2.5 space-y-1.5">
            <div className="h-[3px] lg:h-[4px] bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 shadow-[0_0_8px_0] shadow-emerald-500/50 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="hidden lg:block text-[11px] text-zinc-500">
              {remaining > 0 
                ? `${remaining} ${remaining === 1 ? "sesión" : "sesiones"} para la meta mensual`
                : "¡Meta del mes completada! 🎯"
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
