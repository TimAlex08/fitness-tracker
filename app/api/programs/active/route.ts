import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    const collection = await prisma.collection.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        programs: {
          where: { isActive: true },
          include: {
            programRoutines: {
              include: {
                routine: true,
                overrides: true,
              },
            },
          },
        },
      },
    })

    const program = collection?.programs[0] ?? null

    return NextResponse.json(program)
  } catch (error) {
    console.error("[GET /api/programs/active]", error)
    return apiError("Error obteniendo programa", 500)
  }
}