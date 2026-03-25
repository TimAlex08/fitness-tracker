import { NextRequest, NextResponse } from "next/server"
import { PrismaProgramRepository } from "@/features/programs/api/prisma-program-repository"
import { createProgramSchema } from "@/features/programs/schemas/program.schema"

const repo = new PrismaProgramRepository()

export async function GET() {
  try {
    const programs = await repo.findAll()
    return NextResponse.json(programs)
  } catch (error) {
    console.error("[GET /api/programs]", error)
    return NextResponse.json({ error: "Error al obtener programas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createProgramSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const program = await repo.create(parsed.data)
    return NextResponse.json(program, { status: 201 })
  } catch (error: unknown) {
    console.error("[POST /api/programs]", error)
    return NextResponse.json({ error: "Error al crear el programa" }, { status: 500 })
  }
}
