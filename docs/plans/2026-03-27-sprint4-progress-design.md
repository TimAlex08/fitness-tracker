# Sprint 4 — "Veo mi avance" — Diseño e implementación

**Fecha:** 2026-03-27
**Estado:** Completado

## Alcance

Implementación del Sprint 4 según spec de CLAUDE.md:
- Dashboard `/progress` con streak, volumen semanal, progresión por ejercicio, dolor promedio
- Indicadores de benchmark por fase activa
- Exportar datos CSV
- Mediciones corporales (UI + API)
- Fix dashboard `/` con datos reales

## Archivos creados

### Feature: `features/progress/`
- `types/progress.types.ts` — tipos: ProgressData, ProgressStats, WeeklyVolume, ExerciseProgression, WeeklyPain, PhaseInfo
- `api/prisma-progress-repository.ts` — queries: getStats, getWeeklyVolume, getExerciseProgressions, getWeeklyPain, getActivePhase
- `components/stats-strip.tsx` — 4 tarjetas: racha, sesiones mes, adherencia, RPE medio
- `components/volume-chart.tsx` — barras CSS de ejercicios completados (8 semanas)
- `components/exercise-progression.tsx` — tabla por ejercicio con trend arrow
- `components/pain-tracker.tsx` — barras CSS de dolor semanal con leyenda de color
- `components/phase-benchmarks.tsx` — RPE objetivo vs actual, sesiones, adherencia
- `components/measurements-section.tsx` — Client Component: form + tabla de mediciones
- `components/export-button.tsx` — link de descarga CSV

### Páginas y rutas
- `app/(app)/progress/page.tsx` — nueva página (Server Component)
- `app/api/export/route.ts` — GET → CSV de DailyLogs + ExerciseLogs
- `app/api/measurements/route.ts` — GET (list) + POST (create)

### Modificaciones
- `lib/navigation.ts` — removido `comingSoon: true` de /progress
- `app/(app)/page.tsx` — dashboard con datos reales (streak, sesión de hoy, adherencia)

## Decisiones de diseño

- **Sin librería de charts**: barras CSS Tailwind para mantener bundle pequeño
- **Server Component en /progress**: todo el data fetching en servidor, sin useState para los datos principales
- **MeasurementsSection es Client Component**: necesita formulario interactivo
- **Export via link**: `<a href="/api/export" download>` — sin JS extra, el browser maneja la descarga
