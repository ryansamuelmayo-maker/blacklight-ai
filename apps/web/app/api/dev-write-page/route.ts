import { NextResponse } from "next/server"
import { writeFileSync } from "fs"
import { join } from "path"

// DEV-ONLY route: writes the updated negotiations page to disk for HMR.
// Delete before production deploy.
export async function GET() {
    if (process.env.NODE_ENV !== "development") {
          return NextResponse.json({ error: "dev only" }, { status: 403 })
        }
    try {
          const target = join(process.cwd(), "app", "(dashboard)", "negotiations", "page.tsx")
          // Signal the dev server to pull from git
          const { execSync } = await import("child_process")
          execSync(`cd ${process.cwd()} && git pull origin main`, { encoding: "utf-8" })
          return NextResponse.json({ ok: true, message: "Pulled latest from main branch. HMR will pick up changes." })
        } catch (e: unknown) {
          return NextResponse.json({ error: String(e) }, { status: 500 })
        }
  }
