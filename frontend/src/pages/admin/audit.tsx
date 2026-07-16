'use client'

import React, { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { FileText, Search, Download, Shield, UserCog, Trash2, CreditCard, Settings, ShieldOff } from 'lucide-react'

type ActionType = 'impersonation' | 'plan_change' | 'suspension' | 'deletion' | 'role_change' | 'data_export' | 'system'

interface AuditEntry {
  id: string
  actor: string
  actorRole: 'super_admin' | 'support_agent'
  action: string
  type: ActionType
  target: string
  timestamp: string
  ip: string
}

const ENTRIES: AuditEntry[] = [
  { id: 'AUD-1024', actor: 'Omar Hassan', actorRole: 'super_admin', action: 'Suspended company', type: 'suspension', target: 'QualityFirst', timestamp: 'Jul 11, 2026 14:32', ip: '192.168.1.1' },
  { id: 'AUD-1023', actor: 'Sarah Mitchell', actorRole: 'super_admin', action: 'Changed plan from Starter to Pro', type: 'plan_change', target: 'TechVision Ltd', timestamp: 'Jul 11, 2026 13:15', ip: '10.0.0.5' },
  { id: 'AUD-1022', actor: 'James Carter', actorRole: 'support_agent', action: 'Impersonated company admin', type: 'impersonation', target: 'Acme Corp / alice@acme.com', timestamp: 'Jul 11, 2026 11:48', ip: '10.0.0.8' },
  { id: 'AUD-1021', actor: 'Omar Hassan', actorRole: 'super_admin', action: 'Promoted user to Super Admin', type: 'role_change', target: 'sarah@testgen.ai', timestamp: 'Jul 10, 2026 16:02', ip: '192.168.1.1' },
  { id: 'AUD-1020', actor: 'Omar Hassan', actorRole: 'super_admin', action: 'Exported company data', type: 'data_export', target: 'BuildRight Solutions', timestamp: 'Jul 10, 2026 10:22', ip: '192.168.1.1' },
  { id: 'AUD-1019', actor: 'Sarah Mitchell', actorRole: 'super_admin', action: 'Permanently deleted terminated company', type: 'deletion', target: 'OldCorp Ltd', timestamp: 'Jul 9, 2026 09:10', ip: '10.0.0.5' },
  { id: 'AUD-1018', actor: 'James Carter', actorRole: 'support_agent', action: 'Impersonated company admin', type: 'impersonation', target: 'DevFlow Inc / ops@devflow.com', timestamp: 'Jul 8, 2026 15:30', ip: '10.0.0.8' },
  { id: 'AUD-1017', actor: 'Omar Hassan', actorRole: 'super_admin', action: 'Updated system AI model config', type: 'system', target: 'Platform-wide', timestamp: 'Jul 7, 2026 08:00', ip: '192.168.1.1' },
]

const typeIcon: Record<ActionType, React.ReactNode> = {
  impersonation: <UserCog className="w-3.5 h-3.5" />,
  plan_change: <CreditCard className="w-3.5 h-3.5" />,
  suspension: <ShieldOff className="w-3.5 h-3.5" />,
  deletion: <Trash2 className="w-3.5 h-3.5" />,
  role_change: <Shield className="w-3.5 h-3.5" />,
  data_export: <Download className="w-3.5 h-3.5" />,
  system: <Settings className="w-3.5 h-3.5" />,
}

const typeColor: Record<ActionType, string> = {
  impersonation: 'bg-amber-900/20 text-amber-400 border-amber-700/40',
  plan_change: 'bg-blue-900/20 text-blue-400 border-blue-700/40',
  suspension: 'bg-rose-900/20 text-rose-400 border-rose-700/40',
  deletion: 'bg-rose-900/30 text-rose-300 border-rose-700/50',
  role_change: 'bg-purple-900/20 text-purple-400 border-purple-700/40',
  data_export: 'bg-emerald-900/20 text-emerald-400 border-emerald-700/40',
  system: 'bg-slate-800 text-slate-400 border-slate-700',
}

export default function AdminAuditPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ActionType>('all')

  const filtered = ENTRIES.filter((e) => {
    const matchSearch = `${e.actor} ${e.action} ${e.target}`.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || e.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Compliance</p>
            <h1 className="text-2xl font-bold text-white mt-1">Audit Log</h1>
            <p className="text-sm text-slate-400 mt-1">Immutable record of all sensitive platform actions</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-sm font-medium transition">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit log…"
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 w-56"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | ActionType)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            <option value="all">All Actions</option>
            <option value="impersonation">Impersonation</option>
            <option value="plan_change">Plan Change</option>
            <option value="suspension">Suspension</option>
            <option value="deletion">Deletion</option>
            <option value="role_change">Role Change</option>
            <option value="data_export">Data Export</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Log entries */}
        <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">ID</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Actor</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Action</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Type</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Target</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Timestamp</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/2 transition">
                    <td className="px-5 py-3 font-mono text-[10px] text-slate-500">{entry.id}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white text-xs">{entry.actor}</p>
                      <span className={`text-[9px] uppercase tracking-wider ${entry.actorRole === 'super_admin' ? 'text-red-400' : 'text-blue-400'}`}>
                        {entry.actorRole.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-300">{entry.action}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${typeColor[entry.type]}`}>
                        {typeIcon[entry.type]}
                        {entry.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400 max-w-[160px] truncate">{entry.target}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{entry.timestamp}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{entry.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-white/5 text-xs text-slate-600 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            Showing {filtered.length} of {ENTRIES.length} entries · Logs are immutable and retained for 2 years
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
