"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/conversations": "Conversations",
  "/pipeline": "Pipeline",
  "/negotiations": "Negotiations",
  "/approvals": "Approvals",
  "/analytics": "Analytics",
  "/data-vault": "Data Vault",
  "/settings": "Settings",
}

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return title
    }
  }
  return "Dashboard"
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPath={pathname} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
