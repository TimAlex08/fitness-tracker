import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()

  if (!user) redirect("/login")
  if (user.role !== "admin") redirect("/")

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-white font-semibold">Panel de Administración</h1>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Volver a la app
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
