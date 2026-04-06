"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Bot,
  Phone,
  Mail,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Car,
  DollarSign,
  Target,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const lead = {
  id: "1",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.johnson@email.com",
  phone: "(555) 123-4567",
  type: "BUYER" as const,
  source: "Cars.com",
  status: "HOT" as const,
  intentScore: 85,
  assignedAgent: "NOVA",
  vehicle: "2024 Toyota Camry XLE",
  estimatedGross: 320000,
  createdAt: "2024-01-15T10:30:00Z",
  intentSignals: [
    { signal: "Asked about specific vehicle (stock #T2441)", delta: "+20", time: "10:32 AM" },
    { signal: "Mentioned timeline: 'this weekend'", delta: "+15", time: "10:35 AM" },
    { signal: "Asked about financing options", delta: "+15", time: "10:38 AM" },
    { signal: "Inquired about test drive availability", delta: "+20", time: "10:42 AM" },
    { signal: "Quick response time (under 2 min)", delta: "+5", time: "10:44 AM" },
    { signal: "Asked about price", delta: "+10", time: "10:47 AM" },
  ],
}

const messages = [
  {
    id: "1",
    role: "CUSTOMER" as const,
    content: "Hi, I saw the 2024 Toyota Camry XLE on Cars.com (stock #T2441). Is it still available?",
    time: "10:32 AM",
    reasoning: null,
  },
  {
    id: "2",
    role: "AI" as const,
    content: "Hi Sarah! Yes, the 2024 Camry XLE in Celestial Silver is absolutely still available — great choice! It's one of our most popular models. Are you looking to come in this week to see it in person? I'd love to set up a time for you to take it for a test drive.",
    time: "10:32 AM",
    reasoning: {
      intentScore: 45,
      intentDelta: "+20 (specific vehicle inquiry)",
      strategy: "Qualify and redirect to appointment — early engagement",
      sentiment: "positive",
      sentimentConfidence: 0.88,
      guardrailsActive: ["no-price-over-text"],
      guardrailStatus: "compliant",
      modelUsed: "claude-sonnet-4-20250514",
      tokensUsed: 234,
      responseTimeMs: 1180,
    },
  },
  {
    id: "3",
    role: "CUSTOMER" as const,
    content: "Yes! I'm hoping to buy something this weekend. What's the best price you can do? Also, do you have financing options?",
    time: "10:35 AM",
    reasoning: null,
  },
  {
    id: "4",
    role: "AI" as const,
    content: "That's fantastic timing, Sarah! We definitely have great financing options available — our finance team works with multiple lenders to find the best rates for your situation. As for pricing, I'd love to put together a personalized offer for you when you come in. We're very competitive and I'm confident you'll love what we can do. Would Saturday morning work for a test drive? I can have everything ready for you.",
    time: "10:35 AM",
    reasoning: {
      intentScore: 75,
      intentDelta: "+30 (timeline + financing)",
      strategy: "Redirect price to in-person — build value with financing, push appointment",
      sentiment: "positive",
      sentimentConfidence: 0.92,
      guardrailsActive: ["no-price-over-text", "redirect-to-appointment"],
      guardrailStatus: "compliant",
      modelUsed: "claude-sonnet-4-20250514",
      tokensUsed: 312,
      responseTimeMs: 1450,
    },
  },
  {
    id: "5",
    role: "CUSTOMER" as const,
    content: "Saturday at 10am works! Can I test drive it then? Also, I might want to trade in my 2019 Honda Accord.",
    time: "10:42 AM",
    reasoning: null,
  },
  {
    id: "6",
    role: "AI" as const,
    content: "Perfect! I've got you down for Saturday at 10:00 AM for a test drive of the Camry XLE. You're going to love it! 🎉\n\nAnd great news on the trade-in — I'm pulling up a real-time valuation on your 2019 Honda Accord right now. Can you tell me the approximate mileage and general condition? That way I'll have a preliminary number ready for you when you arrive Saturday.",
    time: "10:42 AM",
    reasoning: {
      intentScore: 85,
      intentDelta: "+10 (trade-in mention + test drive request)",
      strategy: "Confirm appointment, capture trade-in details for Axel handoff",
      sentiment: "positive",
      sentimentConfidence: 0.95,
      guardrailsActive: ["no-price-over-text"],
      guardrailStatus: "compliant",
      modelUsed: "claude-sonnet-4-20250514",
      tokensUsed: 289,
      responseTimeMs: 1320,
    },
  },
]

function ReasoningPanel({ reasoning }: { reasoning: NonNullable<(typeof messages)[0]["reasoning"]> }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-2 rounded-lg border-l-2 border-[#8B5CF6] bg-purple-50/50 p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-xs font-medium text-purple-700"
      >
        <span className="flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5" />
          AI Reasoning — Intent: {reasoning.intentScore} ({reasoning.intentDelta})
        </span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 text-xs text-purple-600">
          <p><span className="font-medium">Strategy:</span> {reasoning.strategy}</p>
          <p><span className="font-medium">Sentiment:</span> {reasoning.sentiment} ({Math.round(reasoning.sentimentConfidence * 100)}%)</p>
          <p><span className="font-medium">Guardrails:</span> {reasoning.guardrailsActive.join(", ")} — <span className="font-semibold text-emerald-600">{reasoning.guardrailStatus}</span></p>
          <p><span className="font-medium">Model:</span> {reasoning.modelUsed} · {reasoning.tokensUsed} tokens · {reasoning.responseTimeMs}ms</p>
        </div>
      )}
    </div>
  )
}

export default function LeadDetailPage() {
  const [message, setMessage] = useState("")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{lead.firstName} {lead.lastName}</h1>
            <span className={cn(
              "text-xs font-bold",
              lead.type === "BUYER" ? "text-blue-600" : "text-amber-600"
            )}>
              {lead.type === "BUYER" ? "BUYER" : "SELLER"}
            </span>
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Hot</span>
          </div>
          <p className="text-sm text-gray-500">{lead.source} · {lead.vehicle}</p>
        </div>
        <button className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">
          <User className="mr-1.5 inline h-4 w-4" />
          Take Over
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Conversation */}
        <div className="xl:col-span-2">
          <div className="flex h-[calc(100vh-220px)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b px-6 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                  <Bot className="h-4 w-4" /> Nova
                </span>
                <span className="text-xs text-gray-400">handling via SMS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">Active</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === "AI" ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[80%]", msg.role === "AI" ? "" : "")}>
                    <div className={cn(
                      "rounded-2xl px-4 py-3 text-sm",
                      msg.role === "AI"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-[#6C2BD9] text-white"
                    )}>
                      {msg.content}
                    </div>
                    <p className={cn("mt-1 text-xs text-gray-400", msg.role === "AI" ? "text-left" : "text-right")}>
                      {msg.time}
                    </p>
                    {msg.reasoning && <ReasoningPanel reasoning={msg.reasoning} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message (sends as human agent)..."
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none focus:ring-1 focus:ring-[#6C2BD9]"
                />
                <button className="rounded-lg bg-[#6C2BD9] p-2 text-white hover:bg-[#5B21B6]">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Lead Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Lead Information</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{lead.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">{lead.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Source</dt>
                <dd className="font-medium text-gray-900">{lead.source}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Est. Gross</dt>
                <dd className="font-[family-name:var(--font-space-grotesk)] font-bold text-gray-900">
                  ${(lead.estimatedGross / 100).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Vehicle Interest */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Car className="h-4 w-4 text-gray-400" />
              Vehicle Interest
            </h3>
            <p className="text-sm font-medium text-gray-900">{lead.vehicle}</p>
            <p className="text-xs text-gray-500 mt-1">Stock #T2441 · Celestial Silver</p>
          </div>

          {/* Intent Score */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Target className="h-4 w-4 text-gray-400" />
              Intent Score
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-emerald-600">{lead.intentScore}</span>
              <div className="h-3 flex-1 rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${lead.intentScore}%` }} />
              </div>
            </div>
            <div className="space-y-1.5">
              {lead.intentSignals.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{s.signal}</span>
                  <span className="font-medium text-emerald-600">{s.delta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
