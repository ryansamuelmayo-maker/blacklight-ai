"use client"

import { useState } from "react"
import {
    Bot, ArrowRight, ShieldCheck, AlertTriangle, Clock, CheckCircle2,
    XCircle, TrendingUp, Info, ChevronUp, Settings2, Lock
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileKey = "Trucks Aggressive" | "Trucks Conservative" | "Sedans Conservative" | "Sedans Aggressive" | "Luxury Premium"

interface ToleranceProfile {
    label: ProfileKey
    maxDiscountPct: number          // max % dealer will concede from anchor
  maxConcessionAbs: number        // max absolute $ concession (cents)
  stepUpCategories: string[]      // vehicle categories eligible for step-up
  autoApproveBelow: number        // rounds before human approval required
  requiresApprovalAbove: number   // % of ceiling that triggers PENDING_APPROVAL
}

interface Negotiation {
    id: string
    customer: string
    vehicle: string
    vin: string
    status: "ACTIVE" | "PENDING_APPROVAL" | "CLOSED_WON" | "CLOSED_LOST" | "CONFIGURING" | "ESCALATED" | "EXPIRED"
    currentRound: number
    maxRounds: number
    anchorAmount: number
    currentOffer: number
    dealerCeiling: number
    maxTolerance: number            // dealer-set hard ceiling (cents)
  customerCounter: number | null
    profile: ProfileKey
    competitorDetected: string | null
    guardianCompliant: boolean
    stepUpVehicle: string | null    // target step-up vehicle
  approvalReason: string | null   // reason for PENDING_APPROVAL
}

// ─── Dealer Tolerance Profiles ───────────────────────────────────────────────

const toleranceProfiles: Record<ProfileKey, ToleranceProfile> = {
    "Trucks Aggressive": {
          label: "Trucks Aggressive",
          maxDiscountPct: 12,
          maxConcessionAbs: 350000,
          stepUpCategories: ["Full-Size Trucks", "Heavy Duty Trucks"],
          autoApproveBelow: 3,
          requiresApprovalAbove: 90,
    },
    "Trucks Conservative": {
          label: "Trucks Conservative",
          maxDiscountPct: 7,
          maxConcessionAbs: 180000,
          stepUpCategories: ["Full-Size Trucks"],
          autoApproveBelow: 2,
          requiresApprovalAbove: 85,
    },
    "Sedans Conservative": {
          label: "Sedans Conservative",
          maxDiscountPct: 8,
          maxConcessionAbs: 150000,
          stepUpCategories: ["Sedans", "Crossovers"],
          autoApproveBelow: 2,
          requiresApprovalAbove: 85,
    },
    "Sedans Aggressive": {
          label: "Sedans Aggressive",
          maxDiscountPct: 11,
          maxConcessionAbs: 200000,
          stepUpCategories: ["Sedans", "Crossovers", "SUVs"],
          autoApproveBelow: 3,
          requiresApprovalAbove: 88,
    },
    "Luxury Premium": {
          label: "Luxury Premium",
          maxDiscountPct: 6,
          maxConcessionAbs: 300000,
          stepUpCategories: ["Luxury SUVs", "Luxury Sedans", "Performance"],
          autoApproveBelow: 2,
          requiresApprovalAbove: 88,
    },
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const negotiations: Negotiation[] = [
  {
        id: "1",
        customer: "Mike Thompson",
        vehicle: "2021 Ford F-150 Lariat",
        vin: "1FTFW1E8...4321",
        status: "ACTIVE",
        currentRound: 2,
        maxRounds: 5,
        anchorAmount: 2200000,
        currentOffer: 1850000,
        dealerCeiling: 2200000,
        maxTolerance: 1980000,
        customerCounter: 2100000,
        profile: "Trucks Aggressive",
        competitorDetected: "CarMax",
        guardianCompliant: true,
        stepUpVehicle: "2023 Ford F-150 XLT SuperCrew",
        approvalReason: null,
  },
  {
        id: "2",
        customer: "Robert Davis",
        vehicle: "2020 Chevrolet Silverado 1500",
        vin: "3GCUYGE7...8765",
        status: "PENDING_APPROVAL",
        currentRound: 4,
        maxRounds: 5,
        anchorAmount: 2800000,
        currentOffer: 2650000,
        dealerCeiling: 2800000,
        maxTolerance: 2660000,
        customerCounter: 2900000,
        profile: "Trucks Aggressive",
        competitorDetected: null,
        guardianCompliant: true,
        stepUpVehicle: "2023 Chevrolet Silverado 1500 LTZ",
        approvalReason: "Max tolerance reached — Round 4/5, offer within $100 of limit",
  },
  {
        id: "3",
        customer: "Patricia Martinez",
        vehicle: "2019 Toyota RAV4 Limited",
        vin: "2T3W1RFV...5432",
        status: "ACTIVE",
        currentRound: 1,
        maxRounds: 5,
        anchorAmount: 2100000,
        currentOffer: 1785000,
        dealerCeiling: 2100000,
        maxTolerance: 1932000,
        customerCounter: null,
        profile: "Sedans Conservative",
        competitorDetected: null,
        guardianCompliant: true,
        stepUpVehicle: "2022 Toyota RAV4 XLE Premium",
        approvalReason: null,
  },
  {
        id: "4",
        customer: "Tom Wilson",
        vehicle: "2022 BMW X5 xDrive40i",
        vin: "5UXCR6C0...1234",
        status: "CLOSED_WON",
        currentRound: 3,
        maxRounds: 5,
        anchorAmount: 4500000,
        currentOffer: 4150000,
        dealerCeiling: 4500000,
        maxTolerance: 4230000,
        customerCounter: 4200000,
        profile: "Luxury Premium",
        competitorDetected: "Carvana",
        guardianCompliant: true,
        stepUpVehicle: null,
        approvalReason: null,
  },
  {
        id: "5",
        customer: "Linda Garcia",
        vehicle: "2020 Honda Civic EX",
        vin: "19XFC2F6...9876",
        status: "CLOSED_LOST",
        currentRound: 5,
        maxRounds: 5,
        anchorAmount: 1600000,
        currentOffer: 1520000,
        dealerCeiling: 1600000,
        maxTolerance: 1472000,
        customerCounter: 1800000,
        profile: "Sedans Conservative",
        competitorDetected: "CarMax",
        guardianCompliant: true,
        stepUpVehicle: "2022 Honda Civic Sport",
        approvalReason: null,
  },
  ]

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig = {
    CONFIGURING: { label: "Configuring", color: "bg-gray-100 text-gray-700", icon: Clock },
    ACTIVE: { label: "Active", color: "bg-blue-100 text-blue-700", icon: Bot },
    PENDING_APPROVAL: { label: "Needs Approval", color: "bg-amber-100 text-amber-700", icon: AlertTriangle },
    CLOSED_WON: { label: "Won", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
    CLOSED_LOST: { label: "Lost", color: "bg-red-100 text-red-700", icon: XCircle },
    EXPIRED: { label: "Expired", color: "bg-gray-100 text-gray-500", icon: Clock },
    ESCALATED: { label: "Escalated", color: "bg-red-100 text-red-700", icon: AlertTriangle },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(cents: number) {
    return "$" + (cents / 100).toLocaleString()
}

function getToleranceStatus(currentOffer: number, maxTolerance: number, dealerCeiling: number) {
    const pctOfMax = (currentOffer / maxTolerance) * 100
    if (pctOfMax >= 98) return "at-limit"
    if (pctOfMax >= 88) return "warning"
    return "ok"
}

// ─── Offer Range Bar ──────────────────────────────────────────────────────────

function OfferRangeBar({ current, ceiling, anchor, maxTolerance }: {
    current: number
    ceiling: number
    anchor: number
    maxTolerance: number
}) {
    const floor = Math.round(anchor * 0.85)
    const range = ceiling - floor
    const currentPct = Math.min(100, Math.round(((current - floor) / range) * 100))
    const tolerancePct = Math.min(100, Math.round(((maxTolerance - floor) / range) * 100))
    const green = 70
    const yellow = 90
    const tolStatus = getToleranceStatus(current, maxTolerance, ceiling)

  return (
        <div className="w-full space-y-1">
          {/* Colored bar */}
              <div className="relative h-3 rounded-full bg-gray-200 overflow-visible">
                {/* Zone fills */}
                      <div className="absolute inset-0 rounded-full overflow-hidden flex">
                                <div className="bg-emerald-400" style={{ width: `${green}%` }} />
                                <div className="bg-amber-400" style={{ width: `${yellow - green}%` }} />
                                <div className="bg-red-400" style={{ width: `${100 - yellow}%` }} />
                      </div>div>
              
                {/* Max Tolerance dashed marker */}
                      <div
                                  className="absolute top-[-3px] h-[18px] w-[2px] rounded-sm z-10"
                                  style={{
                                                left: `${tolerancePct}%`,
                                                background: tolStatus === "at-limit" ? "#dc2626" : tolStatus === "warning" ? "#d97706" : "#6366f1",
                                                boxShadow: "0 0 0 1px white",
                                  }}
                                  title={`Max Tolerance: ${fmt(maxTolerance)}`}
                                />
              
                {/* Current offer marker */}
                      <div
                                  className="absolute top-0 h-full w-0.5 bg-gray-900 z-20"
                                  style={{ left: `${currentPct}%` }}
                                />
              </div>div>
        
          {/* Labels row */}
              <div className="flex justify-between text-[10px] text-gray-400">
                      <span>{fmt(floor)}</span>span>
                      <span className="font-medium text-gray-600">{fmt(current)}</span>span>
                      <span>{fmt(ceiling)}</span>span>
              </div>div>
        
          {/* Tolerance indicator pill */}
              <div className="flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5 text-gray-400" />
                      <span className={cn("text-[9px] font-medium", {
                    "text-red-600": tolStatus === "at-limit",
                    "text-amber-600": tolStatus === "warning",
                    "text-indigo-600": tolStatus === "ok",
        })}>
                                Max Tol: {fmt(maxTolerance)}
                        {tolStatus === "at-limit" && " — AT LIMIT"}
                        {tolStatus === "warning" && " — NEAR LIMIT"}
                      </span>span>
              </div>div>
        </div>div>
      )
}

// ─── Profile Popover ──────────────────────────────────────────────────────────

function ProfileBadge({ profile }: { profile: ProfileKey }) {
    const [open, setOpen] = useState(false)
        const p = toleranceProfiles[profile]
          
            return (
                  <div className="relative">
                        <button
                                  onClick={() => setOpen(!open)}
                                  className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-indigo-700 transition-colors group"
                                >
                                <span>{profile}</span>span>
                                <Info className="h-3 w-3 text-gray-400 group-hover:text-indigo-500" />
                        </button>button>
                  
                    {open && (
                            <>
                                      <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
                                      <div className="absolute left-0 top-6 z-30 w-64 rounded-xl border border-gray-200 bg-white shadow-xl p-4 space-y-3 text-xs">
                                                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                                                                <Settings2 className="h-3.5 w-3.5 text-indigo-500" />
                                                    {profile}
                                                  </div>div>
                                      
                                                  <div className="space-y-2 text-gray-600">
                                                                <div className="flex justify-between">
                                                                                <span className="text-gray-400">Max Discount</span>span>
                                                                                <span className="font-medium text-gray-800">{p.maxDiscountPct}%</span>span>
                                                                </div>div>
                                                                <div className="flex justify-between">
                                                                                <span className="text-gray-400">Max Concession</span>span>
                                                                                <span className="font-medium text-gray-800">{fmt(p.maxConcessionAbs)}</span>span>
                                                                </div>div>
                                                                <div className="flex justify-between">
                                                                                <span className="text-gray-400">Auto-Approve &lt; Round</span>span>
                                                                                <span className="font-medium text-gray-800">{p.autoApproveBelow}</span>span>
                                                                </div>div>
                                                                <div className="flex justify-between">
                                                                                <span className="text-gray-400">Flags Approval At</span>span>
                                                                                <span className="font-medium text-gray-800">{p.requiresApprovalAbove}% ceiling</span>span>
                                                                </div>div>
                                                  </div>div>
                                      
                                                  <div>
                                                                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Step-Up Eligible</p>p>
                                                                <div className="flex flex-wrap gap-1">
                                                                  {p.stepUpCategories.map(cat => (
                                                <span key={cat} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                                  {cat}
                                                </span>span>
                                              ))}
                                                                </div>div>
                                                  </div>div>
                                      </div>div>
                            </>>
                          )}
                  </div>div>
                )
}

// ─── Summary Bar ─────────────────────────────────────────────────────────────

function SummaryBar({ items }: { items: Negotiation[] }) {
    const active = items.filter(n => n.status === "ACTIVE" || n.status === "PENDING_APPROVAL")
        const atLimit = active.filter(n => getToleranceStatus(n.currentOffer, n.maxTolerance, n.dealerCeiling) === "at-limit")
            const nearLimit = active.filter(n => getToleranceStatus(n.currentOffer, n.maxTolerance, n.dealerCeiling) === "warning")
                const pending = items.filter(n => n.status === "PENDING_APPROVAL")
                    const withinTol = active.length - atLimit.length - nearLimit.length
                      
                        return (
                              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
                                    <div className="flex items-center gap-2 border-r border-gray-100 pr-3">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                            <span className="text-xs text-gray-500">Within Tolerance</span>span>
                                            <span className="text-sm font-bold text-gray-900">{withinTol}</span>span>
                                    </div>div>
                                    <div className="flex items-center gap-2 border-r border-gray-100 pr-3">
                                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                                            <span className="text-xs text-gray-500">Near Limit</span>span>
                                            <span className="text-sm font-bold text-amber-700">{nearLimit.length}</span>span>
                                    </div>div>
                                    <div className="flex items-center gap-2 border-r border-gray-100 pr-3">
                                            <span className="h-2 w-2 rounded-full bg-red-400" />
                                            <span className="text-xs text-gray-500">At Limit</span>span>
                                            <span className="text-sm font-bold text-red-700">{atLimit.length}</span>span>
                                    </div>div>
                                    <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-indigo-400" />
                                            <span className="text-xs text-gray-500">Pending Approval</span>span>
                                            <span className="text-sm font-bold text-indigo-700">{pending.length}</span>span>
                                    </div>div>
                              </div>div>
                            )
                          }
                          
                          // ─── Main Page ────────────────────────────────────────────────────────────────

export default function NegotiationsPage() {
    const activeCount = negotiations.filter(n => n.status === "ACTIVE" || n.status === "PENDING_APPROVAL").length
        const pendingCount = negotiations.filter(n => n.status === "PENDING_APPROVAL").length
          
            return (
                  <div className="space-y-5">
                    {/* Header */}
                        <div className="flex items-center justify-between">
                                <div>
                                          <h1 className="text-2xl font-bold text-gray-900">Negotiations</h1>h1>
                                          <p className="text-sm text-gray-500">
                                            {activeCount} active · {pendingCount} awaiting approval
                                          </p>p>
                                </div>div>
                                <div className="flex items-center gap-2">
                                          <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                          <span className="text-sm font-medium text-emerald-600">100% Guardian Compliant</span>span>
                                </div>div>
                        </div>div>
                  
                    {/* Summary bar */}
                        <SummaryBar items={negotiations} />
                  
                    {/* Table */}
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                <table className="w-full">
                                          <thead>
                                                      <tr className="border-b bg-gray-50/50">
                                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                                    Customer / Vehicle
                                                                    </th>th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                                    Status
                                                                    </th>th>
                                                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                                    Round
                                                                    </th>th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 min-w-[220px]">
                                                                                    Offer Range &amp; Max Tolerance
                                                                    </th>th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                                    Profile
                                                                    </th>th>
                                                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                                    Competitor
                                                                    </th>th>
                                                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                                    Actions
                                                                    </th>th>
                                                      </tr>tr>
                                          </thead>thead>
                                          <tbody className="divide-y divide-gray-100">
                                            {negotiations.map(neg => {
                                  const sc = statusConfig[neg.status]
                                                  const tolStatus = getToleranceStatus(neg.currentOffer, neg.maxTolerance, neg.dealerCeiling)
                                                    
                                                                  return (
                                                                                    <tr
                                                                                                        key={neg.id}
                                                                                                        className={cn("hover:bg-gray-50/50 transition-colors", {
                                                                                                                              "bg-amber-50/30": neg.status === "PENDING_APPROVAL",
                                                                                                          })}
                                                                                                      >
                                                                                      {/* Customer / Vehicle */}
                                                                                                      <td className="px-6 py-4">
                                                                                                                          <p className="text-sm font-semibold text-gray-900">{neg.customer}</p>p>
                                                                                                                          <p className="text-xs text-gray-500">{neg.vehicle} · {neg.vin}</p>p>
                                                                                                        {/* Step-up vehicle tag */}
                                                                                                        {neg.stepUpVehicle && (
                                                                                                                              <div className="mt-1 flex items-center gap-1">
                                                                                                                                                      <ChevronUp className="h-3 w-3 text-indigo-500" />
                                                                                                                                                      <span className="text-[10px] font-medium text-indigo-600">
                                                                                                                                                                                Step-Up: {neg.stepUpVehicle}
                                                                                                                                                        </span>span>
                                                                                                                                </div>div>
                                                                                                                          )}
                                                                                                        </td>td>
                                                                                    
                                                                                      {/* Status */}
                                                                                                      <td className="px-4 py-4">
                                                                                                                          <div className="space-y-1">
                                                                                                                                                <span className={cn(
                                                                                                                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                                                                                                sc.color
                                                                                                                              )}>
                                                                                                                                                                        <sc.icon className="h-3 w-3" />
                                                                                                                                                  {sc.label}
                                                                                                                                                  </span>span>
                                                                                                                            {/* Approval reason */}
                                                                                                                            {neg.approvalReason && (
                                                                                                                                <p className="text-[10px] text-amber-700 leading-tight max-w-[140px]">
                                                                                                                                  {neg.approvalReason}
                                                                                                                                  </p>p>
                                                                                                                                                )}
                                                                                                                            </div>div>
                                                                                                        </td>td>
                                                                                    
                                                                                      {/* Round */}
                                                                                                      <td className="px-4 py-4 text-center">
                                                                                                                          <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-gray-900">
                                                                                                                            {neg.currentRound}/{neg.maxRounds}
                                                                                                                            </span>span>
                                                                                                        </td>td>
                                                                                    
                                                                                      {/* Offer Range + Max Tolerance */}
                                                                                                      <td className="px-4 py-4">
                                                                                                                          <OfferRangeBar
                                                                                                                                                  current={neg.currentOffer}
                                                                                                                                                  ceiling={neg.dealerCeiling}
                                                                                                                                                  anchor={neg.anchorAmount}
                                                                                                                                                  maxTolerance={neg.maxTolerance}
                                                                                                                                                />
                                                                                                        </td>td>
                                                                                    
                                                                                      {/* Profile */}
                                                                                                      <td className="px-4 py-4">
                                                                                                                          <ProfileBadge profile={neg.profile} />
                                                                                                        </td>td>
                                                                                    
                                                                                      {/* Competitor */}
                                                                                                      <td className="px-4 py-4">
                                                                                                        {neg.competitorDetected ? (
                                                                                                                              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                                                                                                                                                      <AlertTriangle className="h-3 w-3" />
                                                                                                                                {neg.competitorDetected}
                                                                                                                                </span>span>
                                                                                                                            ) : (
                                                                                                                              <span className="text-xs text-gray-400">None</span>span>
                                                                                                                          )}
                                                                                                        </td>td>
                                                                                    
                                                                                      {/* Actions */}
                                                                                                      <td className="px-4 py-4 text-right">
                                                                                                                          <button className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50">
                                                                                                                                                View <ArrowRight className="h-3 w-3" />
                                                                                                                            </button>button>
                                                                                                        </td>td>
                                                                                      </tr>tr>
                                                                                  )
                                            })}
                                          </tbody>tbody>
                                </table>table>
                        </div>div>
                  
                    {/* Tolerance Profile Legend */}
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                                <div className="flex items-center gap-2 mb-4">
                                          <Settings2 className="h-4 w-4 text-indigo-500" />
                                          <h2 className="text-sm font-semibold text-gray-800">Dealer Tolerance Profiles</h2>h2>
                                          <span className="text-xs text-gray-400">— click any profile badge above to inspect settings</span>span>
                                </div>div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  {(Object.values(toleranceProfiles) as ToleranceProfile[]).map(p => (
                                <div key={p.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
                                              <p className="text-xs font-semibold text-gray-800">{p.label}</p>p>
                                              <div className="space-y-1 text-[11px] text-gray-500">
                                                              <div className="flex justify-between">
                                                                                <span>Max Discount</span>span>
                                                                                <span className="font-medium text-gray-700">{p.maxDiscountPct}%</span>span>
                                                              </div>div>
                                                              <div className="flex justify-between">
                                                                                <span>Max Concession</span>span>
                                                                                <span className="font-medium text-gray-700">{fmt(p.maxConcessionAbs)}</span>span>
                                                              </div>div>
                                                              <div className="flex justify-between">
                                                                                <span>Approval Threshold</span>span>
                                                                                <span className="font-medium text-gray-700">{p.requiresApprovalAbove}% of ceiling</span>span>
                                                              </div>div>
                                              </div>div>
                                              <div className="flex flex-wrap gap-1 pt-1">
                                                {p.stepUpCategories.map(cat => (
                                                    <span key={cat} className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                                                      {cat}
                                                    </span>span>
                                                  ))}
                                              </div>div>
                                </div>div>
                              ))}
                                </div>div>
                        </div>div>
                  </div>div>
                )
}</></div>
