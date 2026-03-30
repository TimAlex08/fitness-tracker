# Fitness Tracker — Plan Maestro de Reestructuración

**Fecha:** 2026-03-29
**Enfoque:** Security-First Secuencial (Opción A)
**Contexto:** Sprints 1–4 completos. App en uso personal + grupo pequeño de confianza.

---

## Resumen Ejecutivo

El proyecto tiene una base sólida: arquitectura feature-based, patrón Repository parcialmente aplicado, autenticación custom con bcrypt + tokens HTTP-only. El plan ataca tres frentes en fases secuenciales, priorizando seguridad antes de cualquier mejora visual o arquitectónica.

---

## Fase 1 — Seguridad

### Problema
- El middleware verifica que la cookie existe, no que el token sea válido en base de datos.
- Todas las API routes (~20 endpoints) no llaman a `getSession()` — cualquier request no autenticado puede leer y modificar datos.
- No hay verificación de ownership: conociendo un ID se puede acceder a datos de otro usuario.
- No hay rate limiting en endpoints de autenticación.
- Headers de seguridad HTTP ausentes.

### Solución

**1. Auth guard en todas las API routes**
Crear un helper `withAuth(handler)` en `lib/api-auth.ts` que:
- Extrae y valida la sesión del usuario.
- Inyecta el `userId` autenticado al handler.
- Devuelve `401` si la sesión es inválida o inexistente.
- Se aplica a los ~20 endpoints existentes en `app/api/`.

**2. Middleware mejorado**
Modificar `middleware.ts` para verificar la validez del token contra la base de datos (o en el futuro migrar a JWT firmado para evitar el DB hit). Por ahora: validación real en DB en cada request protegido.

**3. Rate limiting en auth endpoints**
Agregar límite de 10 intentos/minuto por IP en `/api/auth/login` y `/api/auth/register` usando un Map en memoria (suficiente para grupo pequeño; escalar a Redis/Upstash si crece).

**4. Ownership validation**
En todos los endpoints que lean o modifiquen `DailyLog`, `ExerciseLog`, `Routine`, `Program`, `BodyMeasurement`: siempre filtrar por `userId` del usuario autenticado. Nunca confiar en IDs del body/query sin verificar que pertenecen al usuario.

**5. Auditoría SQL injection**
Prisma usa queries parametrizadas por defecto. Auditar:
- Campos con `contains` / `mode: "insensitive"` para confirmar que no hay interpolación manual.
- Campos `String?` que reciben input libre (`notes`, `regressionNote`, etc.).
- Confirmar que no hay `prisma.$queryRaw` sin `Prisma.sql` template literal.

**6. Headers de seguridad HTTP**
Agregar en `next.config.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Criterios de éxito
- Cualquier request a `/api/*` (excepto `/api/auth/*`) sin sesión válida devuelve 401.
- Un usuario autenticado no puede leer ni modificar datos de otro usuario.
- Los endpoints de login/register rechazan con 429 tras 10 intentos/minuto.
- No hay raw queries sin parametrizar.

---

## Fase 2 — Arquitectura (Refactor Moderado)

### Problema
- Patrón Repository inconsistente: `progress` y `training` tienen implementación Prisma sin interfaz abstracta.
- Lógica de negocio dispersa: cálculo de `CompletionStatus` vive en el hook cliente `useSessionState`.
- Tipos mezclados: componentes consumen modelos de Prisma directamente en algunos casos.
- `repsPerSet` se guarda como `JSON.stringify(array)` en campo `String` — parse/serialize disperso.
- Error handling ad-hoc en cada API route.

### Solución

**1. Completar Repository pattern**
Crear interfaces abstractas para `features/progress/api/progress-repository.ts` y `features/training/api/training-repository.ts`, siguiendo el modelo de `features/exercises/api/exercise-repository.ts`.

**2. Capa de servicios ligera**
Extraer lógica de negocio de API routes y hooks a servicios:
- `features/session/services/session.service.ts` — cálculo de `CompletionStatus`, validación de `repsPerSet`, creación/actualización de `DailyLog`.
- Solo donde la lógica es no-trivial; no crear servicios wrapper vacíos.

**3. DTOs en boundaries**
Los repositories devuelven DTOs (tipos propios de la feature), no modelos de Prisma crudos. Los componentes nunca importan de `@prisma/client` directamente. `types/index.ts` se limpia para ser el contrato de DTOs compartidos.

**4. `repsPerSet` centralizado**
Centralizar el serialize/deserialize de `repsPerSet` en el repository de sesión. Un único punto de entrada/salida para este campo. No cambiar el esquema de DB en esta fase.

**5. Error handling estándar**
Crear `lib/api-error.ts` con helper `apiError(message: string, status: number)` y aplicarlo en todas las API routes en lugar de los `NextResponse.json({ error: ... })` dispersos.

### Criterios de éxito
- Todas las features tienen interfaz de Repository + implementación Prisma.
- La lógica de `CompletionStatus` no vive en el cliente.
- Ningún componente importa tipos de `@prisma/client`.
- `repsPerSet` se serializa/deserializa en un único lugar.
- Todas las API routes usan `apiError()` para respuestas de error.

---

## Fase 3 — UI/Mobile (Mobile-First)

### Problema
- `/today` es la vista de uso diario en el gym pero no está optimizada para una mano: botones pequeños, información densa, feedback visual insuficiente.
- Sidebar no funciona en móvil — no hay navegación bottom-bar.
- Algunos componentes de shadcn tienen fondos blancos que rompen el dark theme.
- No hay feedback inmediato al completar series o ejercicios.
- La app no es instalable como PWA.

### Solución

**1. `/today` mobile-first redesign**
- Zona táctil mínima 48px en todos los botones de acción de serie.
- Timer de descanso como bottom sheet prominente (no tooltip), ocupa la zona inferior de la pantalla.
- Navegación entre ejercicios con botones grandes thumb-friendly o swipe.
- Ejercicio activo siempre visible sin necesidad de scroll.
- Indicador de progreso de sesión (X de N ejercicios) fijo en la parte superior.

**2. Bottom navigation en mobile**
- Barra inferior fija en mobile con 4 rutas: Hoy, Entrenamiento, Progreso, Ejercicios.
- Se extiende el `mobile-header.tsx` existente.
- En desktop el sidebar lateral permanece sin cambios.

**3. Feedback visual de acciones**
- Toast al completar ejercicio, guardar serie, terminar sesión.
- Color change en el card del ejercicio al marcarlo como completado.
- Animación sutil (checkmark, pulse) en acciones clave.

**4. Responsive en vistas secundarias**
- `/progress`: stats strip en 2 columnas en mobile, 4 en desktop. Gráficas con altura reducida en mobile.
- `/training`: calendario mes/semana con tamaño de celda adaptado.
- `/exercises`: grid 1 columna mobile, 2-3 tablet/desktop.

**5. Dark mode completo**
Auditar todos los componentes shadcn importados para eliminar fondos blancos residuales. Unificar paleta: `zinc-900` fondo, `zinc-800` cards, `zinc-400` texto secundario.

**6. PWA básica**
- Agregar `public/manifest.json` con nombre, iconos y `display: standalone`.
- Service worker básico para instalabilidad (sin modo offline complejo).
- Meta tags en `app/layout.tsx` para iOS (`apple-mobile-web-app-capable`).

### Criterios de éxito
- `/today` es completamente operable con una mano en iPhone SE (375px).
- La app es instalable desde Safari/Chrome en iOS/Android.
- No hay fondos blancos en dark mode.
- Todas las acciones principales tienen feedback visual inmediato.
- El sidebar desaparece en mobile y se reemplaza por bottom nav.

---

## Arquitectura de Fases

```
Fase 1 (Seguridad)
├── lib/api-auth.ts          ← nuevo: withAuth helper
├── lib/api-error.ts         ← nuevo: apiError helper (adelantado de Fase 2)
├── middleware.ts             ← modificado: validación real de sesión
├── app/api/**/*.ts          ← modificados: todos usan withAuth
└── next.config.ts           ← modificado: security headers

Fase 2 (Arquitectura)
├── features/progress/api/progress-repository.ts     ← nuevo
├── features/training/api/training-repository.ts     ← nuevo
├── features/session/services/session.service.ts     ← nuevo
├── types/index.ts            ← limpiado: solo DTOs compartidos
└── features/**/api/*.ts      ← modificados: devuelven DTOs

Fase 3 (UI/Mobile)
├── components/layout/bottom-nav.tsx                 ← nuevo
├── features/session/components/today-session.tsx    ← rediseño mobile
├── features/session/components/rest-timer.tsx       ← bottom sheet
├── public/manifest.json                             ← nuevo: PWA
└── app/layout.tsx            ← modificado: PWA meta tags
```

---

## Restricciones y Decisiones

- **Sin cambios de schema de DB en Fase 2** — `repsPerSet` sigue como String; solo se centraliza el parse.
- **Rate limiting en memoria** — suficiente para grupo pequeño; no requiere Redis.
- **Sin NextAuth** — se mantiene la auth custom existente, solo se cierra el hueco de validación.
- **PWA sin offline complejo** — solo instalabilidad, no cache de datos offline.
- **Refactor moderado** — no se renombran carpetas ni se mueve la estructura de features.
