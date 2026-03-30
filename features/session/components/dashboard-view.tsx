"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dumbbell, Info, Play, Timer, CheckCircle2, AlertCircle } from "lucide-react"
import type { RoutineWithExercises } from "@/types"

type DashboardViewProps = {
  routine: RoutineWithExercises | null
  onStart: () => void
  onStartFree: () => void
}

export function DashboardView({ routine, onStart, onStartFree }: DashboardViewProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Principal Action Card */}
      <Card className="p-6 bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Dumbbell className="h-32 w-32 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-widest mb-2">Siguiente Sesión</h2>
          <h3 className="text-3xl font-bold text-white mb-6">
            {routine ? routine.name : "Sesión Libre"}
          </h3>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={onStart}
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-16 text-lg rounded-2xl shadow-xl shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              <Play className="h-6 w-6 mr-3 fill-current group-hover:scale-110 transition-transform" />
              INICIAR ENTRENAMIENTO
            </Button>
            
            {!routine && (
              <p className="text-zinc-500 text-center text-xs">
                No tienes una rutina programada para hoy. ¡Crea una sesión libre!
              </p>
            )}
            
            {routine && (
              <Button 
                variant="ghost" 
                onClick={onStartFree}
                className="text-zinc-500 hover:text-white transition-colors text-xs"
              >
                O empezar sesión libre
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Glossary / Explanation Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <Info className="h-4 w-4" />
          <h4 className="text-sm font-semibold uppercase tracking-wider">Glosario de Interfaz</h4>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-0.5">Ejercicios de Repeticiones</p>
              <p className="text-xs text-zinc-500 leading-relaxed">Simplemente marca como completado al terminar tus series. El sistema registrará los valores objetivos.</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Timer className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-0.5">Ejercicios de Tiempo</p>
              <p className="text-xs text-zinc-500 leading-relaxed">Inicia el cronómetro integrado. Al finalizar el tiempo, podrás continuar al siguiente ejercicio.</p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-0.5">RPE (Esfuerzo Percibido)</p>
              <p className="text-xs text-zinc-500 leading-relaxed">Escala del 1-10 de qué tan difícil fue. 10 es el máximo esfuerzo posible.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
