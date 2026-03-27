/**
 * Configuración de navegación — OCP aplicado:
 * Agregar una nueva ruta = agregar un objeto a NAV_ITEMS.
 * El sidebar y el header móvil leen esta config sin modificarse.
 */

import {
  Home,
  Activity,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  /** Texto visible en el menú */
  label: string
  /** Ruta de Next.js */
  href: string
  /** Ícono de lucide-react */
  icon: LucideIcon
  /** Si true: se muestra pero no es clickeable (feature pendiente) */
  comingSoon?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    label: "Entrenamiento",
    href: "/training",
    icon: Activity,
  },
  {
    label: "Progreso",
    href: "/progress",
    icon: TrendingUp,
  },
]
