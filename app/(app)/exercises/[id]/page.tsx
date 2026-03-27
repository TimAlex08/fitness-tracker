import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ExerciseDetailRedirect({ params }: PageProps) {
  const { id } = await params
  redirect(`/training/exercises/${id}`)
}
