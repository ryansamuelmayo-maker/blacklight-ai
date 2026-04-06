"use client"

import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  GitBranch,
  Handshake,
  ShieldCheck,
  BarChart3,
  Database,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Conversations", href: "/conversations", icon: MessageSquare },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
  { label: "Negotiations", href: "/negotiations", icon: Handshake },
  { label: "Approvals", href: "/approvals", icon: ShieldCheck, badge: 3 },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Data Vault", href: "/data-vault", icon: Database },
]

const bottomNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  currentPath: string
  dealershipName?: string
}

export function Sidebar({ currentPath, dealershipName = "Blacklight Motors" }: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-white">
      {/* Logo / Branding */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 2L3 6v8l7 4 7-4V6l-7-4z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M10 7a3 3 0 100 6 3 3 0 000-6z"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-wide text-white">
            Blacklight AI
          </p>
          <p className="truncate text-xs text-white/50">{dealershipName}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10" />

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {mainNav.map((item) => {
          const isActive =
            currentPath === item.href ||
            currentPath.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-light/20 text-white"
                  : "text-white/60 hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-brand-light" : "text-white/40 group-hover:text-white/70"
                )}
              />
              <span className="truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom navigation */}
      <div className="space-y-1 px-3 pb-2">
        {bottomNav.map((item) => {
          const isActive =
            currentPath === item.href ||
            currentPath.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-light/20 text-white"
                  : "text-white/60 hover:bg-sidebar-hover hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-brand-light" : "text-white/40 group-hover:text-white/70"
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10" />

      {/* User section */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-white">
          JD
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">John Doe</p>
          <p className="truncate text-xs text-white/40">Desk Manager</p>
        </div>
      </div>
    </aside>
  )
}
