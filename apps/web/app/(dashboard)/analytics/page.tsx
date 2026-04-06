"use client"

import { BarChart3, TrendingUp, DollarSign, Clock, Users, ShieldCheck, Bot, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

const metrics = {
  roi: 12.4,
  grossMTD: 14280000,
  guardianSavings: 2460000,
  bdcHoursSaved: 186,
  avgResponseTime: 4.2,
  novaLeads: 32,
  novaApptRate: 0.38,
  novaShowRate: 0.73,
  axelNegotiations: 18,
  axelCloseRate: 0.67,
  axelAvgGross: 285000,
  axelAvgRounds: 3.2,
}

const funnel = [
  { stage: "Leads In", count: 47, pct: 100 },
  { stage: "AI Engaged", count: 38, pct: 81 },
  { stage: "Hot Intent", count: 14, pct: 30 },
  { stage: "Appt Set", count: 9, pct: 19 },
  { stage: "Showed", count: 7, pct: 15 },
  { stage: "Closed Won", count: 6, pct: 13 },
]

const channelBreakdown = [
  { channel: "SMS", leads: 22, convRate: 18, color: "bg-blue-500" },
  { channel: "Email", leads: 14, convRate: 12, color: "bg-purple-500" },
  { channel: "Webchat", leads: 8, convRate: 22, color: "bg-emerald-500" },
  { channel: "Phone", leads: 3, convRate: 8, color: "bg-amber-500" },
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & ROI</h1>
        <p className="text-sm text-gray-500">Performance metrics for April 2026</p>
      </div>

      {/* ROI Hero */}
      <div className="rounded-xl bg-gradient-to-r from-[#6C2BD9] via-[#5B21B6] to-[#4C1D95] p-8 text-white">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <p className="text-sm text-purple-200">ROI Multiplier</p>
            <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-5xl font-bold">{metrics.roi}x</p>
            <p className="mt-2 text-sm text-purple-300">$142,800 generated / $11,500 cost</p>
          </div>
          <div>
            <p className="text-sm text-purple-200">Gross Generated MTD</p>
            <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold">${(metrics.grossMTD / 100).toLocaleString()}</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-emerald-300"><ArrowUpRight className="h-3 w-3" /> +12.3% vs last month</p>
          </div>
          <div>
            <p className="text-sm text-purple-200">Guardian Savings</p>
            <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold">${(metrics.guardianSavings / 100).toLocaleString()}</p>
            <p className="mt-2 text-sm text-purple-300">Saved vs giving ceiling immediately</p>
          </div>
          <div>
            <p className="text-sm text-purple-200">BDC Hours Saved</p>
            <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold">{metrics.bdcHoursSaved}h</p>
            <p className="mt-2 text-sm text-purple-300">≈ 4.6 FTE BDC reps</p>
          </div>
        </div>
      </div>

      {/* What-if Calculator */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-6">
        <h3 className="text-sm font-semibold text-purple-900 mb-2">💡 What If You Turned Off Blacklight?</h3>
        <p className="text-sm text-purple-700">
          You&apos;d need <span className="font-bold">4-5 additional BDC reps</span> at ~$40,000/year each = <span className="font-bold">$160,000-$200,000/year</span> vs your current Blacklight cost of <span className="font-bold">$138,000/year</span>. That&apos;s before accounting for hiring delays, training time, and inconsistent performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Nova Performance */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-blue-600 mb-4">
            <Bot className="h-4 w-4" /> Nova Performance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Leads Handled</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-blue-900">{metrics.novaLeads}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Avg Response Time</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-blue-900">{metrics.avgResponseTime}s</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Appointment Rate</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-blue-900">{Math.round(metrics.novaApptRate * 100)}%</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-blue-600">Show Rate</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-blue-900">{Math.round(metrics.novaShowRate * 100)}%</p>
            </div>
          </div>
        </div>

        {/* Axel Performance */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-600 mb-4">
            <Bot className="h-4 w-4" /> Axel Performance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs text-amber-600">Negotiations Run</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-amber-900">{metrics.axelNegotiations}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs text-amber-600">Close Rate</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-amber-900">{Math.round(metrics.axelCloseRate * 100)}%</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs text-amber-600">Avg Gross / Deal</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-amber-900">${(metrics.axelAvgGross / 100).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs text-amber-600">Avg Rounds to Close</p>
              <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-amber-900">{metrics.axelAvgRounds}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lead Funnel */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Lead Funnel</h3>
          <div className="space-y-3">
            {funnel.map((stage, i) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                  <span className="text-sm text-gray-500">{stage.count} ({stage.pct}%)</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100">
                  <div
                    className={cn("h-full rounded-full transition-all", i === 0 ? "bg-gray-400" : i < 3 ? "bg-blue-500" : i < 5 ? "bg-purple-500" : "bg-emerald-500")}
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
                {i < funnel.length - 1 && (
                  <p className="text-right text-[10px] text-gray-400 mt-0.5">
                    {Math.round((funnel[i + 1].count / stage.count) * 100)}% conversion
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Channel Breakdown</h3>
          <div className="space-y-4">
            {channelBreakdown.map((ch) => (
              <div key={ch.channel} className="flex items-center gap-4">
                <div className={cn("h-3 w-3 rounded-full", ch.color)} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{ch.channel}</span>
                    <span className="text-xs text-gray-500">{ch.leads} leads · {ch.convRate}% conv.</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className={cn("h-full rounded-full", ch.color)} style={{ width: `${(ch.leads / 47) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
