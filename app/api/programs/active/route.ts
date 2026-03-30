import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    const program = await prisma.program.findFirst({
      where: { userId: user.id, isActive: true },
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

    return NextResponse.json(program ?? null)
  } catch (error) {
    console.error("[GET /api/programs/active]", error)
    return apiError("Error obteniendo programa", 500)
  }
}
