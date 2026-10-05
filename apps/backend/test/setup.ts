import { prisma } from "@devforge/database"
import { beforeEach } from "vitest"

beforeEach(async () => {
  const dbName = new URL(process.env.DATABASE_URL!).pathname
  if (!/test/i.test(dbName)) throw new Error(`Refusing to truncate non-test DB: ${dbName}`)

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ")

  try {
    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
    }
  } catch (error) {
    console.log({ error })
  }
})
