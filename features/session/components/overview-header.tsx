"use client"

import * as React from "react"

interface OverviewHeaderProps {
  date: string // ISO date string
  isToday: boolean
}

export function OverviewHeader({ date, isToday }: OverviewHeaderProps) {
  const dateObj = new Date(date + "T00:00:00")
  const formattedDate = dateObj.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  // Saludos dinámicos
  const getGreeting = () => {
    if (!isToday) return "Vista de ese día"
    
    const hour = new Date().getHours()
    if (hour < 12) return "Buenos días 👋"
    if (hour < 20) return "Buenas tardes 👋"
    return "Buenas noches 👋"
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-zinc-500 capitalize">
        {formattedDate.replace(/^\w/, (c) => c.toUpperCase())}
      </p>
      <h1 className="text-[26px] lg:text-[30px] font-bold text-white tracking-tight">
        {getGreeting()}
      </h1>
    </div>
  )
}
