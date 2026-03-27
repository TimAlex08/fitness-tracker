"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProgramForm } from "@/features/programs/components/program-form"

export default function NewProgramPage() {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) router.push("/training/plan")
  }

  return <ProgramForm open={open} onOpenChange={handleOpenChange} />
}
