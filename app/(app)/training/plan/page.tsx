import { Plus } from "lucide-react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getRequiredSession } from "@/lib/get-session"
import { PlanPhaseGrid } from "@/features/programs/components/plan-phase-grid"
import { PlanControls } from "@/features/programs/components/plan-controls"
import type { RoutineOption } from "@/features/programs/components/day-drawer"

export default async function PlanPage() {
  const user = await getRequiredSession()

  const [programs, routines] = await Promise.all([
    prisma.program.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: {
            programDays: {
              orderBy: { dayOfWeek: "asc" },
              include: {
                routine: { select: { id: true, name: true, sessionType: true, durationMin: true } },
              },
            },
          },
        },
      },
    }),
    prisma.routine.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sessionType: true, durationMin: true },
    }),
  ])

  const activeProgram = programs.find((p) => p.isActive) ?? programs[0] ?? null

  const routineOptions: RoutineOption[] = routines.map((r) => ({
    id: r.id,
    name: r.name,
    sessionType: r.sessionType,
    durationMin: r.durationMin,
  }))

  if (!activeProgram) {
    return (
      <div className="px-6 pb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Plan</h1>
          <Link
            href="/training/plan/new"
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo programa
          </Link>
        </div>

        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
          <p className="text-zinc-500 text-sm mb-4">No tienes ningún programa todavía.</p>
          <Link
            href="/training/plan/new"
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear primer programa
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
        <PlanControls
          programs={programs.map((p) => ({ id: p.id, name: p.name, isActive: p.isActive }))}
          activeId={activeProgram.id}
        />
      </div>

      {/* Phase grids */}
      <div className="space-y-6">
        {activeProgram.phases.map((phase) => (
          <PlanPhaseGrid
            key={phase.id}
            programId={activeProgram.id}
            phase={{
              id: phase.id,
              name: phase.name,
              weekStart: phase.weekStart,
              weekEnd: phase.weekEnd,
            }}
            programDays={phase.programDays}
            routines={routineOptions}
          />
        ))}
      </div>
    </div>
  )
}
