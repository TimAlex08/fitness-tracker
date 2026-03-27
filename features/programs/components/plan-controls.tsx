"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Plus, Check } from "lucide-react"
import { ProgramForm } from "./program-form"

interface ProgramOption {
  id: string
  name: string
  isActive: boolean
}

type Props = {
  programs: ProgramOption[]
  activeId: string
}

export function PlanControls({ programs, activeId }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  async function handleSwitch(id: string) {
    if (id === activeId) { setMenuOpen(false); return }
    setSwitching(id)
    setMenuOpen(false)
    try {
      await fetch(`/api/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      })
      router.refresh()
    } finally {
      setSwitching(null)
    }
  }

  return (
    <>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={!!switching}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-50"
        >
          {switching ? "Cambiando..." : "Programas"}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="py-1">
              {programs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSwitch(p.id)}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center justify-between gap-2 transition-colors"
                >
                  <span className="truncate">{p.name}</span>
                  {p.id === activeId && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-800 py-1">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setFormOpen(true) }}
                className="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo programa
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click-outside overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <ProgramForm open={formOpen} onOpenChange={setFormOpen} />
    </>
  )
}
