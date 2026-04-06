"use client"

import { Plus, Trash2, ExternalLink, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const adfEndpoints = [
  { id: "1", provider: "KBB_ICO", type: "EMAIL", value: "leads@kbb-ico.example.com", weight: 50, isActive: true, lastSync: "2 hours ago", lastStatus: "SUCCESS" },
  { id: "2", provider: "ACCUTRADE", type: "EMAIL", value: "leads@accutrade.example.com", weight: 30, isActive: true, lastSync: "3 hours ago", lastStatus: "SUCCESS" },
  { id: "3", provider: "BLACK_BOOK", type: "API_URL", value: "https://api.blackbook.example.com/v2/valuations", weight: 20, isActive: true, lastSync: "1 hour ago", lastStatus: "FAILURE" },
]

export default function IntegrationsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500">ADF endpoints, CRM connections, and messaging</p>
      </div>

      {/* ADF Endpoints */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">ADF Endpoints</h3>
          <button className="flex items-center gap-1.5 rounded-lg bg-[#6C2BD9] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#5B21B6]">
            <Plus className="h-3.5 w-3.5" /> Add Endpoint
          </button>
        </div>
        <div className="space-y-3">
          {adfEndpoints.map((ep) => (
            <div key={ep.id} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{ep.provider.replace("_", " ")}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{ep.type}</span>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">Weight: {ep.weight}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{ep.value}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  {ep.lastStatus === "SUCCESS" ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  Last sync: {ep.lastSync}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CRM */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">CRM Connection</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CRM Provider</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none">
              <option>eLead CRM</option>
              <option>VinSolutions</option>
              <option>DealerSocket</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <input type="password" defaultValue="sk-****-****-****" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Poll Frequency</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none">
              <option>Every 30 seconds</option>
              <option>Every 1 minute</option>
              <option>Every 5 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* SMS / Twilio */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">SMS Configuration (Twilio)</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account SID</label>
              <input type="text" placeholder="ACxxxxxxxxx" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Auth Token</label>
              <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
            <input type="text" placeholder="+1 (555) 000-0000" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="rounded-lg bg-[#6C2BD9] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5B21B6]">Save Changes</button>
      </div>
    </div>
  )
}
