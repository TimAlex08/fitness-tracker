"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CreateAdminForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Error al crear el admin")
      setLoading(false)
      return
    }

    setName(""); setEmail(""); setPassword("")
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4 max-w-md">
      <div className="space-y-1.5">
        <Label htmlFor="admin-name" className="text-zinc-300">Nombre</Label>
        <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del admin" required
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="admin-email" className="text-zinc-300">Email</Label>
        <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@ejemplo.com" required
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="admin-password" className="text-zinc-300">Contraseña</Label>
        <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres" minLength={8} required
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white">
        {loading ? "Creando..." : "Crear admin"}
      </Button>
    </form>
  )
}
