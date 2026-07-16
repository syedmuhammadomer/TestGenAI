'use client'

import React, { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Building2, Search, MoreVertical, ShieldOff, Eye, Trash2, RefreshCw } from 'lucide-react'

type CompanyStatus = 'active' | 'suspended' | 'trial' | 'terminated'
type Plan = 'Free Trial' | 'Starter' | 'Pro' | 'Enterprise'

interface Company {
  id: number
  name: string
  email: string
  plan: Plan
  seats: { used: number; total: number }
  aiTokens: { used: number; total: number }
  status: CompanyStatus
  joined: string
  lastActive: string
  projects: number
}

const COMPANIES: Company[] = [
  { id: 1, name: 'Acme Corp', email: 'admin@acme.com', plan: 'Pro', seats: { used: 12, total: 25 }, aiTokens: { used: 340, total: 1000 }, status: 'active', joined: 'Jul 10, 2026', lastActive: '2 hours ago', projects: 7 },
  { id: 2, name: 'TechVision Ltd', email: 'ceo@techvision.io', plan: 'Starter', seats: { used: 3, total: 5 }, aiTokens: { used: 80, total: 200 }, status: 'active', joined: 'Jul 8, 2026', lastActive: '1 day ago', projects: 2 },
  { id: 3, name: 'DevFlow Inc', email: 'ops@devflow.com', plan: 'Enterprise', seats: { used: 48, total: 100 }, aiTokens: { used: 2100, total: 5000 }, status: 'active', joined: 'Jul 5, 2026', lastActive: '10 min ago', projects: 22 },
  { id: 4, name: 'QualityFirst', email: 'qa@qualityfirst.co', plan: 'Pro', seats: { used: 7, total: 25 }, aiTokens: { used: 0, total: 1000 }, status: 'suspended', joined: 'Jun 29, 2026', lastActive: '5 days ago', projects: 4 },
  { id: 5, name: 'NanoSoft', email: 'hello@nanosoft.dev', plan: 'Free Trial', seats: { used: 1, total: 3 }, aiTokens: { used: 12, total: 50 }, status: 'trial', joined: 'Jul 11, 2026', lastActive: '30 min ago', projects: 1 },
  { id: 6, name: 'BuildRight Solutions', email: 'cto@buildright.com', plan: 'Enterprise', seats: { used: 92, total: 100 }, aiTokens: { used: 4800, total: 5000 }, status: 'active', joined: 'May 2, 2026', lastActive: '5 min ago', projects: 31 },
  { id: 7, name: 'Startup Labs', email: 'founders@startuplabs.io', plan: 'Starter', seats: { used: 4, total: 5 }, aiTokens: { used: 190, total: 200 }, status: 'active', joined: 'Jun 15, 2026', lastActive: '3 days ago', projects: 3 },
]

const statusBadge: Record<CompanyStatus, string> = {
  active: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40',
  suspended: 'bg-rose-900/30 text-rose-400 border-rose-700/40',
  trial: 'bg-amber-900/30 text-amber-400 border-amber-700/40',
  terminated: 'bg-slate-800 text-slate-500 border-slate-700',
}

const planBadge: Record<Plan, string> = {
  'Free Trial': 'bg-slate-800 text-slate-400',
  'Starter': 'bg-blue-900/30 text-blue-400',
  'Pro': 'bg-purple-900/30 text-purple-400',
  'Enterprise': 'bg-amber-900/30 text-amber-400',
}

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | CompanyStatus>('all')
  const [menuId, setMenuId] = useState<number | null>(null)
  const [suspendedIds, setSuspendedIds] = useState<number[]>([4])

  const filtered = COMPANIES.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const toggleSuspend = (id: number) => {
    setSuspendedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
    setMenuId(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Tenants</p>
            <h1 className="text-2xl font-bold text-white mt-1">Company Directory</h1>
            <p className="text-sm text-slate-400 mt-1">{COMPANIES.length} registered companies</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies…"
                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 w-56"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | CompanyStatus)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/2">
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Company</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Plan</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Seats</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">AI Tokens</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Projects</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Last Active</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((company) => {
                  const isSuspended = suspendedIds.includes(company.id)
                  const effectiveStatus: CompanyStatus = isSuspended ? 'suspended' : company.status
                  return (
                    <tr key={company.id} className="hover:bg-white/2 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{company.name}</p>
                            <p className="text-xs text-slate-500">{company.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${planBadge[company.plan]}`}>{company.plan}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="text-white text-xs">{company.seats.used}/{company.seats.total}</p>
                          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(company.seats.used / company.seats.total) * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="text-white text-xs">{company.aiTokens.used}/{company.aiTokens.total}</p>
                          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${(company.aiTokens.used / company.aiTokens.total) > 0.9 ? 'bg-rose-500' : 'bg-amber-500'}`}
                              style={{ width: `${(company.aiTokens.used / company.aiTokens.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-300">{company.projects}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusBadge[effectiveStatus]}`}>
                          {effectiveStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{company.lastActive}</td>
                      <td className="px-5 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setMenuId(menuId === company.id ? null : company.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuId === company.id && (
                            <div className="absolute right-0 top-8 z-10 w-44 bg-[#12121e] border border-white/10 rounded-xl shadow-2xl py-1">
                              <a href={`/admin/companies/${company.id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition">
                                <Eye className="w-3.5 h-3.5" /> View Detail
                              </a>
                              <button
                                onClick={() => toggleSuspend(company.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:bg-white/5 transition"
                              >
                                {isSuspended
                                  ? <><RefreshCw className="w-3.5 h-3.5" /> Reactivate</>
                                  : <><ShieldOff className="w-3.5 h-3.5" /> Suspend</>}
                              </button>
                              <button
                                onClick={() => setMenuId(null)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-white/5 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Terminate
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
