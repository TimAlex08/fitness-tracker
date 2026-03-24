/**
 * update-exercise-images.ts
 *
 * Actualiza imageUrl de los ejercicios existentes en la BD
 * sin borrar ningún otro dato (logs, programas, etc.).
 *
 * Uso: npx tsx scripts/update-exercise-images.ts
 */

import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"

const IMAGES: Record<string, string> = {
  "cat-cow":                     `${BASE}/Cat_Stretch/0.jpg`,
  "book-opener":                 `${BASE}/Side-Lying_Floor_Stretch/0.jpg`,
  "estiramiento-flexor-cadera":  `${BASE}/Kneeling_Hip_Flexor/0.jpg`,
  "hip-switches-90-90":          `${BASE}/90_90_Hamstring/0.jpg`,
  "chin-tucks":                  `${BASE}/Chin_To_Chest_Stretch/0.jpg`,
  "retracciones-escapulares":    `${BASE}/Scapular_Pull-Up/0.jpg`,
  "basculacion-pelvica-posterior": `${BASE}/Pelvic_Tilt_Into_Bridge/0.jpg`,
  "childs-pose":                 `${BASE}/Childs_Pose/0.jpg`,
  "flexiones-inclinadas":        `${BASE}/Incline_Push-Up/0.jpg`,
  "flexiones-estandar":          `${BASE}/Pushups/0.jpg`,
  "sentadilla-asistida":         `${BASE}/Goblet_Squat/0.jpg`,
  "elevaciones-pronadas-ytw":    `${BASE}/Superman/0.jpg`,
  "puente-de-gluteos":           `${BASE}/Single_Leg_Glute_Bridge/0.jpg`,
  "dead-bug-solo-brazos":        `${BASE}/Dead_Bug/0.jpg`,
  "mcgill-curl-up":              `${BASE}/Crunches/0.jpg`,
}

async function main() {
  console.log("🖼️  Actualizando imágenes de ejercicios...")
  let updated = 0
  let notFound = 0

  for (const [slug, imageUrl] of Object.entries(IMAGES)) {
    const result = await prisma.exercise.updateMany({
      where: { slug },
      data: { imageUrl },
    })

    if (result.count > 0) {
      console.log(`   ✓ ${slug}`)
      updated++
    } else {
      console.log(`   ⚠ no encontrado: ${slug}`)
      notFound++
    }
  }

  console.log(`\n✅ ${updated} ejercicios actualizados, ${notFound} no encontrados.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
