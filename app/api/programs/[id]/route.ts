import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"

const patchSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    const { id } = await params

    const program = await prisma.program.findUnique({
      where: { id, userId: user.id },
      include: {
        phases: {
          orderBy: { order: "asc" },
          include: {
            programDays: {
              orderBy: { dayOfWeek: "asc" },
              include: {
                routine: { select: { id: true, name: true, sessionType: true, durationMin: true } },
                overrides: true,
              },
            },
          },
        },
      },
    })

    if (!program) return apiError("Programa no encontrado", 404)
    return NextResponse.json(program)
  } catch (error) {
    console.error("[GET /api/programs/[id]]", error)
    return apiError("Error obteniendo programa", 500)
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    const { id } = await params

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Verificar que el programa pertenece al usuario
    const existing = await prisma.program.findUnique({ where: { id, userId: user.id } })
    if (!existing) return apiError("Programa no encontrado", 404)

    const data = parsed.data

    const program = await prisma.$transaction(async (tx) => {
      // Si se activa este programa, desactivar los demás
      if (data.isActive === true) {
        await tx.program.updateMany({
          where: { userId: user.id, isActive: true, id: { not: id } },
          data: { isActive: false },
        })
      }

      return tx.program.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      })
    })

    return NextResponse.json(program)
  } catch (error) {
    console.error("[PATCH /api/programs/[id]]", error)
    return apiError("Error actualizando programa", 500)
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    const { id } = await params

    const existing = await prisma.program.findUnique({ where: { id, userId: user.id } })
    if (!existing) return apiError("Programa no encontrado", 404)

    await prisma.program.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/programs/[id]]", error)
    return apiError("Error eliminando programa", 500)
  }
}
