'use client'

import React, { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Shield, Users, Plus, MoreVertical, UserX, Key, Search } from 'lucide-react'

type PlatformRole = 'super_admin' | 'support_agent'

interface PlatformUser {
  id: number
  name: string
  email: string
  role: PlatformRole
  status: 'active' | 'inactive'
  lastLogin: string
  createdAt: string
}

const USERS: PlatformUser[] = [
  { id: 1, name: 'Omar Hassan', email: 'omar@testgen.ai', role: 'super_admin', status: 'active', lastLogin: 'Just now', createdAt: 'Jan 1, 2026' },
  { id: 2, name: 'Sarah Mitchell', email: 'sarah@testgen.ai', role: 'super_admin', status: 'active', lastLogin: '2 hours ago', createdAt: 'Feb 15, 2026' },
  { id: 3, name: 'James Carter', email: 'james@testgen.ai', role: 'support_agent', status: 'active', lastLogin: '1 day ago', createdAt: 'Mar 10, 2026' },
  { id: 4, name: 'Priya Nair', email: 'priya@testgen.ai', role: 'support_agent', status: 'active', lastLogin: '3 hours ago', createdAt: 'Apr 5, 2026' },
  { id: 5, name: 'Alex Thompson', email: 'alex@testgen.ai', role: 'support_agent', status: 'inactive', lastLogin: '14 days ago', createdAt: 'May 20, 2026' },
]

const roleColor: Record<PlatformRole, string> = {
  super_admin: 'bg-red-900/30 text-red-400 border-red-700/40',
  support_agent: 'bg-blue-900/30 text-blue-400 border-blue-700/40',
}

const roleLabel: Record<PlatformRole, string> = {
  super_admin: 'Super Admin',
  support_agent: 'Support Agent',
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [menuId, setMenuId] = useState<number | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<PlatformRole>('support_agent')

  const filtered = USERS.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Access Control</p>
            <h1 className="text-2xl font-bold text-white mt-1">Platform Users</h1>
            <p className="text-sm text-slate-400 mt-1">Internal TestGen AI staff with platform access</p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Invite Staff
          </button>
        </div>

        {/* Invite modal */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
              <h2 className="text-lg font-bold text-white">Invite Staff Member</h2>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-500">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@testgen.ai"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-500">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as PlatformRole)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                >
                  <option value="support_agent">Support Agent</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setShowInvite(false); setInviteEmail('') }}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowInvite(false); setInviteEmail('') }}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Super Admins', count: USERS.filter((u) => u.role === 'super_admin').length, icon: Shield, color: 'text-red-400' },
            { label: 'Support Agents', count: USERS.filter((u) => u.role === 'support_agent').length, icon: Users, color: 'text-blue-400' },
            { label: 'Inactive', count: USERS.filter((u) => u.status === 'inactive').length, icon: UserX, color: 'text-slate-400' },
          ].map(({ label, count, icon: Icon, color }) => (
            <div key={label} className="bg-[#0d0d16] border border-white/5 rounded-xl p-4 flex items-center gap-3">
              <Icon className={`w-6 h-6 ${color}`} />
              <div>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          />
        </div>

        {/* Table */}
        <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Staff Member</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Role</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Status</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Last Login</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Added</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-white/2 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300">
                        {user.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleColor[user.role]}`}>
                      {roleLabel[user.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${user.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{user.lastLogin}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{user.createdAt}</td>
                  <td className="px-5 py-3.5">
                    <div className="relative">
                      <button
                        onClick={() => setMenuId(menuId === user.id ? null : user.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuId === user.id && (
                        <div className="absolute right-0 top-8 z-10 w-40 bg-[#12121e] border border-white/10 rounded-xl shadow-2xl py-1">
                          <button onClick={() => setMenuId(null)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 transition">
                            <Key className="w-3.5 h-3.5" /> Reset Password
                          </button>
                          <button onClick={() => setMenuId(null)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-white/5 transition">
                            <UserX className="w-3.5 h-3.5" /> Deactivate
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
