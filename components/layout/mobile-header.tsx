"use client"

/**
 * MobileHeader — SRP aplicado:
 * Responsabilidad única: header visible solo en mobile con
 * botón hamburguesa que abre un Sheet con el contenido del sidebar.
 * Es client component porque maneja el estado open/close del Sheet.
 */

import { Menu, Dumbbell } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { SidebarNavLinks } from "./sidebar-nav-links"

export function MobileHeader() {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 lg:hidden"
      aria-label="Cabecera móvil"
    >
      {/* Logo compacto */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500">
          <Dumbbell className="h-3.5 w-3.5 text-white" aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold text-white">Workout</span>
      </div>

      {/* Botón para abrir menú lateral */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white hover:bg-zinc-700"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-64 bg-zinc-900 border-zinc-800 p-0"
        >
          {/* Título accesible requerido por SheetContent */}
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>

          {/* Marca dentro del drawer */}
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
          <div className="px-3 py-4">
            <SidebarNavLinks />
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-600">
              Semana 1 · Integridad Estructural
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
