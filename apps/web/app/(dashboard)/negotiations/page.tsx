"use client"

import { Bot, ArrowRight, ShieldCheck, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const negotiations = [
  {
    id: "1",
    customer: "Mike Thompson",
    vehicle: "2021 Ford F-150 Lariat",
    vin: "1FTFW1E8...4321",
    status: "ACTIVE" as const,
    currentRound: 2,
    maxRounds: 5,
    anchorAmount: 2200000,
    currentOffer: 1850000,
    dealerCeiling: 2200000,
    customerCounter: 2100000,
    profile: "Trucks Aggressive",
    competitorDetected: "CarMax",
    guardianCompliant: true,
  },
  {
    id: "2",
    customer: "Robert Davis",
    vehicle: "2020 Chevrolet Silverado 1500",
    vin: "3GCUYGE7...8765",
    status: "PENDING_APPROVAL" as const,
    currentRound: 4,
    maxRounds: 5,
    anchorAmount: 2800000,
    currentOffer: 2650000,
    dealerCeiling: 2800000,
    customerCounter: 2900000,
    profile: "Trucks Aggressive",
    competitorDetected: null,
    guardianCompliant: true,
  },
  {
    id: "3",
    customer: "Patricia Martinez",
    vehicle: "2019 Toyota RAV4 Limited",
    vin: "2T3W1RFV...5432",
    status: "ACTIVE" as const,
    currentRound: 1,
    maxRounds: 5,
    anchorAmount: 2100000,
    currentOffer: 1785000,
    dealerCeiling: 2100000,
    customerCounter: null,
    profile: "Sedans Conservative",
    competitorDetected: null,
    guardianCompliant: true,
  },
  {
    id: "4",
    customer: "Tom Wilson",
    vehicle: "2022 BMW X5 xDrive40i",
    vin: "5UXCR6C0...1234",
    status: "CLOSED_WON" as const,
    currentRound: 3,
    maxRounds: 5,
    anchorAmount: 4500000,
    currentOffer: 4150000,
    dealerCeiling: 4500000,
    customerCounter: 4200000,
    profile: "Luxury Premium",
    competitorDetected: "Carvana",
    guardianCompliant: true,
  },
  {
    id: "5",
    customer: "Linda Garcia",
    vehicle: "2020 Honda Civic EX",
    vin: "19XFC2F6...9876",
    status: "CLOSED_LOST" as const,
    currentRound: 5,
    maxRounds: 5,
    anchorAmount: 1600000,
    currentOffer: 1520000,
    dealerCeiling: 1600000,
    customerCounter: 1800000,
    profile: "Sedans Conservative",
    competitorDetected: "CarMax",
    guardianCompliant: true,
  },
]

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  CONFIGURING: { label: "Configuring", color: "bg-gray-100 text-gray-700", icon: Clock },
  ACTIVE: { label: "Active", color: "bg-blue-100 text-blue-700", icon: Bot },
  PENDING_APPROVAL: { label: "Needs Approval", color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
  CLOSED_WON: { label: "Won", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  CLOSED_LOST: { label: "Lost", color: "bg-red-100 text-red-700", icon: XCircle },
  EXPIRED: { label: "Expired", color: "bg-gray-100 text-gray-500", icon: Clock },
  ESCALATED: { label: "Escalated", color: "bg-red-100 text-red-700", icon: AlertTriangle },
}

function OfferRangeBar({ current, ceiling, anchor }: { current: number; ceiling: number; anchor: number }) {
  const pct = Math.min(100, Math.round((current / ceiling) * 100))
  const green = 70
  const yellow = 90
  return (
    <div className="w-full">
      <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="bg-emerald-400" style={{ width: `${green}%` }} />
          <div className="bg-amber-400" style={{ width: `${yellow - green}%` }} />
          <div className="bg-red-400" style={{ width: `${100 - yellow}%` }} />
        </div>
        <div
          className="absolute top-0 h-full w-0.5 bg-gray-900"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>${(anchor * 0.85 / 100).toLocaleString()}</span>
        <span className="font-medium text-gray-600">${(current / 100).toLocaleString()}</span>
        <span>${(ceiling / 100).toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function NegotiationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Negotiations</h1>
          <p className="text-sm text-gray-500">
            {negotiations.filter(n => n.status === "ACTIVE" || n.status === "PENDING_APPROVAL").length} active ·{" "}
            {negotiations.filter(n => n.status === "PENDING_APPROVAL").length} awaiting approval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-600">100% Guardian Compliant</span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer / Vehicle</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Round</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 min-w-[200px]">Offer Range</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Profile</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Competitor</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {negotiations.map((neg) => {
              const sc = statusConfig[neg.status]
              return (
                <tr key={neg.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{neg.customer}</p>
                    <p className="text-xs text-gray-500">{neg.vehicle} · {neg.vin}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", sc.color)}>
                      <sc.icon className="h-3 w-3" />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-gray-900">
                      {neg.currentRound}/{neg.maxRounds}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <OfferRangeBar current={neg.currentOffer} ceiling={neg.dealerCeiling} anchor={neg.anchorAmount} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-medium text-gray-600">{neg.profile}</span>
                  </td>
                  <td className="px-4 py-4">
                    {neg.competitorDetected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {neg.competitorDetected}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      View <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
