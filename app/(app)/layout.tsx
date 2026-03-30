/**
 * App Layout — shell principal de la aplicación.
 * Responsabilidad: componer sidebar (desktop) + header móvil + área de contenido.
 * En desktop: sidebar fijo izquierda + contenido ocupa el resto.
 * En mobile: header con hamburguesa arriba + contenido a pantalla completa.
 */

import { Sidebar } from "@/components/layout/sidebar"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { getRequiredSession } from "@/lib/get-session"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getRequiredSession()

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar — visible solo en desktop (lg+) */}
      <div className="hidden lg:flex lg:flex-col lg:shrink-0">
        <Sidebar user={user} />
      </div>

      {/* Columna principal */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header con hamburguesa — visible solo en mobile */}
        <MobileHeader />

        {/* Contenido de la página con scroll independiente */}
        <main
          className="flex-1 overflow-y-auto pb-20 lg:pb-0"
          id="main-content"
          aria-label="Contenido principal"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
