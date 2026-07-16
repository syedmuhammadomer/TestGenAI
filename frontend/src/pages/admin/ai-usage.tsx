'use client'

import React from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Cpu, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'

const DAILY = [180, 240, 195, 380, 290, 420, 350, 480, 310, 290, 510, 440, 380, 260]
const MAX_DAILY = Math.max(...DAILY)

const TOP_CONSUMERS = [
  { name: 'BuildRight Solutions', tokens: 4800, limit: 5000, cost: '$4.80' },
  { name: 'DevFlow Inc', tokens: 2100, limit: 5000, cost: '$2.10' },
  { name: 'Acme Corp', tokens: 340, limit: 1000, cost: '$0.34' },
  { name: 'Startup Labs', tokens: 190, limit: 200, cost: '$0.19' },
  { name: 'TechVision Ltd', tokens: 80, limit: 200, cost: '$0.08' },
]

const MODELS = [
  { name: 'meta/llama-3.1-8b-instruct', calls: 1284, tokens: '2.4M', cost: '$7.51', pct: 82 },
  { name: 'meta/llama-3.1-70b-instruct', calls: 47, tokens: '0.3M', cost: '$1.20', pct: 14 },
  { name: 'Other', calls: 12, tokens: '0.1M', cost: '$0.30', pct: 4 },
]

export default function AdminAiUsagePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Monitoring</p>
          <h1 className="text-2xl font-bold text-white mt-1">Global AI Usage</h1>
          <p className="text-sm text-slate-400 mt-1">Token consumption across all tenants — current billing cycle</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tokens Used', value: '2.4M', icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Total Cost', value: '$9.01', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Avg per Company', value: '16.9K', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Near-Limit Tenants', value: '2', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[#0d0d16] border border-white/5 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Daily chart */}
        <div className="bg-[#0d0d16] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-5">Daily Token Consumption (Last 14 Days)</h2>
          <div className="flex items-end gap-1.5 h-36">
            {DAILY.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-amber-500/70 hover:bg-amber-400 transition"
                  style={{ height: `${(v / MAX_DAILY) * 100}%` }}
                  title={`${v}k tokens`}
                />
                <span className="text-[9px] text-slate-600">{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-slate-600">
            <span>Jul 1</span><span>Jul 14</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top consumers */}
          <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Top Consumers</h2>
            </div>
            <div className="divide-y divide-white/5">
              {TOP_CONSUMERS.map((c) => {
                const pct = Math.round((c.tokens / c.limit) * 100)
                const nearLimit = pct >= 90
                return (
                  <div key={c.name} className="px-5 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      <div className="flex items-center gap-2">
                        {nearLimit && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                        <span className="text-xs text-slate-400">{c.tokens}/{c.limit} · {c.cost}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${nearLimit ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-600">{pct}% of monthly allowance</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Model breakdown */}
          <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Model Breakdown</h2>
            </div>
            <div className="divide-y divide-white/5">
              {MODELS.map((m) => (
                <div key={m.name} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-slate-300 truncate max-w-[200px]">{m.name}</p>
                    <span className="text-xs text-slate-400">{m.cost}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>{m.calls} calls · {m.tokens} tokens</span>
                    <span>{m.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
