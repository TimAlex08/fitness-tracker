# Plan de Implementación: Interfaz de Sesión Sin Scroll (Split-Screen 50/50)

**Objetivo:** Transformar `FocusExerciseCard` y `SimplifiedExerciseForm` en una interfaz estática de pantalla completa optimizada para móviles.

## 1. Reestructuración de Layout (`FocusExerciseCard.tsx`)
- [ ] Cambiar el contenedor principal para que use `h-full` (o `h-[calc(100vh-OFFSET)]`) y `flex-col overflow-hidden`.
- [ ] Dividir en dos contenedores `div` con `flex-1` o `h-1/2`.
- [ ] Mover el video/imagen al contenedor superior con `object-cover`.
- [ ] Implementar los Overlays:
    - [ ] Icono de info (esquina superior derecha) que dispare un `Sheet` con `re.exercise.description`.
    - [ ] Título del ejercicio con `absolute bottom-4 left-6` y sombra de texto.
- [ ] Añadir la barra de progreso minimalista en la unión de ambos contenedores.

## 2. Panel de Control de Triple Columna (`SimplifiedExerciseForm.tsx`)
- [ ] Crear el layout de columnas: `flex h-full`.
- [ ] **Columna RPE (Izquierda):**
    - [ ] Lista vertical de 10 botones.
    - [ ] Estilo compacto, resaltado en verde esmeralda al seleccionar.
- [ ] **Columna Dolor (Derecha):**
    - [ ] Lista vertical de 10 botones.
    - [ ] Estilo compacto, resaltado en naranja al seleccionar.
- [ ] **Zona Central:**
    - [ ] Cabecera con objetivo (Reps/Sets/Tempo).
    - [ ] Visualización gigante del cronómetro o reps actuales.
    - [ ] Botones de control (Play/Pause/Reset o +/-) en disposición vertical u horizontal compacta.
    - [ ] Botón "GUARDAR Y CONTINUAR" anclado en la base con `w-full`.

## 3. Lógica de Interacción y Estados
- [ ] Actualizar `useSessionState` si es necesario para manejar las selecciones rápidas.
- [ ] Implementar el "Flash de Confirmación": Cuando se selecciona un RPE/Dolor, mostrar el valor en grande en el centro durante 500ms.
- [ ] Transición suave: Asegurar que al cambiar de ejercicio (swipe o botón) no haya parpadeos de layout.

## 4. Estilos y Pulido (Tailwind 4)
- [ ] Eliminar cualquier `pading` o `gap` que fuerce el scroll en pantallas pequeñas.
- [ ] Usar `scrollbar-hide` en contenedores que puedan desbordar accidentalmente.
- [ ] Asegurar que el botón de cerrar sesión (X) del layout padre no interfiera con el video.

## 5. Validación
- [ ] Probar en diferentes tamaños de pantalla (móvil pequeño vs grande).
- [ ] Verificar que no aparezca la barra de scroll vertical en ningún momento durante la sesión.
