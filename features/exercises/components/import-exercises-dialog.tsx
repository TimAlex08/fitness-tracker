"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ImportRow = Record<string, string | number | null>

type ImportResult = {
  imported: number
  skipped: number
  errors: { row: number; name: string; message: string }[]
}

type Stage = "idle" | "preview" | "importing" | "done"

// ─── CSV Parser simple ────────────────────────────────────────────────────────

function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split("\n").filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const rows: ImportRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
    const row: ImportRow = {}
    headers.forEach((header, idx) => {
      const val = values[idx] ?? ""
      row[header] = val === "" ? null : val
    })
    rows.push(row)
  }

  return rows
}

// ─── Columnas a mostrar en preview ────────────────────────────────────────────

const PREVIEW_COLS = ["name", "muscleGroup", "movementType", "category", "difficulty", "defaultSets", "defaultReps"] as const

// ─── Componente ───────────────────────────────────────────────────────────────

type ImportExercisesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportExercisesDialog({ open, onOpenChange }: ImportExercisesDialogProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<Stage>("idle")
  const [rows, setRows] = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState<string>("")
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  function reset() {
    setStage("idle")
    setRows([])
    setFileName("")
    setParseError(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleClose(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  async function handleFile(file: File) {
    setParseError(null)
    setFileName(file.name)
    const text = await file.text()

    try {
      let parsed: ImportRow[]

      if (file.name.endsWith(".json")) {
        const json = JSON.parse(text)
        if (!Array.isArray(json)) throw new Error("El JSON debe ser un array de objetos.")
        parsed = json
      } else {
        parsed = parseCSV(text)
        if (parsed.length === 0) throw new Error("El CSV está vacío o no tiene cabeceras.")
      }

      setRows(parsed)
      setStage("preview")
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Error al leer el archivo.")
    }
  }

  async function handleImport() {
    setStage("importing")
    try {
      const res = await fetch("/api/exercises/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercises: rows }),
      })
      const data = await res.json()

      if (!res.ok) {
        setParseError(data.error?.message ?? "Error al importar.")
        setStage("preview")
        return
      }

      setResult(data)
      setStage("done")
      router.refresh()
    } catch {
      setParseError("Error de red. Inténtalo de nuevo.")
      setStage("preview")
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-zinc-950 border-zinc-800 overflow-y-auto flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-400" />
            Importar ejercicios
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

          {/* ── IDLE: zona de carga ── */}
          {stage === "idle" && (
            <>
              {/* Drop zone */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-zinc-700 hover:border-emerald-600 rounded-xl p-10 text-center transition-colors group"
              >
                <FileText className="h-10 w-10 mx-auto text-zinc-600 group-hover:text-emerald-500 mb-3 transition-colors" />
                <p className="text-sm font-medium text-zinc-300">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-zinc-500 mt-1">CSV o JSON · máximo 500 ejercicios</p>
              </button>

              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />

              {parseError && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {parseError}
                </div>
              )}

              {/* Formato esperado */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Formato CSV esperado
                </p>
                <pre className="text-xs bg-zinc-900 rounded-lg p-3 text-zinc-400 overflow-x-auto leading-relaxed">
{`name,muscleGroup,movementType,category,difficulty,defaultSets,defaultReps,defaultRestSec
Sentadilla,LEGS,SQUAT,STANDARD,2,3,10,90
Flexiones,CHEST,PUSH,STANDARD,1,3,8,60`}
                </pre>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Valores válidos
                </p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <p><span className="text-zinc-400">muscleGroup:</span> CHEST · BACK · LEGS · SHOULDERS · CORE · MOBILITY · FULL_BODY</p>
                  <p><span className="text-zinc-400">movementType:</span> PUSH · PULL · SQUAT · HINGE · CARRY · ISOMETRIC · MOBILITY · ACTIVATION</p>
                  <p><span className="text-zinc-400">category:</span> STANDARD · REGRESSION · PROGRESSION · PREHAB · WARMUP · COOLDOWN</p>
                </div>
              </div>
            </>
          )}

          {/* ── PREVIEW ── */}
          {(stage === "preview" || stage === "importing") && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{fileName}</p>
                  <p className="text-xs text-zinc-500">{rows.length} ejercicio{rows.length !== 1 ? "s" : ""} listos para importar</p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  disabled={stage === "importing"}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {parseError && (
                <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {parseError}
                </div>
              )}

              {/* Tabla preview */}
              <div className="overflow-x-auto rounded-xl border border-zinc-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-2 px-3 text-zinc-500 font-medium">#</th>
                      {PREVIEW_COLS.map((col) => (
                        <th key={col} className="text-left py-2 px-3 text-zinc-500 font-medium whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-zinc-800/60 last:border-0">
                        <td className="py-2 px-3 text-zinc-600">{i + 1}</td>
                        {PREVIEW_COLS.map((col) => (
                          <td key={col} className="py-2 px-3 text-zinc-300 whitespace-nowrap max-w-[120px] truncate">
                            {row[col] != null ? String(row[col]) : <span className="text-zinc-600">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <p className="text-xs text-zinc-600 px-3 py-2 border-t border-zinc-800">
                    ... y {rows.length - 20} más
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={reset}
                  disabled={stage === "importing"}
                  className="flex-1 border-zinc-700 text-zinc-400 hover:text-white"
                >
                  Cambiar archivo
                </Button>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={stage === "importing"}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {stage === "importing" ? "Importando..." : `Importar ${rows.length} ejercicio${rows.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </>
          )}

          {/* ── DONE ── */}
          {stage === "done" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {result.imported} ejercicio{result.imported !== 1 ? "s" : ""} importado{result.imported !== 1 ? "s" : ""}
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {result.skipped} omitido{result.skipped !== 1 ? "s" : ""} por errores
                    </p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Errores ({result.errors.length})
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs bg-red-500/10 rounded-lg px-3 py-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                        <span>
                          <span className="text-zinc-400">Fila {err.row} ({err.name}): </span>
                          <span className="text-red-400">{err.message}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={reset}
                  className="flex-1 border-zinc-700 text-zinc-400 hover:text-white"
                >
                  Importar más
                </Button>
                <Button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Listo
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
