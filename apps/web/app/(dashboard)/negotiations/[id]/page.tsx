"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Bot,
  Send,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Car,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

const negotiation = {
  id: "1",
  customer: "Mike Thompson",
  vehicle: { year: 2021, make: "Ford", model: "F-150", trim: "Lariat", vin: "1FTFW1E85MFA54321", mileage: 38500, condition: "GOOD" },
  status: "ACTIVE",
  currentRound: 2,
  maxRounds: 5,
  anchorAmount: 2200000,
  dealerCeiling: 2200000,
  openingOffer: 1870000,
  currentOffer: 1850000,
  customerCounter: 2100000,
  competitorMentioned: "CarMax",
  competitorOfferAmount: 1920000,
  profile: "Trucks Aggressive",
  guardianCompliant: true,
}

const appraisals = [
  { source: "KBB ICO", amount: 2150000, weight: 50, confidence: "HIGH" },
  { source: "AccuTrade", amount: 2250000, weight: 30, confidence: "MEDIUM" },
  { source: "Black Book", amount: 2180000, weight: 20, confidence: "HIGH" },
]

const rounds = [
  { round: 1, offer: 1870000, increment: 0, pctCeiling: 85, strategy: "Opening — Anchor at 85% of ceiling", customerResponse: "That seems low, I was offered $19,200 from CarMax.", sentiment: "NEGATIVE" },
  { round: 2, offer: 1850000, increment: -20000, pctCeiling: 84, strategy: "Competitor detected (CarMax $19,200) — present value prop, hold position", customerResponse: null, sentiment: null },
]

const messages = [
  { id: "1", role: "CUSTOMER", content: "I want to sell my F-150. What can you offer?", time: "2:15 PM" },
  { id: "2", role: "AI", content: "Hi Mike! I'd love to take a look at your 2021 F-150 Lariat. Based on our current market analysis — considering your mileage of 38,500 miles and the excellent condition — I can offer you $18,700 for it today. This is a strong offer that reflects the current truck market. Would you like to bring it in for a quick inspection and we can finalize everything?", time: "2:15 PM", reasoning: { strategy: "Opening at 85% — establish anchor with market data", guardrailStatus: "compliant", round: 1 } },
  { id: "3", role: "CUSTOMER", content: "That seems low. CarMax offered me $19,200. Can you match that?", time: "2:22 PM" },
  { id: "4", role: "AI", content: "I appreciate you sharing that, Mike. I know CarMax gives those instant numbers, but keep in mind — their offers are often contingent on an in-person inspection, and they can adjust down when you arrive. With us, you get the convenience of a local transaction, same-day payment, and no surprises. Let me see what I can do... I can come up to $18,500. This is a firm, no-surprises offer — the price you see is the price you get. What do you think?", time: "2:22 PM", reasoning: { strategy: "Competitor detected — differentiate on certainty, hold below CarMax", guardrailStatus: "compliant", round: 2 } },
]

function OfferRangeVisual() {
  const ceiling = negotiation.dealerCeiling
  const current = negotiation.currentOffer
  const pct = Math.round((current / ceiling) * 100)

  return (
    <div>
      <div className="relative h-6 rounded-full overflow-hidden bg-gray-200">
        <div className="absolute inset-0 flex">
          <div className="bg-emerald-400" style={{ width: "70%" }} />
          <div className="bg-amber-400" style={{ width: "20%" }} />
          <div className="bg-red-400" style={{ width: "10%" }} />
        </div>
        <div className="absolute top-0 h-full w-1 bg-gray-900 shadow-sm" style={{ left: `${pct}%` }} title={`Current: $${(current / 100).toLocaleString()}`} />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <div className="text-center">
          <p className="font-medium text-gray-500">Opening</p>
          <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-gray-700">${(negotiation.openingOffer / 100).toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-blue-600">Current Offer</p>
          <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-blue-700">${(current / 100).toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-red-600">Ceiling</p>
          <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-red-700">${(ceiling / 100).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

export default function NegotiationDetailPage() {
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Negotiation: {negotiation.customer}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              <Bot className="h-3 w-3" /> Round {negotiation.currentRound}/{negotiation.maxRounds}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3 w-3" /> Compliant
            </span>
          </div>
          <p className="text-sm text-gray-500">{negotiation.vehicle.year} {negotiation.vehicle.make} {negotiation.vehicle.model} {negotiation.vehicle.trim}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Conversation — 3 cols */}
        <div className="xl:col-span-3">
          <div className="flex h-[calc(100vh-220px)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                <Bot className="h-4 w-4" /> Axel — Negotiating via SMS
              </span>
              <span className="text-xs text-gray-400">{negotiation.profile}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === "AI" ? "justify-start" : "justify-end")}>
                  <div className="max-w-[80%]">
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm",
                      msg.role === "AI" ? "bg-gray-100 text-gray-800" : "bg-amber-600 text-white"
                    )}>
                      {msg.content}
                    </div>
                    <p className={cn("mt-1 text-xs text-gray-400", msg.role === "AI" ? "" : "text-right")}>{msg.time}</p>
                    {"reasoning" in msg && msg.reasoning && (
                      <div className="mt-2 rounded-lg border-l-2 border-amber-400 bg-amber-50/50 p-3">
                        <button
                          onClick={() => setExpandedReasoning(expandedReasoning === msg.id ? null : msg.id)}
                          className="flex w-full items-center justify-between text-xs font-medium text-amber-700"
                        >
                          <span>Axel: {msg.reasoning.strategy}</span>
                          {expandedReasoning === msg.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {expandedReasoning === msg.id && (
                          <div className="mt-2 text-xs text-amber-600 space-y-1">
                            <p>Round: {msg.reasoning.round} / {negotiation.maxRounds}</p>
                            <p>Guardrails: <span className="font-semibold text-emerald-600">{msg.reasoning.guardrailStatus}</span></p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <div className="flex items-center gap-3">
                <input type="text" placeholder="Type a message (sends as human agent)..." className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                <button className="rounded-lg bg-amber-600 p-2 text-white hover:bg-amber-700">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — 2 cols */}
        <div className="xl:col-span-2 space-y-4">
          {/* Vehicle */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Car className="h-4 w-4 text-gray-400" /> Vehicle Details
            </h3>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">VIN</dt><dd className="font-mono text-xs text-gray-900">{negotiation.vehicle.vin}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Mileage</dt><dd className="font-medium">{negotiation.vehicle.mileage.toLocaleString()} mi</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Condition</dt><dd className="font-medium">{negotiation.vehicle.condition}</dd></div>
            </dl>
          </div>

          {/* Appraisals */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <DollarSign className="h-4 w-4 text-gray-400" /> Appraisal Sources
            </h3>
            <div className="space-y-2">
              {appraisals.map((a) => (
                <div key={a.source} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.source}</p>
                    <p className="text-xs text-gray-500">Weight: {a.weight}% · {a.confidence}</p>
                  </div>
                  <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-gray-900">
                    ${(a.amount / 100).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2 mt-2">
                <span className="text-sm font-medium text-gray-700">Blended Anchor</span>
                <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-[#6C2BD9]">
                  ${(negotiation.anchorAmount / 100).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Offer Range */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <TrendingUp className="h-4 w-4 text-gray-400" /> Offer Range
            </h3>
            <OfferRangeVisual />
          </div>

          {/* Round History */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Round History</h3>
            <div className="space-y-2">
              {rounds.map((r) => (
                <div key={r.round} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-700">Round {r.round}</span>
                    <span className="font-[family-name:var(--font-space-grotesk)] text-xs font-bold">${(r.offer / 100).toLocaleString()} ({r.pctCeiling}%)</span>
                  </div>
                  <p className="text-xs text-gray-500">{r.strategy}</p>
                  {r.customerResponse && (
                    <p className="mt-1 text-xs text-gray-600 italic">&ldquo;{r.customerResponse}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Alert */}
          {negotiation.competitorMentioned && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-red-800 mb-2">
                <AlertTriangle className="h-4 w-4" /> Competitor Detected
              </h3>
              <p className="text-sm text-red-700">
                {negotiation.competitorMentioned}: ${negotiation.competitorOfferAmount ? (negotiation.competitorOfferAmount / 100).toLocaleString() : "Unknown"}
              </p>
              <p className="text-xs text-red-600 mt-1">Strategy: Differentiate on certainty, hold below CarMax, escalate if pressed</p>
            </div>
          )}

          {/* Guardrail Summary */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800 mb-2">
              <ShieldCheck className="h-4 w-4" /> Guardrail Summary
            </h3>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between"><dt className="text-emerald-700">Ceiling</dt><dd className="font-bold text-emerald-900">${(negotiation.dealerCeiling / 100).toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-emerald-700">Current Offer</dt><dd className="font-bold text-emerald-900">${(negotiation.currentOffer / 100).toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-emerald-700">Headroom</dt><dd className="font-bold text-emerald-900">${((negotiation.dealerCeiling - negotiation.currentOffer) / 100).toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-emerald-700">Status</dt><dd className="font-bold text-emerald-600">COMPLIANT</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
