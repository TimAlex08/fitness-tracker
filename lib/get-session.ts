import { getSession } from "./auth"
import { redirect } from "next/navigation"

export async function getRequiredSession() {
  const user = await getSession()
  if (!user) redirect("/login")
  return user
}
