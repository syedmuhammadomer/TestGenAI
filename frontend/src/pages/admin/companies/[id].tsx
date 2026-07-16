'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import { Building2, Users, FolderOpen, Cpu, CreditCard, ShieldOff, RefreshCw, UserCog, ChevronLeft, Activity, CheckCircle2 } from 'lucide-react'

type CompanyMember = { name: string; email: string; role: string; lastLogin: string }
type CompanyJob = { project: string; status: string; time: string }
type CompanyDetail = {
  id: number; name: string; email: string; plan: string; status: string;
  joined: string; seats: { used: number; total: number }; aiTokens: { used: number; total: number };
  projects: number; storage: string; members: CompanyMember[]; recentJobs: CompanyJob[]
}

const COMPANY_DATA: Record<string, CompanyDetail> = {
  '1': {
    id: 1, name: 'Acme Corp', email: 'admin@acme.com', plan: 'Pro', status: 'active',
    joined: 'Jul 10, 2026', seats: { used: 12, total: 25 }, aiTokens: { used: 340, total: 1000 },
    projects: 7, storage: '2.1 GB',
    members: [
      { name: 'Alice Johnson', email: 'alice@acme.com', role: 'company_admin', lastLogin: '2 hours ago' },
      { name: 'Bob Smith', email: 'bob@acme.com', role: 'pm', lastLogin: '1 day ago' },
      { name: 'Carol White', email: 'carol@acme.com', role: 'qa_engineer', lastLogin: '3 hours ago' },
    ],
    recentJobs: [
      { project: 'Inventory API', status: 'completed', time: '1 hour ago' },
      { project: 'Auth Module', status: 'completed', time: '5 hours ago' },
      { project: 'Payment Service', status: 'failed', time: '12 hours ago' },
    ]
  }
}

export default function CompanyDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const company = COMPANY_DATA[String(id)] ?? COMPANY_DATA['1']
  const [suspended, setSuspended] = useState(false)
  const [impersonating, setImpersonating] = useState(false)
  const [tab, setTab] = useState<'overview' | 'members' | 'jobs'>('overview')

  const jobColor: Record<string, string> = {
    completed: 'text-emerald-400',
    failed: 'text-rose-400',
    processing: 'text-amber-400',
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back + Header */}
        <div>
          <button onClick={() => router.push('/admin/companies')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white mb-3 transition">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Companies
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-slate-300" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{company.name}</h1>
              <p className="text-sm text-slate-400">{company.email} · Joined {company.joined}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setImpersonating(true); setTimeout(() => setImpersonating(false), 2000) }}
                disabled={impersonating}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-xs font-medium transition"
              >
                <UserCog className="w-3.5 h-3.5" />
                {impersonating ? 'Opening session…' : 'Impersonate'}
              </button>
              <button
                onClick={() => setSuspended(!suspended)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${suspended ? 'bg-emerald-700/20 text-emerald-400 hover:bg-emerald-700/30' : 'bg-rose-700/20 text-rose-400 hover:bg-rose-700/30'}`}
              >
                {suspended ? <><RefreshCw className="w-3.5 h-3.5" /> Reactivate</> : <><ShieldOff className="w-3.5 h-3.5" /> Suspend</>}
              </button>
            </div>
          </div>
        </div>

        {suspended && (
          <div className="bg-rose-900/20 border border-rose-700/40 rounded-xl px-4 py-3 text-sm text-rose-300">
            This company is currently suspended. All users are locked out.
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Plan', value: company.plan, icon: CreditCard, color: 'text-purple-400' },
            { label: 'Seats', value: `${company.seats.used}/${company.seats.total}`, icon: Users, color: 'text-blue-400' },
            { label: 'Projects', value: company.projects, icon: FolderOpen, color: 'text-emerald-400' },
            { label: 'AI Tokens', value: `${company.aiTokens.used}/${company.aiTokens.total}`, icon: Cpu, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#0d0d16] border border-white/5 rounded-xl p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/5 pb-0">
          {(['overview', 'members', 'jobs'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize rounded-t-lg transition ${tab === t ? 'text-white border-b-2 border-red-500' : 'text-slate-400 hover:text-white'}`}
            >
              {t === 'jobs' ? 'AI Jobs' : t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0d0d16] border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">AI Token Usage</h3>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Used this cycle</span>
                  <span className="text-amber-400">{Math.round((company.aiTokens.used / company.aiTokens.total) * 100)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(company.aiTokens.used / company.aiTokens.total) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                  <span>0</span><span>{company.aiTokens.total} tokens/mo</span>
                </div>
              </div>
            </div>
            <div className="bg-[#0d0d16] border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Seat Utilization</h3>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{company.seats.used} of {company.seats.total} seats used</span>
                  <span className="text-purple-400">{Math.round((company.seats.used / company.seats.total) * 100)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(company.seats.used / company.seats.total) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Member</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Role</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {company.members.map((m: CompanyMember) => (
                  <tr key={m.email} className="hover:bg-white/2">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-300 bg-white/5 px-2 py-1 rounded-full">{m.role.replace('_', ' ')}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{m.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'jobs' && (
          <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Project</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {company.recentJobs.map((j: CompanyJob, i: number) => (
                  <tr key={i} className="hover:bg-white/2">
                    <td className="px-5 py-3 font-medium text-white">{j.project}</td>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${jobColor[j.status]}`}>
                        {j.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                        {j.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{j.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
