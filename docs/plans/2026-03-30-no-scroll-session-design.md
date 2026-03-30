# Diseño: Interfaz de Sesión Inmersiva Sin Scroll (Split-Screen 50/50)

**Fecha:** 2026-03-30
**Objetivo:** Rediseñar la experiencia de entrenamiento para móviles eliminando completamente el scroll vertical, optimizando la ergonomía y la visibilidad de la técnica.

## 1. Arquitectura Visual (Layout Estático)

La interfaz se divide en dos bloques principales de altura fija (50vh cada uno), asegurando que el contenido sea 100% visible en cualquier dispositivo móvil moderno sin necesidad de desplazamiento.

### 1.1 Bloque Superior: Área de Técnica (50% Altura)
- **Video/Imagen de Fondo:** Ocupa el 100% del contenedor superior (`object-cover`).
- **Overlay de Información:**
  - **Superior Izquierda:** Badge de grupo muscular/bloque (transparente con desenfoque).
  - **Superior Derecha:** Botón circular de "Información" (Icono `Info`) que abre un panel lateral (Sheet) con la descripción completa y notas de seguridad.
  - **Inferior Izquierda:** Título del ejercicio en tipografía bold/italic con sombra para legibilidad sobre el video.
- **Línea de Progreso:** Una barra minimalista de 2px en el borde inferior del video que indica el avance global de la sesión.

### 1.2 Bloque Inferior: Panel de Control (50% Altura)
Se organiza en una estructura de triple columna vertical para maximizar la ergonomía táctil (uso con pulgares).

- **Columna Izquierda (20% ancho):** Escala vertical de RPE (1 al 10). Botones rectangulares compactos que cambian a verde esmeralda al ser seleccionados.
- **Columna Derecha (20% ancho):** Escala vertical de Dolor (1 al 10). Botones similares que cambian a naranja intenso.
- **Zona Central (60% ancho):** Espacio dinámico para la acción principal:
  - **Cabecera de Objetivo:** Texto minimalista con reps/sets/tempo objetivo.
  - **Control de Ejercicio:** 
    - *Cronómetro:* Números gigantes en el centro con controles de Play/Pause/Reset pequeños debajo.
    - *Reps:* Selector vertical tipo ruleta o botones +/- de gran tamaño.
  - **Botón de Acción Base:** Botón ancho de "GUARDAR Y CONTINUAR" anclado en la parte inferior del bloque central.

## 2. Interacciones y Estados

- **Feedback de Selección:** Al tocar un valor de RPE o Dolor, el número seleccionado aparece brevemente en gran tamaño sobre el área central como confirmación visual.
- **Transición de Ejercicio:** Al completar un ejercicio, el bloque inferior se bloquea momentáneamente con un estado de "Éxito" mientras el video superior se desvanece suavemente para cargar la técnica del siguiente ejercicio.
- **Modales No Intrusivos:** La descripción técnica y las notas de seguridad se manejan mediante `Sheets` (hojas deslizantes) que no rompen el flujo de la sesión activa.

## 3. Consideraciones Técnicas (Stack)

- **Layout:** Tailwind CSS con clases de `h-[50vh]` y `overflow-hidden`.
- **Componentes:** Radix UI (Sheet) para información adicional.
- **Iconografía:** Lucide React (Info, Play, Pause, RotateCcw).
- **Tipografía:** Inter/Geist con énfasis en variantes Black/Italic para el branding inmersivo.
