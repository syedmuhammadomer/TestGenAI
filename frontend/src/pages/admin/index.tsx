'use client'

import React from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { Building2, Users, Cpu, Activity, TrendingUp, AlertTriangle, CheckCircle2, Clock, XCircle, DollarSign, ArrowUpRight } from 'lucide-react'

const kpis = [
  { label: 'Total Companies', value: '142', delta: '+8 this month', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Active Seats', value: '1,847', delta: '73% utilization', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'AI Tokens Used', value: '2.4M', delta: 'This billing cycle', icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'MRR', value: '$18,340', delta: '+12% vs last month', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

const recentCompanies = [
  { name: 'Acme Corp', plan: 'Pro', seats: '12/25', status: 'active', joined: 'Jul 10, 2026' },
  { name: 'TechVision Ltd', plan: 'Starter', seats: '3/5', status: 'active', joined: 'Jul 8, 2026' },
  { name: 'DevFlow Inc', plan: 'Enterprise', seats: '48/100', status: 'active', joined: 'Jul 5, 2026' },
  { name: 'QualityFirst', plan: 'Pro', seats: '7/25', status: 'suspended', joined: 'Jun 29, 2026' },
  { name: 'NanoSoft', plan: 'Starter', seats: '1/5', status: 'trial', joined: 'Jul 11, 2026' },
]

const jobStats = [
  { label: 'Completed', count: 1284, icon: CheckCircle2, color: 'text-emerald-400' },
  { label: 'Processing', count: 7, icon: Clock, color: 'text-amber-400' },
  { label: 'Queued', count: 3, icon: Activity, color: 'text-blue-400' },
  { label: 'Failed', count: 12, icon: XCircle, color: 'text-rose-400' },
]

const statusBadge: Record<string, string> = {
  active: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40',
  suspended: 'bg-rose-900/30 text-rose-400 border-rose-700/40',
  trial: 'bg-amber-900/30 text-amber-400 border-amber-700/40',
}

export default function AdminOverviewPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Platform Console</p>
          <h1 className="text-2xl font-bold text-white mt-1">Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Platform-wide metrics across all tenant companies</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ label, value, delta, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[#0d0d16] border border-white/5 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              <p className={`text-xs mt-1 ${color}`}>{delta}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Companies */}
          <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Recent Companies</h2>
              <Link href="/admin/companies" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {recentCompanies.map((c) => (
                <div key={c.name} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.plan} · {c.seats} seats · {c.joined}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusBadge[c.status]}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Job Queue Summary */}
          <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">AI Job Queue</h2>
              <Link href="/admin/jobs" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/5">
              {jobStats.map(({ label, count, icon: Icon, color }) => (
                <div key={label} className="bg-[#0d0d16] px-5 py-6 flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${color}`} />
                  <div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-slate-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-white/5">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Success rate</span>
                <span className="text-emerald-400">99.1%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99.1%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Usage bar */}
        <div className="bg-[#0d0d16] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" /> AI Token Consumption (Last 7 Days)
            </h2>
            <Link href="/admin/ai-usage" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              Details <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-end gap-2 h-24">
            {[65, 80, 55, 90, 72, 88, 95].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-amber-500/80 rounded-t-sm" style={{ height: `${h}%` }} />
                <p className="text-[10px] text-slate-600">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alert: failed jobs */}
        {12 > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-700/40 bg-rose-900/15 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-300">12 AI jobs failed in the last 24 hours</p>
              <p className="text-xs text-rose-400/70 mt-0.5">
                <Link href="/admin/jobs" className="underline hover:text-rose-300">View failed jobs</Link> to retry or investigate.
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
