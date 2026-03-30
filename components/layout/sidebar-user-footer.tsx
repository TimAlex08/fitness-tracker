"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"

type User = { name: string; email: string; role: string }

export function SidebarUserFooter({ user }: { user: User }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 shrink-0">
        <User className="h-3.5 w-3.5 text-zinc-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-300 truncate">{user.name}</p>
        <p className="text-xs text-zinc-600 truncate">{user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        disabled={loading}
        className="h-7 w-7 shrink-0 text-zinc-500 hover:text-white hover:bg-zinc-700"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  )
}
