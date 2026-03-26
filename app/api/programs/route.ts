import { NextRequest, NextResponse } from "next/server"
import { PrismaProgramRepository } from "@/features/programs/api/prisma-program-repository"
import { createProgramSchema } from "@/features/programs/schemas/program.schema"
import { getSession } from "@/lib/auth"

const repo = new PrismaProgramRepository()

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const programs = await repo.findAll(user.id)
    return NextResponse.json(programs)
  } catch (error) {
    console.error("[GET /api/programs]", error)
    return NextResponse.json({ error: "Error al obtener programas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = createProgramSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const program = await repo.create(parsed.data, user.id)
    return NextResponse.json(program, { status: 201 })
  } catch (error: unknown) {
    console.error("[POST /api/programs]", error)
    return NextResponse.json({ error: "Error al crear el programa" }, { status: 500 })
  }
}
