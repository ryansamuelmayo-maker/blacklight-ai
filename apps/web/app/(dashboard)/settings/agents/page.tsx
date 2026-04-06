"use client"

import { Bot, Zap, MessageSquare, Phone, Mail, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AgentSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Configuration</h1>
        <p className="text-sm text-gray-500">Configure Nova and Axel behavior</p>
      </div>

      {/* Nova */}
      <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Nova</h3>
              <p className="text-xs text-gray-500">Buyer BDC Agent — Lead qualification & appointment booking</p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" defaultChecked className="peer sr-only" />
            <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
          </label>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Personality Tone</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option>Professional & Warm</option>
              <option>Friendly & Casual</option>
              <option>Strictly Professional</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Response Delay</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option>Instant (recommended)</option>
              <option>Simulated typing (3-5 seconds)</option>
              <option>Natural delay (5-15 seconds)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Active Channels</label>
            <div className="flex flex-wrap gap-2">
              {[{ icon: Phone, label: "SMS", active: true }, { icon: Mail, label: "Email", active: true }, { icon: Globe, label: "Webchat", active: true }].map(ch => (
                <label key={ch.label} className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  ch.active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"
                )}>
                  <input type="checkbox" defaultChecked={ch.active} className="sr-only" />
                  <ch.icon className="h-4 w-4" />
                  {ch.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Axel */}
      <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Bot className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Axel</h3>
              <p className="text-xs text-gray-500">Acquisition Agent — Vehicle negotiation & purchasing</p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" defaultChecked className="peer sr-only" />
            <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-amber-600 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
          </label>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Negotiation Style</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
              <option>Balanced — Professional with market data</option>
              <option>Aggressive — Strong anchoring, minimal concessions</option>
              <option>Conservative — Generous offers, quick close</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Response Delay</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
              <option>Simulated typing (3-5 seconds) (recommended)</option>
              <option>Instant</option>
              <option>Natural delay (5-15 seconds)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Active Channels</label>
            <div className="flex flex-wrap gap-2">
              {[{ icon: Phone, label: "SMS", active: true }, { icon: Mail, label: "Email", active: false }, { icon: Globe, label: "Webchat", active: true }].map(ch => (
                <label key={ch.label} className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  ch.active ? "border-amber-300 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500"
                )}>
                  <input type="checkbox" defaultChecked={ch.active} className="sr-only" />
                  <ch.icon className="h-4 w-4" />
                  {ch.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="rounded-lg bg-[#6C2BD9] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5B21B6]">Save Changes</button>
      </div>
    </div>
  )
}
