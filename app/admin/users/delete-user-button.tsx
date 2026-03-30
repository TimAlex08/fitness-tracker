"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`¿Eliminar a "${userName}"? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}
      aria-label={`Eliminar usuario ${userName}`}
      className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-400/10">
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
    </Button>
  )
}
