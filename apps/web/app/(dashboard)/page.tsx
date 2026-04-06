"use client"

import { useState } from "react"
import {
  Users,
  DollarSign,
  Clock,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Bot,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

const kpiCards = [
  {
    title: "Gross Generated MTD",
    value: "$142,800",
    change: "+12.3%",
    trend: "up" as const,
    icon: DollarSign,
    accent: "border-l-emerald-500",
  },
  {
    title: "Appt Show Rate",
    value: "73%",
    change: "+5.2%",
    trend: "up" as const,
    icon: Users,
    accent: "border-l-blue-500",
  },
  {
    title: "Avg Response Time",
    value: "4.2s",
    change: "-0.8s",
    trend: "up" as const,
    icon: Clock,
    accent: "border-l-purple-500",
  },
  {
    title: "Negotiation Compliance",
    value: "100%",
    change: "0 violations",
    trend: "up" as const,
    icon: ShieldCheck,
    accent: "border-l-amber-500",
  },
]

const pipelineStages = [
  { label: "Leads In", count: 47, color: "bg-gray-400" },
  { label: "AI Engaged", count: 38, color: "bg-blue-500" },
  { label: "Hot Intent", count: 14, color: "bg-amber-500" },
  { label: "Appt Set", count: 9, color: "bg-purple-500" },
  { label: "Closed", count: 6, color: "bg-emerald-500" },
]

const recentLeads = [
  {
    id: "1",
    name: "Sarah Johnson",
    type: "BUYER" as const,
    source: "Cars.com",
    vehicle: "2024 Toyota Camry XLE",
    intentScore: 85,
    status: "HOT" as const,
    agent: "NOVA" as const,
    estimatedGross: 320000,
    time: "2m ago",
  },
  {
    id: "2",
    name: "Mike Thompson",
    type: "SELLER" as const,
    source: "Website Chat",
    vehicle: "2021 Ford F-150 Lariat",
    intentScore: 72,
    status: "AI_ENGAGED" as const,
    agent: "AXEL" as const,
    estimatedGross: 450000,
    time: "8m ago",
  },
  {
    id: "3",
    name: "Jessica Chen",
    type: "BOTH" as const,
    source: "AutoTrader",
    vehicle: "2023 Honda CR-V",
    intentScore: 91,
    status: "APPOINTMENT_SET" as const,
    agent: "NOVA" as const,
    estimatedGross: 280000,
    time: "15m ago",
  },
  {
    id: "4",
    name: "Robert Davis",
    type: "SELLER" as const,
    source: "SMS Inbound",
    vehicle: "2020 Chevrolet Silverado",
    intentScore: 65,
    status: "AI_ENGAGED" as const,
    agent: "AXEL" as const,
    estimatedGross: 380000,
    time: "22m ago",
  },
  {
    id: "5",
    name: "Amanda Wilson",
    type: "BUYER" as const,
    source: "Facebook",
    vehicle: "2024 BMW X3",
    intentScore: 58,
    status: "NEW" as const,
    agent: "NOVA" as const,
    estimatedGross: 520000,
    time: "31m ago",
  },
]

const aiActivity = [
  { agent: "NOVA", action: "Sent appointment confirmation to Sarah Johnson", time: "1m ago", icon: MessageSquare },
  { agent: "AXEL", action: "Presented Round 2 offer ($18,500) to Mike Thompson", time: "3m ago", icon: DollarSign },
  { agent: "NOVA", action: "Detected trade-in mention from Jessica Chen — triggering Axel valuation", time: "8m ago", icon: Bot },
  { agent: "AXEL", action: "Competitor detected: CarMax ($19,200) — applying match rules", time: "12m ago", icon: ShieldCheck },
  { agent: "NOVA", action: "Qualified lead: Amanda Wilson — timeline: this week, budget: $45-50K", time: "18m ago", icon: Users },
]

function IntentBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-blue-500" : "bg-gray-400"
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-gray-200">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600">{score}</span>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: "bg-gray-100 text-gray-700",
    AI_ENGAGED: "bg-green-100 text-green-700",
    HOT: "bg-red-100 text-red-700",
    APPOINTMENT_SET: "bg-blue-100 text-blue-700",
    SHOWED: "bg-purple-100 text-purple-700",
    CLOSED_WON: "bg-emerald-100 text-emerald-700",
    CLOSED_LOST: "bg-gray-100 text-gray-500",
    STALE: "bg-yellow-100 text-yellow-700",
  }
  const labels: Record<string, string> = {
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
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", styles[status] || styles.NEW)}>
      {labels[status] || status}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  if (type === "BUYER") return <span className="text-xs font-semibold text-blue-600">BUY</span>
  if (type === "SELLER") return <span className="text-xs font-semibold text-amber-600">SELL</span>
  return <span className="text-xs font-semibold text-purple-600">BOTH</span>
}

function AgentBadge({ agent }: { agent: string }) {
  if (agent === "NOVA") return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600"><Bot className="h-3 w-3" />Nova</span>
  if (agent === "AXEL") return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><Bot className="h-3 w-3" />Axel</span>
  return <span className="text-xs text-gray-500">—</span>
}

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<"ops" | "intel">("ops")

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <Zap className="h-5 w-5 text-amber-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            Revenue at Risk: 3 hot leads haven&apos;t been contacted in 2+ hours
          </p>
          <p className="text-xs text-amber-600">Sarah Johnson, Mike Thompson, Jessica Chen — consider escalating to human agents</p>
        </div>
        <button className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700">
          Review
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <div key={kpi.title} className={cn("rounded-xl border-l-4 bg-white p-5 shadow-sm", kpi.accent)}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
              <kpi.icon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-gray-900">{kpi.value}</p>
            <div className="mt-1 flex items-center gap-1">
              {kpi.trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={cn("text-xs font-medium", kpi.trend === "up" ? "text-emerald-600" : "text-red-600")}>
                {kpi.change}
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Flow */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Live Pipeline Flow</h2>
        <div className="flex items-center justify-between">
          {pipelineStages.map((stage, i) => (
            <div key={stage.label} className="flex items-center">
              <div className="text-center">
                <div className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white", stage.color)}>
                  <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">{stage.count}</span>
                </div>
                <p className="mt-2 text-xs font-medium text-gray-600">{stage.label}</p>
              </div>
              {i < pipelineStages.length - 1 && (
                <div className="mx-3 flex items-center">
                  <div className="h-0.5 w-12 bg-gray-200 lg:w-20" />
                  <div className="h-0 w-0 border-y-4 border-l-6 border-y-transparent border-l-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Lead Feed */}
        <div className="xl:col-span-2">
          <div className="rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Live Lead Feed</h2>
              <div className="flex items-center gap-2">
                <button className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200">All</button>
                <button className="rounded-md px-2 py-1 text-xs font-medium text-gray-400 hover:bg-gray-100">Buyers</button>
                <button className="rounded-md px-2 py-1 text-xs font-medium text-gray-400 hover:bg-gray-100">Sellers</button>
              </div>
            </div>
            <div className="divide-y">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                      <TypeBadge type={lead.type} />
                      <StatusPill status={lead.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{lead.vehicle} · {lead.source}</p>
                  </div>
                  <IntentBar score={lead.intentScore} />
                  <AgentBadge agent={lead.agent} />
                  <div className="text-right">
                    <p className="font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-gray-900">
                      ${(lead.estimatedGross / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">{lead.time}</p>
                  </div>
                  <button className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* ROI Widget */}
          <div className="rounded-xl bg-gradient-to-br from-[#6C2BD9] to-[#5B21B6] p-6 text-white shadow-sm">
            <h3 className="text-sm font-medium text-purple-200">ROI This Month</h3>
            <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-4xl font-bold">12.4x</p>
            <p className="mt-1 text-sm text-purple-200">$142,800 generated / $11,500 platform cost</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-purple-300">BDC Hours Saved</p>
                <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">186h</p>
              </div>
              <div>
                <p className="text-xs text-purple-300">Guardian Savings</p>
                <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">$24,600</p>
              </div>
            </div>
          </div>

          {/* AI Activity Feed */}
          <div className="rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">AI Activity</h3>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">LIVE</span>
              </div>
            </div>
            <div className="divide-y">
              {aiActivity.map((activity, i) => (
                <div key={i} className="flex gap-3 px-4 py-3">
                  <div className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    activity.agent === "NOVA" ? "bg-blue-100" : "bg-amber-100"
                  )}>
                    <activity.icon className={cn("h-3.5 w-3.5", activity.agent === "NOVA" ? "text-blue-600" : "text-amber-600")} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
