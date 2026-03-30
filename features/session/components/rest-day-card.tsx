"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface RestDayCardProps {
  isToday: boolean
  selectedDate: string
}

const REST_MESSAGES = [
  "Tu cuerpo se recupera",        // Dom
  "Hoy recargas energía",         // Lun
  "El descanso es entrenamiento", // Mar
  "Recuperación activa",          // Mié
  "Tu músculo crece en el reposo",// Jue
  "Descansa hoy, rinde mañana",   // Vie
  "Semana completada 🎯",         // Sáb
]

export function RestDayCard({ isToday, selectedDate }: RestDayCardProps) {
  const dateObj = new Date(selectedDate + "T00:00:00")
  const dayIndex = dateObj.getDay()
  const message = REST_MESSAGES[dayIndex]

  return (
    <div className={cn(
      "rounded-2xl bg-zinc-900 border border-blue-500/20 p-6 lg:p-10",
      "shadow-[0_8px_40px_0] shadow-blue-500/7 flex flex-col justify-between h-full min-h-[300px] relative overflow-hidden"
    )}>
      {/* Glow gradient wash */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

      <div className="relative space-y-4 lg:space-y-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[2px] text-zinc-500 font-bold">Descanso Activo</span>
          <div className="text-[32px] lg:text-[44px]">🌙</div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl lg:text-[28px] font-bold text-white">
            {message}
          </h2>
          <p className="text-sm lg:text-base text-zinc-500 max-w-[280px]">
            La recuperación es tan importante como el esfuerzo. Aprovecha para estirar o caminar.
          </p>
        </div>
      </div>

      {isToday && (
        <Link
          href="/today?free=true"
          className={cn(
            "mt-8 w-full h-[54px] lg:h-[56px] flex items-center justify-center rounded-xl",
            "bg-blue-500/10 border border-blue-500/25 text-sky-400 font-bold text-base transition-all",
            "hover:bg-blue-500/20 active:scale-[0.98]"
          )}
        >
          + Registrar sesión libre
        </Link>
      )}
    </div>
  )
}
