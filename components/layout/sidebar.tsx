/**
 * Sidebar — SRP aplicado:
 * Responsabilidad única: estructura visual del panel lateral.
 * Es Server Component — no maneja interacciones ni estado.
 * Delega la lógica de enlaces activos a SidebarNavLinks.
 */

import { Dumbbell } from "lucide-react"
import { SidebarNavLinks } from "./sidebar-nav-links"

export function Sidebar() {
  return (
    <aside
      className="flex h-full w-64 flex-col bg-zinc-900 border-r border-zinc-800"
      aria-label="Panel de navegación"
    >
      {/* Marca / Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          <Dumbbell className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">
            Workout
          </p>
          <p className="text-xs text-zinc-500 leading-tight">Fase Cero</p>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNavLinks />
      </div>

      {/* Footer del sidebar */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">
          Semana 1 · Integridad Estructural
        </p>
      </div>
    </aside>
  )
}
