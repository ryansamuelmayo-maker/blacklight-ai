"use client"

import { useState } from "react"
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  Bot,
  ArrowUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

type LeadStatus = "NEW" | "AI_ENGAGED" | "HOT" | "APPOINTMENT_SET" | "SHOWED" | "CLOSED_WON" | "CLOSED_LOST" | "STALE"
type LeadType = "BUYER" | "SELLER" | "BOTH"

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  type: LeadType
  source: string
  vehicle: string
  intentScore: number
  status: LeadStatus
  agent: string
  estimatedGross: number
  createdAt: string
}

const sampleLeads: Lead[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah@email.com", phone: "(555) 123-4567", type: "BUYER", source: "Cars.com", vehicle: "2024 Toyota Camry XLE", intentScore: 85, status: "HOT", agent: "NOVA", estimatedGross: 320000, createdAt: "2024-01-15T10:30:00Z" },
  { id: "2", name: "Mike Thompson", email: "mike@email.com", phone: "(555) 234-5678", type: "SELLER", source: "Website Chat", vehicle: "2021 Ford F-150 Lariat", intentScore: 72, status: "AI_ENGAGED", agent: "AXEL", estimatedGross: 450000, createdAt: "2024-01-15T09:15:00Z" },
  { id: "3", name: "Jessica Chen", email: "jessica@email.com", phone: "(555) 345-6789", type: "BOTH", source: "AutoTrader", vehicle: "2023 Honda CR-V Touring", intentScore: 91, status: "APPOINTMENT_SET", agent: "NOVA", estimatedGross: 280000, createdAt: "2024-01-15T08:00:00Z" },
  { id: "4", name: "Robert Davis", email: "robert@email.com", phone: "(555) 456-7890", type: "SELLER", source: "SMS Inbound", vehicle: "2020 Chevrolet Silverado 1500", intentScore: 65, status: "AI_ENGAGED", agent: "AXEL", estimatedGross: 380000, createdAt: "2024-01-14T16:30:00Z" },
  { id: "5", name: "Amanda Wilson", email: "amanda@email.com", phone: "(555) 567-8901", type: "BUYER", source: "Facebook", vehicle: "2024 BMW X3 xDrive30i", intentScore: 58, status: "NEW", agent: "NOVA", estimatedGross: 520000, createdAt: "2024-01-14T14:00:00Z" },
  { id: "6", name: "James Brown", email: "james@email.com", phone: "(555) 678-9012", type: "BUYER", source: "CarGurus", vehicle: "2024 Honda Civic Sport", intentScore: 44, status: "NEW", agent: "NOVA", estimatedGross: 220000, createdAt: "2024-01-14T11:45:00Z" },
  { id: "7", name: "Patricia Martinez", email: "patricia@email.com", phone: "(555) 789-0123", type: "SELLER", source: "Email ADF", vehicle: "2019 Toyota RAV4 Limited", intentScore: 78, status: "HOT", agent: "AXEL", estimatedGross: 310000, createdAt: "2024-01-14T09:00:00Z" },
  { id: "8", name: "David Lee", email: "david@email.com", phone: "(555) 890-1234", type: "BUYER", source: "Walk-in", vehicle: "2024 Hyundai Tucson SEL", intentScore: 92, status: "SHOWED", agent: "NOVA", estimatedGross: 260000, createdAt: "2024-01-13T15:30:00Z" },
]

function StatusPill({ status }: { status: LeadStatus }) {
  const styles: Record<LeadStatus, string> = {
    NEW: "bg-gray-100 text-gray-700",
    AI_ENGAGED: "bg-green-100 text-green-700",
    HOT: "bg-red-100 text-red-700",
    APPOINTMENT_SET: "bg-blue-100 text-blue-700",
    SHOWED: "bg-purple-100 text-purple-700",
    CLOSED_WON: "bg-emerald-100 text-emerald-700",
    CLOSED_LOST: "bg-gray-100 text-gray-500",
    STALE: "bg-yellow-100 text-yellow-700",
  }
  const labels: Record<LeadStatus, string> = {
    NEW: "New",
    AI_ENGAGED: "Engaged",
    HOT: "Hot",
    APPOINTMENT_SET: "Appt Set",
    SHOWED: "Showed",
    CLOSED_WON: "Won",
    CLOSED_LOST: "Lost",
    STALE: "Stale",
  }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  )
}

function IntentBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-blue-500" : "bg-gray-400"
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-gray-200">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold text-gray-600">{score}</span>
    </div>
  )
}

export default function LeadsPage() {
  const [filter, setFilter] = useState<"ALL" | LeadType>("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | LeadStatus>("ALL")

  const filtered = sampleLeads.filter((l) => {
    if (filter !== "ALL" && l.type !== filter) return false
    if (statusFilter !== "ALL" && l.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">{sampleLeads.length} total leads · {sampleLeads.filter(l => l.status === "HOT").length} hot</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#6C2BD9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6] transition-colors">
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-[#6C2BD9] focus:outline-none focus:ring-1 focus:ring-[#6C2BD9]"
          />
        </div>

        <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
          {(["ALL", "BUYER", "SELLER", "BOTH"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === t ? "bg-[#6C2BD9] text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {t === "ALL" ? "All" : t === "BUYER" ? "Buyers" : t === "SELLER" ? "Sellers" : "Both"}
            </button>
          ))}
        </div>

        <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
          <Filter className="h-3.5 w-3.5" />
          Status
          <ChevronDown className="h-3 w-3" />
        </button>

        <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <button className="flex items-center gap-1 hover:text-gray-700">Lead <ArrowUpDown className="h-3 w-3" /></button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vehicle</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Intent</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Agent</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Est. Gross</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.email} · {lead.source}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={cn(
                    "text-xs font-bold",
                    lead.type === "BUYER" ? "text-blue-600" : lead.type === "SELLER" ? "text-amber-600" : "text-purple-600"
                  )}>
                    {lead.type === "BUYER" ? "BUY" : lead.type === "SELLER" ? "SELL" : "BOTH"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-700">{lead.vehicle}</p>
                </td>
                <td className="px-4 py-4">
                  <IntentBar score={lead.intentScore} />
                </td>
                <td className="px-4 py-4">
                  <StatusPill status={lead.status} />
                </td>
                <td className="px-4 py-4">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    lead.agent === "NOVA" ? "text-blue-600" : "text-amber-600"
                  )}>
                    <Bot className="h-3 w-3" />
                    {lead.agent === "NOVA" ? "Nova" : "Axel"}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-gray-900">
                    ${(lead.estimatedGross / 100).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <button className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
