"use client"

import { useState, useEffect, useCallback } from "react"
import type { CreateProgramBody, CreatePhaseBody } from "../schemas/program.schema"

const STORAGE_KEY = "workout-program-builder-v1"

const DEFAULT_PHASE: CreatePhaseBody = {
  name: "Fase 1",
  order: 0,
  weekStart: 1,
  weekEnd: 4,
  description: "",
  rpeTarget: "7-8",
  tempoDefault: "3-0-1-0",
  benchmarks: "",
  routines: [],
}

const INITIAL_DATA: CreateProgramBody = {
  name: "",
  description: "",
  isActive: true,
  phases: [DEFAULT_PHASE],
}

export function useProgramBuilder() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<CreateProgramBody>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Error loading saved program data", e)
        }
      }
    }
    return INITIAL_DATA
  })
  const [isReady, setIsReady] = useState(false)

  // ── Persistence ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (isReady) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data, isReady])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, 4)), [])
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), [])

  const updateProgramInfo = useCallback((name: string, description: string | null) => {
    setData((prev) => ({ ...prev, name, description }))
  }, [])

  const updatePhases = useCallback((phases: CreatePhaseBody[]) => {
    setData((prev) => ({ ...prev, phases }))
  }, [])

  const resetBuilder = useCallback(() => {
    setData(INITIAL_DATA)
    setStep(1)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    data,
    updateProgramInfo,
    updatePhases,
    resetBuilder,
    isReady,
  }
}
