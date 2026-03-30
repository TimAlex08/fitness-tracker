import { getRequiredSession } from "@/lib/get-session"

export default async function SessionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await getRequiredSession()

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {children}
    </div>
  )
}
