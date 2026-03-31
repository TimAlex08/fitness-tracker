import { Plus } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getRequiredSession } from "@/lib/get-session"

export default async function PlanPage() {
  const user = await getRequiredSession()

  // TODO(Plan C): Rewrite this page to use Collection -> Program -> ProgramRoutine
  const collection = await prisma.collection.findFirst({
    where: { userId: user.id, isActive: true },
    include: {
      programs: {
        where: { isActive: true },
        include: {
          programRoutines: {
            include: {
              routine: true,
            },
          },
        },
      },
    },
  })

  const activeProgram = collection?.programs[0] ?? null

  if (!activeProgram) {
    return (
      <div className="px-6 pb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Plan</h1>
          <Link
            href="/training/collections"
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Gestionar colecciones
          </Link>
        </div>

        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm mb-4">No tienes ningún programa activo todavía.</p>
          <Link
            href="/training/collections"
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Gestionar colecciones
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{activeProgram.name}</h1>
          {activeProgram.description && (
            <p className="text-sm text-zinc-400 mt-1">{activeProgram.description}</p>
          )}
        </div>
      </div>

      {/* TODO(Plan C): Implement new Program view */}
      <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
        <p className="text-zinc-500 text-sm">Vista de planificación en proceso de refactorización (Plan C).</p>
      </div>
    </div>
  )
}