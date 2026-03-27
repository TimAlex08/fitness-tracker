import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

const DAY_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

const daySchema = z.object({
  routineId: z.string().cuid(),
  dayOfWeek: z.enum(DAY_OF_WEEK),
  weekNumber: z.number().int().min(1).nullable().optional(),
  overrides: z.array(z.object({
    exerciseId: z.string().cuid(),
    sets: z.number().nullable().optional(),
    reps: z.number().nullable().optional(),
    durationSec: z.number().nullable().optional(),
    restSec: z.number().nullable().optional(),
    tempo: z.string().nullable().optional(),
    rpe: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
  })).optional(),
})

const bodySchema = z.object({
  days: z.array(daySchema),
})

type Params = { params: Promise<{ id: string; phaseId: string }> }

// PUT reemplaza todos los ProgramDay de una fase
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: programId, phaseId } = await params

    // Verificar que la fase pertenece al programa del usuario
    const phase = await prisma.phase.findFirst({
      where: { id: phaseId, programId, program: { userId: user.id } },
    })
    if (!phase) return NextResponse.json({ error: "Fase no encontrada" }, { status: 404 })

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Eliminar todos los días actuales de la fase
      await tx.programDay.deleteMany({ where: { phaseId } })

      // Insertar los nuevos
      for (const day of parsed.data.days) {
        const created = await tx.programDay.create({
          data: {
            phaseId,
            routineId: day.routineId,
            dayOfWeek: day.dayOfWeek,
            weekNumber: day.weekNumber ?? null,
          },
        })

        if (day.overrides?.length) {
          await tx.exerciseOverride.createMany({
            data: day.overrides.map((o) => ({
              programDayId: created.id,
              exerciseId: o.exerciseId,
              sets: o.sets ?? null,
              reps: o.reps ?? null,
              durationSec: o.durationSec ?? null,
              restSec: o.restSec ?? null,
              tempo: o.tempo ?? null,
              rpe: o.rpe ?? null,
              notes: o.notes ?? null,
            })),
          })
        }
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[PUT /api/programs/[id]/phases/[phaseId]/days]", error)
    return NextResponse.json({ error: "Error guardando días" }, { status: 500 })
  }
}
