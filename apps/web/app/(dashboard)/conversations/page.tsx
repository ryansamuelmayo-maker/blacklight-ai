"use client"

import { useState } from "react"
import { Bot, MessageSquare, Phone, Mail, Globe, Search, Filter, User } from "lucide-react"
import { cn } from "@/lib/utils"

const conversations = [
  { id: "1", leadName: "Sarah Johnson", agent: "NOVA", channel: "SMS", status: "ACTIVE", lastMessage: "Perfect! I've got you down for Saturday at 10:00 AM...", lastMessageTime: "2m ago", unread: 0, intentScore: 85, humanTakeover: false },
  { id: "2", leadName: "Mike Thompson", agent: "AXEL", channel: "SMS", status: "ACTIVE", lastMessage: "I understand you've been looking at other options. Let me see what we can do...", lastMessageTime: "5m ago", unread: 1, intentScore: 72, humanTakeover: false },
  { id: "3", leadName: "Jessica Chen", agent: "NOVA", channel: "EMAIL", status: "ACTIVE", lastMessage: "Great news — I'm pulling up a real-time valuation on your CR-V...", lastMessageTime: "12m ago", unread: 0, intentScore: 91, humanTakeover: false },
  { id: "4", leadName: "Robert Davis", agent: "AXEL", channel: "SMS", status: "ACTIVE", lastMessage: "Based on current market data, we can offer $18,200 for your Silverado...", lastMessageTime: "18m ago", unread: 2, intentScore: 65, humanTakeover: false },
  { id: "5", leadName: "David Lee", agent: "NOVA", channel: "WEBCHAT", status: "PAUSED", lastMessage: "I'll send you a reminder tomorrow morning!", lastMessageTime: "1h ago", unread: 0, intentScore: 92, humanTakeover: true },
  { id: "6", leadName: "Patricia Martinez", agent: "AXEL", channel: "SMS", status: "ESCALATED", lastMessage: "Let me check with my manager on that offer...", lastMessageTime: "25m ago", unread: 1, intentScore: 78, humanTakeover: false },
]

const channelIcons: Record<string, typeof Phone> = {
  SMS: Phone,
  EMAIL: Mail,
  WEBCHAT: Globe,
}

export default function ConversationsPage() {
  const [selected, setSelected] = useState(conversations[0].id)
  const [agentFilter, setAgentFilter] = useState<"ALL" | "NOVA" | "AXEL">("ALL")

  const filtered = conversations.filter(c => agentFilter === "ALL" || c.agent === agentFilter)
  const active = conversations.find(c => c.id === selected)

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Conversation List */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="border-b p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[#6C2BD9] focus:outline-none"
            />
          </div>
          <div className="flex gap-1">
            {(["ALL", "NOVA", "AXEL"] as const).map(a => (
              <button
                key={a}
                onClick={() => setAgentFilter(a)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-xs font-medium",
                  agentFilter === a ? "bg-[#6C2BD9] text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {a === "ALL" ? "All" : a}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {filtered.map(conv => {
            const ChannelIcon = channelIcons[conv.channel] || MessageSquare
            return (
              <button
                key={conv.id}
                onClick={() => setSelected(conv.id)}
                className={cn(
                  "w-full p-4 text-left transition-colors",
                  selected === conv.id ? "bg-purple-50" : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{conv.leadName}</span>
                  <span className="text-xs text-gray-400">{conv.lastMessageTime}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{conv.lastMessage}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      conv.agent === "NOVA" ? "text-blue-600" : "text-amber-600"
                    )}>
                      <Bot className="h-3 w-3" /> {conv.agent === "NOVA" ? "Nova" : "Axel"}
                    </span>
                    <ChannelIcon className="h-3 w-3 text-gray-400" />
                    {conv.humanTakeover && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                        <User className="h-3 w-3" /> Human
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6C2BD9] text-[10px] font-bold text-white">
                        {conv.unread}
                      </span>
                    )}
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      conv.status === "ACTIVE" ? "bg-emerald-500" :
                      conv.status === "ESCALATED" ? "bg-red-500" :
                      "bg-gray-300"
                    )} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col">
        {active ? (
          <>
            <div className="flex items-center justify-between border-b px-6 py-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{active.leadName}</h2>
                <p className="text-xs text-gray-500">
                  {active.agent === "NOVA" ? "Nova" : "Axel"} · {active.channel} · Intent: {active.intentScore}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!active.humanTakeover && (
                  <button className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">
                    Take Over
                  </button>
                )}
                {active.humanTakeover && (
                  <button className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
                    Release to AI
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Select a conversation to view messages</p>
                <p className="text-xs text-gray-300 mt-1">Full chat interface loads here with AI reasoning panels</p>
              </div>
            </div>
            <div className="border-t p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm focus:border-[#6C2BD9] focus:outline-none"
                />
                <button className="rounded-lg bg-[#6C2BD9] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B21B6]">
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  )
}
