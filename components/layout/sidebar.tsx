import { Dumbbell } from "lucide-react"
import { SidebarNavLinks } from "./sidebar-nav-links"
import { SidebarUserFooter } from "./sidebar-user-footer"

type User = { name: string; email: string; role: string }

export function Sidebar({ user }: { user: User }) {
  return (
    <aside
      className="flex h-full w-64 flex-col bg-zinc-900 border-r border-zinc-800"
      aria-label="Panel de navegación"
    >
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          <Dumbbell className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Workout</p>
          <p className="text-xs text-zinc-500 leading-tight">Fase Cero</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNavLinks />
      </div>

      <SidebarUserFooter user={user} />
    </aside>
  )
}
