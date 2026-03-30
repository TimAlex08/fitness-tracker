# Figma MCP Integration Rules

> Reference doc for translating Figma designs into this codebase.
> Keep in sync with `globals.css`, `components/ui/`, and `tailwind.config`.

---

## 1. Design Tokens

All tokens live in **`app/globals.css`** using CSS custom properties and Tailwind 4's `@theme inline` strategy. There is **no separate `tailwind.config.js`**.

### Color System — OKLCH

Colors use the **OKLCH color space**. Map Figma color styles to the nearest CSS variable, not raw hex.

```css
/* Light mode (:root) → Dark mode (.dark) */
--background:        oklch(1 0 0)          /* white */
--foreground:        oklch(0.145 0 0)       /* near-black */
--primary:           oklch(0.205 0 0)
--primary-foreground:oklch(0.985 0 0)
--secondary:         oklch(0.97 0 0)
--secondary-foreground: oklch(0.205 0 0)
--muted:             oklch(0.97 0 0)
--muted-foreground:  oklch(0.556 0 0)
--accent:            oklch(0.97 0 0)
--accent-foreground: oklch(0.205 0 0)
--destructive:       oklch(0.577 0.245 27.325) /* red */
--border:            oklch(0.922 0 0)
--input:             oklch(0.922 0 0)
--ring:              oklch(0.708 0 0)
--card:              oklch(1 0 0)
--card-foreground:   oklch(0.145 0 0)
--popover:           oklch(1 0 0)
--popover-foreground:oklch(0.145 0 0)
/* Data viz */
--chart-1 … --chart-5
/* Sidebar (dark bg) */
--sidebar:              oklch(0.205 0 0)
--sidebar-foreground:   oklch(0.985 0 0)
--sidebar-primary:      oklch(0.488 0.243 264.376) /* blue accent */
```

**Rule**: Use `bg-background`, `text-foreground`, `border-border`, etc. Never hardcode hex values.

### Radius

```css
--radius: 0.625rem   /* base = 10px */
/* Tailwind classes: rounded-sm rounded-md rounded-lg rounded-xl rounded-2xl rounded-3xl */
```

### Typography

| Variable | Font | Usage |
|---|---|---|
| `--font-geist-sans` | Geist | All body/UI text |
| `--font-geist-mono` | Geist Mono | Code, numbers, sets |

**Rule**: Use `font-sans` and `font-mono` Tailwind classes. Do not embed custom `font-family` in components.

---

## 2. Component Library

### Location
- **Base UI** (shadcn): `components/ui/*.tsx` — Button, Badge, Card, Input, Label, Textarea, Progress, Select, Separator, Sheet
- **Layout**: `components/layout/` — Sidebar, MobileHeader, BottomNav, SidebarNavLinks
- **Feature UI**: `features/*/components/`

### Variant System — CVA

All shadcn components use [Class Variance Authority](https://cva.style/). When mapping a Figma variant:

```tsx
// Pattern: map Figma component props → CVA variant names
import { cva } from "class-variance-authority"

const buttonVariants = cva("base classes", {
  variants: {
    variant: { default: "…", outline: "…", ghost: "…", secondary: "…", destructive: "…", link: "…" },
    size:    { default: "…", sm: "…", lg: "…", xs: "…", icon: "…" }
  },
  defaultVariants: { variant: "default", size: "default" }
})
```

### cn() Helper

Always use `cn()` from `lib/utils.ts` to merge classNames:

```tsx
import { cn } from "@/lib/utils"
<div className={cn("base", isActive && "bg-primary", className)} />
```

### Polymorphic Components (`asChild`)

Use the `asChild` prop (Radix Slot) to forward behavior to a child element:

```tsx
<Button asChild><Link href="/today">Start</Link></Button>
```

### Data Attributes for CSS Cascade

Components expose `data-slot`, `data-variant`, `data-size` for parent-driven styling:

```tsx
// Parent selects child by slot
<Card data-slot="card">
  <CardHeader data-slot="card-header">
```

---

## 3. Styling Approach

### Methodology: Utility-First (Tailwind 4)

No CSS Modules, no Styled Components. All styling via Tailwind utility classes.

### Global Styles

**File**: `app/globals.css`
- `@import "tailwindcss"` — Tailwind base/utilities
- `@theme inline { … }` — Maps CSS variables → Tailwind token names
- `@layer base { *, body, h1…h6 }` — Typography resets
- `:root { … }` / `.dark { … }` — Color token definitions

### Dark Mode

- **Strategy**: `.dark` class on `<html>` + `style={{ colorScheme: "dark" }}`
- Current app always renders in dark mode (see `app/layout.tsx`)
- Use semantic tokens (`bg-background` not `bg-white`) so dark mode just works

### Responsive — Mobile-First

| Breakpoint | Width | Used for |
|---|---|---|
| (default) | 0px+ | Mobile layout |
| `lg:` | 1024px+ | Desktop sidebar layout |

**Dual-layout pattern**:

```tsx
// Mobile only
<BottomNav className="lg:hidden" />
<MobileHeader className="lg:hidden" />

// Desktop only
<Sidebar className="hidden lg:flex" />
```

**Main content offset**:

```tsx
// Mobile: pb-20 (above bottom nav) | Desktop: ml-64 (beside sidebar)
<main className="lg:ml-64 pb-20 lg:pb-0">
```

### Advanced Tailwind Features in Use

```tsx
// Group variants
"group/button"
"group-data-[size=sm]/card:text-sm"

// Container queries
"@container/card-header"
"@[8rem]/card-header:flex-row"

// Has selector
"has-data-[icon=inline-end]:pr-2"

// Arbitrary CSS vars
"text-[var(--sidebar-foreground)]"
```

### Safe Area (Notched Devices)

```tsx
// Bottom nav safe area
style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
```

---

## 4. Figma → Code Mapping Workflow

### Step 1 — Get design context
```
get_design_context(fileKey, nodeId)
```
Returns code hints, screenshot, and Code Connect mappings.

### Step 2 — Identify existing components

Before generating new code, check if the design maps to an existing component:

| Figma element | Codebase component |
|---|---|
| Button (primary/secondary/ghost) | `components/ui/button.tsx` |
| Badge / Pill / Tag | `components/ui/badge.tsx` |
| Card / Panel | `components/ui/card.tsx` |
| Text input | `components/ui/input.tsx` |
| Dropdown select | `components/ui/select.tsx` |
| Progress bar | `components/ui/progress.tsx` |
| Divider / Rule | `components/ui/separator.tsx` |
| Drawer / Side panel | `components/ui/sheet.tsx` |
| Bottom sheet (mobile nav) | `components/layout/bottom-nav.tsx` |

### Step 3 — Map colors to semantic tokens

```
Figma fill #000000 → bg-foreground or text-foreground
Figma fill #FFFFFF → bg-background
Figma fill primary → bg-primary text-primary-foreground
Figma fill muted gray → bg-muted text-muted-foreground
Figma stroke → border-border
Figma red/error → text-destructive bg-destructive
```

### Step 4 — Apply layout patterns

```tsx
// Feature page layout
<div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
  <h1 className="text-2xl font-bold text-foreground">…</h1>
  <div className="grid gap-4 lg:grid-cols-2">
    <Card>…</Card>
  </div>
</div>
```

### Step 5 — Icons

Use **Lucide React** (v1.0.1) to match Figma icon names:

```tsx
import { Dumbbell, CalendarDays, BarChart2, BookOpen, Menu, Trash2 } from "lucide-react"
<Dumbbell className="size-4" aria-hidden="true" />
```

Browse available icons at: https://lucide.dev/icons/

---

## 5. Icon Naming Convention

| Context | Class | Size |
|---|---|---|
| Inline text | `size-4` | 16px |
| Button icon | `size-4` (default), `size-3.5` (sm) |
| Navigation | `size-5` |
| Card header | `size-5 lg:size-6` |
| Decorative | add `aria-hidden="true"` |

---

## 6. Asset Management

**Static assets**: `public/` — referenced as `/filename.ext`

**Remote images** (allowed in `next.config.ts`):
- `raw.githubusercontent.com/yuhonas/free-exercise-db/**`
- `wger.de/media/**`

**Usage with Next.js Image**:
```tsx
import Image from "next/image"
<Image src={exercise.imageUrl} alt={exercise.name} width={400} height={300} />
```

---

## 7. Component Architecture Rules

### Server vs Client

- **Server Components** (default): data fetching, layouts, static UI
- **Client Components** (`"use client"`): interactive state, animations, event handlers

```tsx
// Client component — only when needed
"use client"
import { useState } from "react"
```

### File Organization

When adding a new Figma-designed feature:

```
features/
└── <feature-name>/
    ├── components/    ← Figma-derived components go here
    ├── types/         ← TypeScript interfaces
    ├── api/           ← API call utilities
    └── schemas/       ← Zod validation
```

Shared UI components go in `components/ui/` only if they're reused across 2+ features.

### TypeScript

- Strict mode enabled. All props must be typed.
- Extend Prisma types from `types/index.ts` (do not re-define DB models)
- Common composite types: `ExerciseWithVariants`, `RoutineWithExercises`, `ProgramWithPhases`

---

## 8. Quick Reference Cheatsheet

```tsx
// Imports
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dumbbell } from "lucide-react"

// Semantic color classes
bg-background text-foreground
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground
bg-muted text-muted-foreground
bg-accent text-accent-foreground
bg-destructive text-destructive-foreground
border-border ring-ring

// Layout
lg:ml-64          // offset for desktop sidebar
pb-20 lg:pb-0     // bottom nav spacing
p-4 lg:p-6        // page padding

// Responsive visibility
hidden lg:flex    // desktop only
lg:hidden         // mobile only
```

---

*Last updated: 2026-03-30 | Stack: Next.js 16 · React 19 · Tailwind 4 · shadcn/ui · Lucide React · Prisma 7*
