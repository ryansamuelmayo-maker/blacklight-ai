"use client"

import { Bot, DollarSign, Clock, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

type Stage = "NEW" | "AI_ENGAGED" | "HOT" | "APPOINTMENT_SET" | "SHOWED" | "CLOSED_WON"

const stageConfig: Record<Stage, { label: string; color: string; bgColor: string }> = {
  NEW: { label: "New", color: "text-gray-600", bgColor: "bg-gray-100" },
  AI_ENGAGED: { label: "AI Engaged", color: "text-blue-600", bgColor: "bg-blue-100" },
  HOT: { label: "Hot Intent", color: "text-red-600", bgColor: "bg-red-100" },
  APPOINTMENT_SET: { label: "Appt Set", color: "text-purple-600", bgColor: "bg-purple-100" },
  SHOWED: { label: "Showed", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  CLOSED_WON: { label: "Closed Won", color: "text-emerald-600", bgColor: "bg-emerald-100" },
}

interface PipelineLead {
  id: string
  name: string
  vehicle: string
  type: "BUYER" | "SELLER" | "BOTH"
  agent: "NOVA" | "AXEL"
  estimatedGross: number
  intentScore: number
  lastActivity: string
}

const pipelineData: Record<Stage, PipelineLead[]> = {
  NEW: [
    { id: "5", name: "Amanda Wilson", vehicle: "2024 BMW X3", type: "BUYER", agent: "NOVA", estimatedGross: 520000, intentScore: 58, lastActivity: "31m ago" },
    { id: "6", name: "James Brown", vehicle: "2024 Honda Civic", type: "BUYER", agent: "NOVA", estimatedGross: 220000, intentScore: 44, lastActivity: "1h ago" },
  ],
  AI_ENGAGED: [
    { id: "2", name: "Mike Thompson", vehicle: "2021 F-150 Lariat", type: "SELLER", agent: "AXEL", estimatedGross: 450000, intentScore: 72, lastActivity: "5m ago" },
    { id: "4", name: "Robert Davis", vehicle: "2020 Silverado", type: "SELLER", agent: "AXEL", estimatedGross: 380000, intentScore: 65, lastActivity: "22m ago" },
    { id: "9", name: "Chris Martin", vehicle: "2023 Mazda CX-5", type: "BUYER", agent: "NOVA", estimatedGross: 310000, intentScore: 61, lastActivity: "45m ago" },
  ],
  HOT: [
    { id: "1", name: "Sarah Johnson", vehicle: "2024 Camry XLE", type: "BUYER", agent: "NOVA", estimatedGross: 320000, intentScore: 85, lastActivity: "2m ago" },
    { id: "7", name: "Patricia Martinez", vehicle: "2019 RAV4 Limited", type: "SELLER", agent: "AXEL", estimatedGross: 310000, intentScore: 78, lastActivity: "15m ago" },
  ],
  APPOINTMENT_SET: [
    { id: "3", name: "Jessica Chen", vehicle: "2023 Honda CR-V", type: "BOTH", agent: "NOVA", estimatedGross: 280000, intentScore: 91, lastActivity: "12m ago" },
    { id: "10", name: "Emily Rodriguez", vehicle: "2024 Hyundai Palisade", type: "BUYER", agent: "NOVA", estimatedGross: 420000, intentScore: 88, lastActivity: "2h ago" },
  ],
  SHOWED: [
    { id: "8", name: "David Lee", vehicle: "2024 Tucson SEL", type: "BUYER", agent: "NOVA", estimatedGross: 260000, intentScore: 92, lastActivity: "3h ago" },
  ],
  CLOSED_WON: [
    { id: "11", name: "Tom Wilson", vehicle: "2022 BMW X5", type: "SELLER", agent: "AXEL", estimatedGross: 350000, intentScore: 95, lastActivity: "1d ago" },
    { id: "12", name: "Lisa Park", vehicle: "2024 Corolla LE", type: "BUYER", agent: "NOVA", estimatedGross: 180000, intentScore: 97, lastActivity: "1d ago" },
  ],
}

function KanbanCard({ lead }: { lead: PipelineLead }) {
  return (
    <div className="group rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-all cursor-grab">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
          <p className="text-xs text-gray-500">{lead.vehicle}</p>
        </div>
        <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-bold",
            lead.type === "BUYER" ? "text-blue-600" : lead.type === "SELLER" ? "text-amber-600" : "text-purple-600"
          )}>
            {lead.type === "BUYER" ? "BUY" : lead.type === "SELLER" ? "SELL" : "BOTH"}
          </span>
          <span className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-medium",
            lead.agent === "NOVA" ? "text-blue-500" : "text-amber-500"
          )}>
            <Bot className="h-2.5 w-2.5" /> {lead.agent === "NOVA" ? "Nova" : "Axel"}
          </span>
        </div>
        <span className="font-[family-name:var(--font-space-grotesk)] text-xs font-bold text-gray-700">
          ${(lead.estimatedGross / 100).toLocaleString()}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-12 rounded-full bg-gray-200">
            <div
              className={cn(
                "h-full rounded-full",
                lead.intentScore >= 80 ? "bg-emerald-500" : lead.intentScore >= 60 ? "bg-amber-500" : "bg-blue-500"
              )}
              style={{ width: `${lead.intentScore}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400">{lead.intentScore}</span>
        </div>
        <span className="text-[10px] text-gray-400">{lead.lastActivity}</span>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const stages = Object.keys(pipelineData) as Stage[]
  const totalGross = Object.values(pipelineData)
    .flat()
    .reduce((sum, l) => sum + l.estimatedGross, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Pipeline</h1>
          <p className="text-sm text-gray-500">
            {Object.values(pipelineData).flat().length} leads ·{" "}
            <span className="font-[family-name:var(--font-space-grotesk)] font-semibold">${(totalGross / 100).toLocaleString()}</span> total estimated gross
          </p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const config = stageConfig[stage]
          const leads = pipelineData[stage]
          const stageGross = leads.reduce((sum, l) => sum + l.estimatedGross, 0)

          return (
            <div key={stage} className="min-w-[280px] flex-shrink-0">
              <div className={cn("mb-3 rounded-lg px-3 py-2", config.bgColor)}>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-bold uppercase tracking-wider", config.color)}>
                    {config.label}
                  </span>
                  <span className={cn("flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold", config.bgColor, config.color)}>
                    {leads.length}
                  </span>
                </div>
                <p className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold text-gray-600 mt-0.5">
                  ${(stageGross / 100).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                {leads.map((lead) => (
                  <KanbanCard key={lead.id} lead={lead} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
