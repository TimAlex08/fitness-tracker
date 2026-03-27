import { NextRequest, NextResponse } from "next/server"
import { PrismaRoutineRepository } from "@/features/routines/api/prisma-routine-repository"
import { createRoutineSchema } from "@/features/routines/schemas/routine.schema"
import { getSession } from "@/lib/auth"

const repo = new PrismaRoutineRepository()

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const routines = await repo.findAll(user.id)
    return NextResponse.json(routines)
  } catch (error) {
    console.error("[GET /api/routines]", error)
    return NextResponse.json({ error: "Error obteniendo rutinas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = createRoutineSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const routine = await repo.create(user.id, parsed.data)
    return NextResponse.json(routine, { status: 201 })
  } catch (error) {
    console.error("[POST /api/routines]", error)
    return NextResponse.json({ error: "Error creando rutina" }, { status: 500 })
  }
}
