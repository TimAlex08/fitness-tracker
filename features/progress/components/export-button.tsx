"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ExportButton() {
  return (
    <a href="/api/export" download>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 h-9 text-xs border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
      >
        <Download className="h-3.5 w-3.5" />
        Exportar CSV
      </Button>
    </a>
  )
}
