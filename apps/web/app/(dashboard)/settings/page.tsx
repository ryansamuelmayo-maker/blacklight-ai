"use client"

import { Building2, Clock, MapPin, Image } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
        <p className="text-sm text-gray-500">Manage your dealership profile and preferences</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
            <Building2 className="h-4 w-4 text-gray-400" /> Dealership Profile
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dealership Name</label>
              <input type="text" defaultValue="Premier Auto Group" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
              <input type="text" defaultValue="premier-auto-group" disabled className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input type="text" defaultValue="1234 Auto Drive, Springfield, IL 62701" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input type="text" defaultValue="(555) 100-2000" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Timezone</label>
              <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none">
                <option>America/New_York</option>
                <option>America/Chicago</option>
                <option>America/Denver</option>
                <option>America/Los_Angeles</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
            <Clock className="h-4 w-4 text-gray-400" /> Business Hours
          </h3>
          <div className="space-y-2">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <div key={day} className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-600">{day}</span>
                <input type="text" defaultValue={day === "Sunday" ? "Closed" : "9:00 AM"} className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-center focus:border-[#6C2BD9] focus:outline-none" />
                <span className="text-xs text-gray-400">to</span>
                <input type="text" defaultValue={day === "Sunday" ? "" : day === "Saturday" ? "5:00 PM" : "7:00 PM"} disabled={day === "Sunday"} className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-center focus:border-[#6C2BD9] focus:outline-none disabled:bg-gray-50" />
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
            <Image className="h-4 w-4 text-gray-400" /> Branding
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <span className="text-xs text-gray-400">Logo</span>
            </div>
            <div>
              <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Upload Logo</button>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB. 200x200px recommended.</p>
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
