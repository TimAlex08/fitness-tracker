# GEMINI.md

## Project Overview
**workout** is a comprehensive workout and exercise tracking application. It allows users to manage a catalog of exercises, log daily training sessions, track body measurements, and visualize progress. The application is built with a focus on high performance and clean architecture.

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **ORM:** Prisma 7
- **Database:** PostgreSQL (via `pg`)
- **Styling:** TailwindCSS 4 + Lucide React
- **Components:** shadcn/ui (Radix UI)
- **Language:** TypeScript

---

## Building and Running

### Prerequisites
- Node.js (Latest LTS recommended)
- PostgreSQL database instance

### Setup
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables:**
   Create a `.env` file in the root directory (based on project needs, typically `DATABASE_URL`).
3. **Database Initialization:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

### Development
Start the development server:
```bash
npm run dev
```

### Production
Build and start the production server:
```bash
npm run build
npm run start
```

---

## Development Conventions

### Architecture: Feature-Based + Repository Pattern
The project is organized by **features** located in the `features/` directory (e.g., `exercises`, `session`, `training`). Each feature typically contains:
- `api/`: Repository interfaces and Prisma implementations.
- `components/`: Feature-specific React components.
- `types/`: Domain-specific type definitions.
- `schemas/`: Validation schemas (e.g., Zod).

#### Data Access
- **Repositories:** All database interactions must go through a repository. Use interfaces to decouple the application logic from the data source.
- **Caching:** Use `unstable_cache` from `next/cache` for read operations in repositories to leverage Next.js's Data Cache.
- **Revalidation:** Use `revalidateTag` when performing mutations (create, update, delete) to ensure cache consistency.

### Coding Standards
- **TypeScript:** Strict typing is mandatory. Avoid `any`.
- **Naming:** 
  - Variables/Functions: `camelCase`
  - Components/Classes/Interfaces: `PascalCase`
  - Files: `kebab-case.ts` or `PascalCase.tsx` for components.
- **Styling:** Use TailwindCSS 4 utility classes. Prefer `shadcn/ui` components for common UI patterns.
- **Documentation:** 
  - Use **English** for all code symbols (variables, classes, functions, files).
  - Use **Spanish** for explanatory comments and internal documentation blocks to maintain consistency with the existing codebase.
- **Comments:** Use thematic separators for large blocks:
  ```typescript
  // ─── Section Name ─────────────────────────────────────────────────────────────
  ```

### Components
- Use **React Server Components (RSC)** by default.
- Use `'use client'` only when interactivity or browser APIs are required.
- Place shared layout components in `components/layout/`.
- Place generic UI primitives in `components/ui/`.

---

## Key Files
- `prisma/schema.prisma`: The source of truth for the data model.
- `config/app.config.ts`: Global application constants and settings.
- `lib/prisma.ts`: Singleton instance of the Prisma Client.
- `app/(app)/layout.tsx`: Main application shell (Sidebar + Header).
