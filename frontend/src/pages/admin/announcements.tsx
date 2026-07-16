'use client'

import React, { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Megaphone, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, CheckCircle2 } from 'lucide-react'

type AnnouncementTarget = 'all' | 'pro' | 'enterprise' | 'trial'
type FeatureStatus = 'enabled' | 'disabled' | 'beta'

interface Announcement {
  id: number
  title: string
  body: string
  target: AnnouncementTarget
  active: boolean
  createdAt: string
}

interface FeatureFlag {
  id: number
  key: string
  label: string
  description: string
  status: FeatureStatus
  plans: string[]
}

const ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: 'New Analytics Dashboard', body: 'The enhanced Analytics module is now live with test execution trends and team velocity charts.', target: 'all', active: true, createdAt: 'Jul 10, 2026' },
  { id: 2, title: 'AI Token Allowance Increase', body: 'Pro plan users now get 1,000 tokens/month — up from 500. Enjoy!', target: 'pro', active: true, createdAt: 'Jul 5, 2026' },
  { id: 3, title: 'Scheduled Maintenance', body: 'Platform will be unavailable on Jul 20, 2026 from 02:00–04:00 UTC for infrastructure upgrades.', target: 'all', active: false, createdAt: 'Jul 8, 2026' },
]

const FLAGS: FeatureFlag[] = [
  { id: 1, key: 'rtm_export', label: 'RTM Export (CSV/PDF)', description: 'Allow users to export the traceability matrix', status: 'enabled', plans: ['Pro', 'Enterprise'] },
  { id: 2, key: 'ai_regenerate', label: 'AI Regenerate Single Story', description: 'Regenerate a single user story without reprocessing the entire SRS', status: 'beta', plans: ['Pro', 'Enterprise'] },
  { id: 3, key: 'custom_columns', label: 'Custom Kanban Columns', description: 'Allow PMs to add/rename/delete columns on the Backlog board', status: 'enabled', plans: ['Starter', 'Pro', 'Enterprise'] },
  { id: 4, key: 'sso_saml', label: 'SSO / SAML', description: 'Enterprise single sign-on via SAML 2.0', status: 'enabled', plans: ['Enterprise'] },
  { id: 5, key: 'bulk_invite', label: 'Bulk Team Invite (CSV)', description: 'Import team members via CSV upload', status: 'disabled', plans: ['Enterprise'] },
  { id: 6, key: 'slack_webhooks', label: 'Slack / Teams Webhooks', description: 'Send notifications to Slack or Teams channels', status: 'beta', plans: ['Pro', 'Enterprise'] },
]

const targetLabel: Record<AnnouncementTarget, string> = {
  all: 'All Users', pro: 'Pro Plan', enterprise: 'Enterprise', trial: 'Trial Users'
}
const targetColor: Record<AnnouncementTarget, string> = {
  all: 'bg-blue-900/20 text-blue-400', pro: 'bg-purple-900/20 text-purple-400',
  enterprise: 'bg-amber-900/20 text-amber-400', trial: 'bg-slate-800 text-slate-400'
}
const flagColor: Record<FeatureStatus, string> = {
  enabled: 'bg-emerald-900/20 text-emerald-400 border-emerald-700/40',
  disabled: 'bg-slate-800 text-slate-400 border-slate-700',
  beta: 'bg-amber-900/20 text-amber-400 border-amber-700/40',
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS)
  const [flags, setFlags] = useState(FLAGS)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newTarget, setNewTarget] = useState<AnnouncementTarget>('all')

  const toggleAnnouncement = (id: number) => {
    setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, active: !a.active } : a))
  }

  const deleteAnnouncement = (id: number) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id))
  }

  const cycleFlag = (id: number) => {
    const cycle: FeatureStatus[] = ['enabled', 'beta', 'disabled']
    setFlags((prev) => prev.map((f) => {
      if (f.id !== id) return f
      const next = cycle[(cycle.indexOf(f.status) + 1) % cycle.length]
      return { ...f, status: next }
    }))
  }

  const submitAnnouncement = () => {
    if (!newTitle.trim() || !newBody.trim()) return
    setAnnouncements((prev) => [
      { id: Date.now(), title: newTitle, body: newBody, target: newTarget, active: true, createdAt: 'Just now' },
      ...prev,
    ])
    setShowNew(false); setNewTitle(''); setNewBody('')
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Communications</p>
            <h1 className="text-2xl font-bold text-white mt-1">Announcements &amp; Feature Flags</h1>
            <p className="text-sm text-slate-400 mt-1">Push in-app notices and toggle platform features per plan</p>
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        </div>

        {/* New announcement form */}
        {showNew && (
          <div className="bg-[#0d0d16] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">New Announcement</h2>
              <button onClick={() => setShowNew(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-slate-500">Title</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                placeholder="Announcement title…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-slate-500">Body</label>
              <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
                placeholder="Announcement body…" />
            </div>
            <div className="flex items-center gap-3">
              <select value={newTarget} onChange={(e) => setNewTarget(e.target.value as AnnouncementTarget)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/40">
                <option value="all">All Users</option>
                <option value="pro">Pro Plan</option>
                <option value="enterprise">Enterprise</option>
                <option value="trial">Trial Users</option>
              </select>
              <button onClick={submitAnnouncement} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition">
                <CheckCircle2 className="w-4 h-4" /> Publish
              </button>
            </div>
          </div>
        )}

        {/* Announcements list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Megaphone className="w-4 h-4 text-red-400" /> In-App Announcements</h2>
          {announcements.map((a) => (
            <div key={a.id} className={`bg-[#0d0d16] border rounded-xl p-5 space-y-2 transition ${a.active ? 'border-white/8' : 'border-white/3 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white">{a.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${targetColor[a.target]}`}>{targetLabel[a.target]}</span>
                  {a.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/20 text-emerald-400 font-semibold">Live</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleAnnouncement(a.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition">
                    {a.active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => deleteAnnouncement(a.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/10 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-xs text-slate-400">{a.body}</p>
              <p className="text-[10px] text-slate-600">Created {a.createdAt}</p>
            </div>
          ))}
        </div>

        {/* Feature Flags */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Feature Flags</h2>
          <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Feature</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Plans</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {flags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-white/2 transition">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{flag.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{flag.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {flag.plans.map((p) => (
                          <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-medium">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${flagColor[flag.status]}`}>
                        {flag.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => cycleFlag(flag.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs font-medium transition"
                      >
                        Toggle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
