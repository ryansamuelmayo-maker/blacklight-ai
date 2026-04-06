"use client"

import { useState } from "react"
import { Database, Download, FileText, Shield, Clock, HardDrive, Users, MessageSquare, DollarSign, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const dataInventory = [
  { label: "Total Leads", count: 1247, icon: Users, size: "2.3 MB" },
  { label: "Conversations", count: 892, icon: MessageSquare, size: "18.7 MB" },
  { label: "Messages", count: 15420, icon: FileText, size: "45.2 MB" },
  { label: "Negotiations", count: 341, icon: DollarSign, size: "4.1 MB" },
  { label: "Appraisals", count: 567, icon: BarChart3, size: "1.8 MB" },
  { label: "Deal Records", count: 203, icon: Database, size: "0.9 MB" },
]

const exports = [
  { id: "1", type: "FULL", format: "CSV", status: "COMPLETED", requestedAt: "Apr 4, 2026 3:15 PM", fileSize: "72.4 MB", recordCount: 18270 },
  { id: "2", type: "LEADS", format: "JSON", status: "COMPLETED", requestedAt: "Apr 3, 2026 10:00 AM", fileSize: "2.1 MB", recordCount: 1247 },
  { id: "3", type: "CONVERSATIONS", format: "CSV", status: "PROCESSING", requestedAt: "Apr 5, 2026 11:30 AM", fileSize: null, recordCount: null },
]

const exportTypes = [
  { value: "FULL", label: "Full Export", desc: "All data" },
  { value: "LEADS", label: "Leads Only", desc: "Lead records" },
  { value: "CONVERSATIONS", label: "Conversations", desc: "Messages & threads" },
  { value: "NEGOTIATIONS", label: "Negotiations", desc: "Offers & rounds" },
  { value: "DEALS", label: "Deal Records", desc: "Closed deals" },
  { value: "ANALYTICS", label: "Analytics", desc: "Metrics & KPIs" },
]

export default function DataVaultPage() {
  const [selectedExport, setSelectedExport] = useState("FULL")
  const [selectedFormat, setSelectedFormat] = useState("CSV")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Vault</h1>
        <p className="text-sm text-gray-500">Your data inventory, exports, and ownership</p>
      </div>

      {/* Data Ownership Statement */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-emerald-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-emerald-900">Your Data Is Yours</h3>
            <p className="mt-1 text-sm text-emerald-700 leading-relaxed">
              Blacklight never uses your dealership&apos;s data to train models for other dealers. You can export or delete your data at any time. When you cancel, your data remains available for export for 90 days, then is permanently deleted per your instructions.
            </p>
          </div>
        </div>
      </div>

      {/* Data Inventory */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Data Inventory</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {dataInventory.map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-100 p-4 text-center">
              <item.icon className="mx-auto h-6 w-6 text-gray-400 mb-2" />
              <p className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-gray-900">{item.count.toLocaleString()}</p>
              <p className="text-xs font-medium text-gray-600">{item.label}</p>
              <p className="text-[10px] text-gray-400 mt-1">{item.size}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2">
          <span className="text-sm text-gray-600">Total Data Size</span>
          <span className="font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-gray-900">73.0 MB</span>
        </div>
      </div>

      {/* Export */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">New Export</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Export Type</label>
              <div className="grid grid-cols-2 gap-2">
                {exportTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSelectedExport(t.value)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      selectedExport === t.value ? "border-[#6C2BD9] bg-purple-50" : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <p className="text-sm font-medium text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Format</label>
              <div className="flex gap-2">
                {["CSV", "JSON"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFormat(f)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      selectedFormat === f ? "border-[#6C2BD9] bg-purple-50 text-[#6C2BD9]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button className="w-full rounded-lg bg-[#6C2BD9] py-2.5 text-sm font-semibold text-white hover:bg-[#5B21B6] transition-colors">
              <Download className="mr-2 inline h-4 w-4" />
              Request Export
            </button>
            <p className="text-xs text-gray-400 text-center">Export will be processed async. Download link sent via email and available here.</p>
          </div>
        </div>

        {/* Export History */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Export History</h2>
          <div className="space-y-3">
            {exports.map((exp) => (
              <div key={exp.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{exp.type} Export</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{exp.format}</span>
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    exp.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {exp.status === "COMPLETED" ? "Ready" : "Processing..."}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{exp.requestedAt}</span>
                  <span>{exp.fileSize || "—"} · {exp.recordCount ? `${exp.recordCount.toLocaleString()} records` : "—"}</span>
                </div>
                {exp.status === "COMPLETED" && (
                  <button className="mt-2 flex items-center gap-1 text-xs font-medium text-[#6C2BD9] hover:text-[#5B21B6]">
                    <Download className="h-3 w-3" /> Download (expires in 24h)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
