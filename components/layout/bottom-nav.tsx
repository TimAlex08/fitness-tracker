"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Dumbbell, BarChart2, BookOpen } from "lucide-react"

const NAV_ITEMS = [
  { href: "/today", label: "Hoy", icon: CalendarDays },
  { href: "/training", label: "Entreno", icon: Dumbbell },
  { href: "/progress", label: "Progreso", icon: BarChart2 },
  { href: "/exercises", label: "Ejercicios", icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-zinc-900 border-t border-zinc-800"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-label="Navegación principal"
    >
      <ul className="flex items-center justify-around px-2 pt-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-1 rounded-lg transition-colors min-h-[48px] justify-center ${
                  active
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-2"}`}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
