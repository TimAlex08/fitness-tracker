"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { label: "Ejercicios", href: "/training/exercises" },
  { label: "Rutinas",    href: "/training/routines"  },
  { label: "Plan",       href: "/training/plan"      },
  { label: "Historial",  href: "/training/history"   },
] as const

export function TrainingTabs() {
  const pathname = usePathname()

  return (
    <div className="border-b border-zinc-800 mb-6">
      <nav className="flex gap-1 px-6 -mb-px" aria-label="Secciones de entrenamiento">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                isActive
                  ? "border-emerald-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
