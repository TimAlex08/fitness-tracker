import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
    return NextResponse.json({ error: "Error obteniendo programa" }, { status: 500 })
  }
}
