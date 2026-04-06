"use client"

import { Plus, Edit2, Trash2, Play } from "lucide-react"
import { cn } from "@/lib/utils"

const profiles = [
  { id: "1", name: "Trucks Aggressive", category: "TRUCK_SUV", isDefault: true, openingPct: 82, increment: 300, curve: "DECREASING", maxRounds: 5, finalBump: 500, reconBuffer: 0, demandBonus: 200 },
  { id: "2", name: "Sedans Conservative", category: "SEDAN", isDefault: false, openingPct: 88, increment: 200, curve: "FLAT", maxRounds: 4, finalBump: 300, reconBuffer: 0, demandBonus: 0 },
  { id: "3", name: "Luxury Premium", category: "LUXURY", isDefault: false, openingPct: 85, increment: 500, curve: "FRONT_LOADED", maxRounds: 6, finalBump: 750, reconBuffer: 500, demandBonus: 300 },
]

const curveLabels: Record<string, string> = {
  FLAT: "Flat",
  DECREASING: "Decreasing",
  FRONT_LOADED: "Front-Loaded",
  BACK_LOADED: "Back-Loaded",
}

export default function NegotiationSettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Negotiation Profiles</h1>
          <p className="text-sm text-gray-500">Configure strategy profiles for different vehicle categories</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-[#6C2BD9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6]">
          <Plus className="h-4 w-4" /> New Profile
        </button>
      </div>

      <div className="space-y-4">
        {profiles.map((profile) => (
          <div key={profile.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{profile.name}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{profile.category.replace("_", "/")}</span>
                  {profile.isDefault && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Default</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600" title="Simulate">
                  <Play className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600" title="Edit">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">Opening %</p>
                <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">{profile.openingPct}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Increment</p>
                <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">${profile.increment}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Curve</p>
                <p className="text-sm font-medium text-gray-900">{curveLabels[profile.curve]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Max Rounds</p>
                <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">{profile.maxRounds}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Final Bump</p>
                <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">${profile.finalBump}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Recon Buffer</p>
                <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">${profile.reconBuffer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Demand Bonus</p>
                <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-gray-900">${profile.demandBonus}</p>
              </div>
            </div>

            {/* Simulated round projection */}
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Preview: $25,000 ceiling</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: profile.maxRounds }).map((_, i) => {
                  const openingAmt = (profile.openingPct / 100) * 25000
                  const ceiling = 25000
                  const pct = Math.min(100, ((openingAmt + profile.increment * (i)) / ceiling) * 100)
                  return (
                    <div key={i} className="flex-1 text-center">
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div className={cn("h-full rounded-full", pct >= 90 ? "bg-red-400" : pct >= 80 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">R{i + 1}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
