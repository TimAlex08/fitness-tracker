import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  datasource: {
    // DATABASE_URL: URL directa (sin pooler) — usada por migraciones y Prisma Studio
    // DATABASE_URL_POOLED: URL con pooler — usada por el runtime de la app
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
})
