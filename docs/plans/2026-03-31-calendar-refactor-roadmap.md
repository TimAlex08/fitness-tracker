# Calendar-First Refactor — Roadmap de Planes

Este documento lista todos los planes de implementación. Cada plan produce software funcional y testeable de forma independiente.

| Plan | Archivo | Estado |
|---|---|---|
| A — Foundation | `2026-03-31-calendar-refactor-plan-a-foundation.md` | Listo para ejecutar |
| B — Calendar | `2026-03-31-calendar-refactor-plan-b-calendar.md` | Listo para ejecutar |
| C — Programs CRUD | `2026-03-31-calendar-refactor-plan-c-programs.md` | Listo para ejecutar |
| D — Session | `2026-03-31-calendar-refactor-plan-d-session.md` | Listo para ejecutar |
| E — Exercises | `2026-03-31-calendar-refactor-plan-e-exercises.md` | Listo para ejecutar |
| F — Progress | `2026-03-31-calendar-refactor-plan-f-progress.md` | Listo para ejecutar |

## Dependencias

```
A (schema) → requerido por todos los demás
B (calendar) → requerido por C, D
C (programs) → requerido por D
D (session) → independiente de E, F
E (exercises) → independiente de D, F
F (progress) → requiere D y E completos
```

## Resumen de entregables por plan

**Plan A** — DB resetada, nuevo schema, tipos actualizados, seed con datos reales, app compila y bootea.

**Plan B** — CalendarService funcional, `/today` muestra rutinas reales del programa activo, tres vistas de calendario (`/calendar`, `/calendar/week`, `/calendar/day/[date]`), navegación actualizada.

**Plan C** — CRUD completo para Collections, Programs, ProgramRoutines y ScheduleOverrides. El usuario puede crear/editar su plan y ver cómo se refleja en el calendario.

**Plan D** — Sesión activa refactorizada: soporta múltiples rutinas por día, fuente SCHEDULED/AD_HOC, registra ExerciseLogs con el nuevo modelo. Resumen post-sesión.

**Plan E** — ExerciseFamily como entidad visible. Catálogo de ejercicios con vista de familia, selector de familyLevel. Vista `/training/exercises/[id]` con gráfica básica de familia.

**Plan F** — Dashboard de progreso: ExerciseFamilyChart (familyLevel vs tiempo), AdherenceChart (% completado por semana), StreakCounter (racha actual + mejor racha).

## Diseño de referencia

Ver `2026-03-31-calendar-refactor-design.md` para decisiones de arquitectura, modelo de datos completo y flujos de usuario.
