"use client"

import { useState } from "react"
import { AlertTriangle, ShieldCheck, Clock, CheckCircle2, XCircle, DollarSign, Car, User } from "lucide-react"
import { cn } from "@/lib/utils"

const approvals = [
  {
    id: "1",
    customer: "Robert Davis",
    vehicle: "2020 Chevrolet Silverado 1500",
    type: "COMPETITOR_MATCH" as const,
    requestedAmount: 2900000,
    currentCeiling: 2800000,
    reason: "Customer insists CarMax offered $29,000. Requesting ceiling override to match at $29,000 to close the deal. Current offer is $26,500 (Round 4/5).",
    status: "PENDING" as const,
    urgency: "high" as const,
    createdAt: "8 minutes ago",
    negotiationRound: 4,
    maxRounds: 5,
    currentOffer: 2650000,
    competitorOffer: 2900000,
    competitorName: "CarMax",
  },
  {
    id: "2",
    customer: "James Wilson",
    vehicle: "2022 Tesla Model Y Long Range",
    type: "CEILING_OVERRIDE" as const,
    requestedAmount: 3800000,
    currentCeiling: 3500000,
    reason: "High-demand vehicle with low mileage (12,400 mi). Market data suggests this vehicle will move quickly at $38,000. Requesting ceiling increase for fast acquisition.",
    status: "PENDING" as const,
    urgency: "medium" as const,
    createdAt: "23 minutes ago",
    negotiationRound: 3,
    maxRounds: 5,
    currentOffer: 3200000,
    competitorOffer: null,
    competitorName: null,
  },
  {
    id: "3",
    customer: "Karen Lee",
    vehicle: "2019 Lexus RX 350",
    type: "FINAL_BUMP_EXCEED" as const,
    requestedAmount: 2680000,
    currentCeiling: 2600000,
    reason: "Customer declined final bump of $25,500. Requesting additional $800 over ceiling to close. Vehicle is in excellent condition and high retail demand.",
    status: "APPROVED" as const,
    urgency: "low" as const,
    createdAt: "1 hour ago",
    negotiationRound: 5,
    maxRounds: 5,
    currentOffer: 2550000,
    competitorOffer: null,
    competitorName: null,
    respondedBy: "John Miller",
    respondedAt: "45 minutes ago",
  },
]

const typeLabels: Record<string, { label: string; color: string }> = {
  CEILING_OVERRIDE: { label: "Ceiling Override", color: "bg-red-100 text-red-700" },
  COMPETITOR_MATCH: { label: "Competitor Match", color: "bg-amber-100 text-amber-700" },
  FINAL_BUMP_EXCEED: { label: "Final Bump Exceed", color: "bg-purple-100 text-purple-700" },
  MANUAL_REVIEW: { label: "Manual Review", color: "bg-blue-100 text-blue-700" },
}

export default function ApprovalsPage() {
  const [counterAmount, setCounterAmount] = useState<Record<string, string>>({})

  const pending = approvals.filter(a => a.status === "PENDING")
  const resolved = approvals.filter(a => a.status !== "PENDING")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-sm text-gray-500">{pending.length} pending · {resolved.length} resolved today</p>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-600">
            <AlertTriangle className="h-4 w-4" /> Pending Approval ({pending.length})
          </h2>
          {pending.map((approval) => {
            const typeInfo = typeLabels[approval.type]
            return (
              <div key={approval.id} className={cn(
                "rounded-xl border-2 bg-white p-6 shadow-sm",
                approval.urgency === "high" ? "border-red-300" : approval.urgency === "medium" ? "border-amber-300" : "border-gray-200"
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{approval.customer}</h3>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", typeInfo.color)}>{typeInfo.label}</span>
                      {approval.urgency === "high" && (
                        <span className="animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">URGENT</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5" /> {approval.vehicle}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{approval.createdAt}</span>
                </div>

                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{approval.reason}</p>

                <div className="grid grid-cols-2 gap-4 mb-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500">Current Ceiling</p>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">${(approval.currentCeiling / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Requested</p>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-red-600">${(approval.requestedAmount / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Over Ceiling</p>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-red-600">+${((approval.requestedAmount - approval.currentCeiling) / 100).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Round</p>
                    <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">{approval.negotiationRound}/{approval.maxRounds}</p>
                  </div>
                </div>

                {approval.competitorName && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700">Competitor: {approval.competitorName} at ${approval.competitorOffer ? (approval.competitorOffer / 100).toLocaleString() : "unknown"}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <button className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                    <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
                    Approve ${(approval.requestedAmount / 100).toLocaleString()}
                  </button>
                  <button className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                    <XCircle className="mr-1.5 inline h-4 w-4" />
                    Deny
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Counter:</span>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={counterAmount[approval.id] || ""}
                        onChange={(e) => setCounterAmount(prev => ({ ...prev, [approval.id]: e.target.value }))}
                        placeholder="Amount"
                        className="w-32 rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm focus:border-[#6C2BD9] focus:outline-none"
                      />
                    </div>
                    <button className="rounded-lg border border-[#6C2BD9] px-4 py-2 text-sm font-medium text-[#6C2BD9] hover:bg-purple-50">
                      Send Counter
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Recently Resolved</h2>
          {resolved.map((approval) => {
            const typeInfo = typeLabels[approval.type]
            return (
              <div key={approval.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{approval.customer} — {approval.vehicle}</p>
                      <p className="text-xs text-gray-500">{typeInfo.label} · Approved by {"respondedBy" in approval ? approval.respondedBy : "—"} · {"respondedAt" in approval ? approval.respondedAt : ""}</p>
                    </div>
                  </div>
                  <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-emerald-600">
                    ${(approval.requestedAmount / 100).toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
