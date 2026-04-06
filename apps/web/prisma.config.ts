import path from "node:path"
// @ts-expect-error — Prisma config types may not be fully resolved at build time
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrate: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/blacklight",
  },
})
