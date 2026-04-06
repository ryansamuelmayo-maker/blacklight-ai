"use client"

import { useState } from "react"
import { Bell, ChevronDown, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopbarProps {
  title?: string
}

export function Topbar({ title = "Dashboard" }: TopbarProps) {
  const [activeMode, setActiveMode] = useState<"ops" | "intel">("ops")
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      {/* Left: Page title */}
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* OPS / INTEL toggle */}
        <div className="flex rounded-lg border border-border bg-gray-50 p-0.5">
          <button
            onClick={() => setActiveMode("ops")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold tracking-wider transition-colors",
              activeMode === "ops"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-gray-700"
            )}
          >
            OPS
          </button>
          <button
            onClick={() => setActiveMode("intel")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-bold tracking-wider transition-colors",
              activeMode === "intel"
                ? "bg-info text-white shadow-sm"
                : "text-muted hover:text-gray-700"
            )}
          >
            INTEL
          </button>
        </div>

        {/* LIVE badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-bold tracking-wider text-success">LIVE</span>
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-muted transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-white">
              JD
            </div>
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>

          {showUserMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              {/* Menu */}
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <div className="my-1 border-t border-border" />
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-gray-50">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
