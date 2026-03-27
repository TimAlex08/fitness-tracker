"use client"

/**
 * SidebarNavLinks — SRP aplicado:
 * Responsabilidad única: renderizar los enlaces de navegación
 * con estado activo. Es client component porque necesita usePathname.
 * No sabe nada de la estructura del sidebar ni del layout.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/navigation"

export function SidebarNavLinks() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegación principal">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <li key={item.href}>
              {item.comingSoon ? (
                /* Enlace deshabilitado: visible pero no interactivo */
                <span
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed select-none"
                  title="Próximamente"
                  aria-disabled="true"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
                    Pronto
                  </span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-zinc-700 text-white font-medium"
                      : "text-zinc-400 hover:bg-zinc-700/50 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
