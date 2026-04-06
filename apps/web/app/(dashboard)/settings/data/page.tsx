"use client"

import { Shield, AlertTriangle, Trash2 } from "lucide-react"

export default function DataSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Settings</h1>
        <p className="text-sm text-gray-500">Data retention, privacy, and deletion</p>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-emerald-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-emerald-900">Your Data, Your Rules</h3>
            <p className="mt-1 text-sm text-emerald-700">
              Blacklight stores your data securely and never uses it to train models for other dealerships. All data is encrypted at rest and in transit.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Retention</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Conversation Logs</p>
                <p className="text-xs text-gray-500">Chat messages and AI reasoning traces</p>
              </div>
              <select className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#6C2BD9] focus:outline-none">
                <option>Forever</option>
                <option>2 years</option>
                <option>1 year</option>
                <option>6 months</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Lead Data</p>
                <p className="text-xs text-gray-500">Customer information and intent signals</p>
              </div>
              <select className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#6C2BD9] focus:outline-none">
                <option>Forever</option>
                <option>2 years</option>
                <option>1 year</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Negotiation History</p>
                <p className="text-xs text-gray-500">Offer rounds, strategies, and outcomes</p>
              </div>
              <select className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#6C2BD9] focus:outline-none">
                <option>Forever</option>
                <option>2 years</option>
                <option>1 year</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Export Before Deletion</h3>
          <p className="text-sm text-gray-600 mb-3">
            Before deleting any data, we recommend exporting it first. Visit the Data Vault to create an export.
          </p>
          <a href="/data-vault" className="text-sm font-medium text-[#6C2BD9] hover:text-[#5B21B6]">
            Go to Data Vault →
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-900">Danger Zone</h3>
            <p className="mt-1 text-sm text-red-700 mb-4">
              These actions are irreversible. All data will be permanently deleted after a 90-day grace period.
            </p>
            <button className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
