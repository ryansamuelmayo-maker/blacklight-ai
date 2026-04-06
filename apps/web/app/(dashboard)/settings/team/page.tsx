"use client"

import { Plus, MoreHorizontal, Mail, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const users = [
  { id: "1", name: "John Miller", email: "john@premierauto.com", role: "OWNER", phone: "(555) 100-0001", isActive: true, lastActive: "Online now" },
  { id: "2", name: "Sarah Williams", email: "sarah.w@premierauto.com", role: "MANAGER", phone: "(555) 100-0002", isActive: true, lastActive: "5 minutes ago" },
  { id: "3", name: "Michael Chen", email: "m.chen@premierauto.com", role: "AGENT", phone: "(555) 100-0003", isActive: true, lastActive: "2 hours ago" },
  { id: "4", name: "Emily Davis", email: "e.davis@premierauto.com", role: "AGENT", phone: "(555) 100-0004", isActive: true, lastActive: "1 day ago" },
  { id: "5", name: "Alex Johnson", email: "a.johnson@premierauto.com", role: "VIEWER", phone: null, isActive: false, lastActive: "2 weeks ago" },
]

const roleStyles: Record<string, { label: string; color: string }> = {
  OWNER: { label: "Owner", color: "bg-purple-100 text-purple-700" },
  MANAGER: { label: "Manager", color: "bg-blue-100 text-blue-700" },
  AGENT: { label: "Agent", color: "bg-emerald-100 text-emerald-700" },
  VIEWER: { label: "Viewer", color: "bg-gray-100 text-gray-600" },
}

export default function TeamPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500">{users.filter(u => u.isActive).length} active members</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-[#6C2BD9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6]">
          <Plus className="h-4 w-4" /> Invite Member
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="divide-y">
          {users.map((user) => {
            const role = roleStyles[user.role]
            return (
              <div key={user.id} className={cn("flex items-center gap-4 px-6 py-4", !user.isActive && "opacity-50")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                  {user.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", role.color)}>{role.label}</span>
                    {!user.isActive && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">Inactive</span>}
                  </div>
                  <p className="text-xs text-gray-500">{user.email} {user.phone ? `· ${user.phone}` : ""}</p>
                </div>
                <span className="text-xs text-gray-400">{user.lastActive}</span>
                <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Roles Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
          <Shield className="h-4 w-4 text-gray-400" /> Role Permissions
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-3"><span className="font-bold text-purple-700 w-16">Owner</span><span className="text-gray-600">Full access. Manage billing, delete dealership, all manager permissions.</span></div>
          <div className="flex items-start gap-3"><span className="font-bold text-blue-700 w-16">Manager</span><span className="text-gray-600">Approve negotiations, manage team, configure agents, view all data.</span></div>
          <div className="flex items-start gap-3"><span className="font-bold text-emerald-700 w-16">Agent</span><span className="text-gray-600">Handle leads, take over conversations, view assigned data.</span></div>
          <div className="flex items-start gap-3"><span className="font-bold text-gray-600 w-16">Viewer</span><span className="text-gray-600">Read-only access to dashboard and analytics.</span></div>
        </div>
      </div>
    </div>
  )
}
