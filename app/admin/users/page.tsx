import { prisma } from "@/lib/prisma"
import { CreateAdminForm } from "./create-admin-form"
import { DeleteUserButton } from "./delete-user-button"

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Usuarios</h2>
        <p className="text-sm text-zinc-500">{users.length} usuario(s) registrado(s)</p>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900">
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Rol</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-medium">Registro</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-zinc-800/50 last:border-0">
                <td className="px-4 py-3 text-white">{user.name}</td>
                <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.role === "admin" ? "bg-emerald-900/50 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {user.role === "admin" ? "Admin" : "Usuario"}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(user.createdAt).toLocaleDateString("es-MX")}
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteUserButton userId={user.id} userName={user.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Crear nuevo admin</h2>
        <CreateAdminForm />
      </div>
    </div>
  )
}
