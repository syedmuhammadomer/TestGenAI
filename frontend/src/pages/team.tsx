'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import {
  Shield, Activity, X, Mail, User, Briefcase, ChevronDown, Check,
  Trash2, UserPlus, Pencil, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import { MemberRole, ModuleKey } from '@/types'
import { ALL_MODULES, DEFAULT_MODULES_BY_ROLE, MODULE_LABELS, ROLE_LABELS } from '@/utils/access'
import { teamService, TeamMemberRecord, TeamActivityRecord } from '@/services/teamService'
import { toast } from 'sonner'
import { useProjectContext } from '@/context/ProjectContext'

// ── Role config ────────────────────────────────────────────────────────────────
const ROLES: MemberRole[] = ['company_admin', 'pm', 'qa_engineer', 'developer', 'designer', 'ba', 'viewer']

const ROLE_COLORS: Record<MemberRole, string> = {
  company_admin: 'bg-red-900/30 text-red-300 border-red-700/50',
  pm:            'bg-purple-900/30 text-purple-300 border-purple-700/50',
  qa_engineer:   'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
  developer:     'bg-blue-900/30 text-blue-300 border-blue-700/50',
  designer:      'bg-pink-900/30 text-pink-300 border-pink-700/50',
  ba:            'bg-amber-900/30 text-amber-300 border-amber-700/50',
  viewer:        'bg-slate-800 text-slate-400 border-slate-700',
}

const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  company_admin: 'Full control — billing, team, all projects, all settings',
  pm:            'Manages projects end-to-end, assigns members, tracks RTM',
  qa_engineer:   'Creates & executes test cases, moves backlog to QA/Done',
  developer:     'Views stories/tests/RTM, moves backlog dev columns',
  designer:      'Views projects & documents',
  ba:            'Manages user stories, RTM, documents, and analytics',
  viewer:        'Read-only access to dashboard, stories, tests, RTM, analytics',
}

const MODULE_ACCESS: Record<MemberRole, Record<ModuleKey, 'full' | 'view' | 'none'>> = {
  company_admin: { dashboard:'full', projects:'full', backlogs:'full', user_stories:'full', test_manager:'full', rtm:'full', documents:'full', analytics:'full', team:'full', settings:'full', billing:'full' },
  pm:            { dashboard:'full', projects:'full', backlogs:'full', user_stories:'full', test_manager:'full', rtm:'full', documents:'full', analytics:'full', team:'view', settings:'full', billing:'none' },
  qa_engineer:   { dashboard:'view', projects:'view', backlogs:'view', user_stories:'view', test_manager:'full', rtm:'full', documents:'view', analytics:'view', team:'none', settings:'full', billing:'none' },
  developer:     { dashboard:'view', projects:'view', backlogs:'view', user_stories:'view', test_manager:'view', rtm:'view', documents:'view', analytics:'view', team:'none', settings:'full', billing:'none' },
  designer:      { dashboard:'view', projects:'view', backlogs:'none', user_stories:'none', test_manager:'none', rtm:'none', documents:'full', analytics:'none', team:'none', settings:'full', billing:'none' },
  ba:            { dashboard:'view', projects:'view', backlogs:'none', user_stories:'full', test_manager:'none', rtm:'full', documents:'full', analytics:'view', team:'none', settings:'full', billing:'none' },
  viewer:        { dashboard:'view', projects:'view', backlogs:'none', user_stories:'view', test_manager:'view', rtm:'view', documents:'view', analytics:'view', team:'none', settings:'view', billing:'none' },
}

const accessColor: Record<string, string> = {
  full: 'bg-emerald-500',
  view: 'bg-blue-500',
  none: 'bg-slate-800',
}

const statusDot = (status: string) =>
  status === 'online' ? 'bg-emerald-500' : status === 'invited' ? 'bg-amber-400' : 'bg-slate-500'

const initials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

// ── Invite Modal ──────────────────────────────────────────────────────────────
interface InviteModalProps {
  onClose: () => void
  onInvited: (member: TeamMemberRecord) => void
}

function InviteModal({ onClose, onInvited }: InviteModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('qa_engineer')
  const [project, setProject] = useState('')
  const [modules, setModules] = useState<ModuleKey[]>(DEFAULT_MODULES_BY_ROLE['qa_engineer'])
  const { projects } = useProjectContext()
  const [sendCopy, setSendCopy] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRoleChange = (newRole: MemberRole) => {
    setRole(newRole)
    setModules(DEFAULT_MODULES_BY_ROLE[newRole])
  }

  const toggleModule = (mod: ModuleKey) => {
    setModules((prev) => prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod])
  }

  const handleSubmit = async () => {
    if (!fullName.trim()) { setError('Full name is required'); return }
    if (!email.trim()) { setError('Email is required'); return }
    setError(''); setLoading(true)
    try {
      const member = await teamService.inviteMember({ fullName: fullName.trim(), email: email.trim(), role, project: project.trim() || undefined, modules, sendCopy })
      onInvited(member)
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to send invitation')
    } finally { setLoading(false) }
  }

  return (
    <ModalShell title="Invite Team Member" icon={<UserPlus className="w-4 h-4 text-primary-400" />} onClose={onClose}>
      {error && <p className="text-xs text-rose-400 bg-rose-900/30 border border-rose-700/40 rounded-lg px-4 py-2">{error}</p>}
      <FieldRow icon={<User className="w-4 h-4 text-slate-500" />} label="Full Name">
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sarah Johnson" className={inputCls} />
      </FieldRow>
      <FieldRow icon={<Mail className="w-4 h-4 text-slate-500" />} label="Work Email">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@company.com" className={inputCls} />
      </FieldRow>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Role</label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select value={role} onChange={(e) => handleRoleChange(e.target.value as MemberRole)} className={`${inputCls} pl-9 appearance-none`}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
        <p className="text-xs text-slate-500">{ROLE_DESCRIPTIONS[role]}</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Assigned Project (optional)</label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select value={project} onChange={(e) => setProject(e.target.value)} className={`${inputCls} appearance-none`}>
            <option value="">— No project —</option>
            {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>
      <ModuleGrid modules={modules} onToggle={toggleModule} label="Module Access" hint="auto-filled by role, customize as needed" />
      <SendToggle value={sendCopy} onChange={setSendCopy} />
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} isLoading={loading}>Send Invitation</Button>
      </div>
    </ModalShell>
  )
}

// ── Edit Member Modal ─────────────────────────────────────────────────────────
interface EditModalProps {
  member: TeamMemberRecord
  onClose: () => void
  onSaved: (updated: TeamMemberRecord) => void
}

function EditMemberModal({ member, onClose, onSaved }: EditModalProps) {
  const [role, setRole] = useState<MemberRole>(member.role)
  const [project, setProject] = useState(member.project ?? '')
  const [modules, setModules] = useState<ModuleKey[]>(member.modules ?? DEFAULT_MODULES_BY_ROLE[member.role])
  const { projects } = useProjectContext()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRoleChange = (newRole: MemberRole) => {
    setRole(newRole)
    setModules(DEFAULT_MODULES_BY_ROLE[newRole])
  }

  const toggleModule = (mod: ModuleKey) => {
    setModules((prev) => prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod])
  }

  const handleSave = async () => {
    setError(''); setLoading(true)
    try {
      const updated = await teamService.updateMember(member.id, { role, project: project.trim() || undefined, modules })
      onSaved(updated)
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to update member')
    } finally { setLoading(false) }
  }

  return (
    <ModalShell title={`Edit — ${member.fullName}`} icon={<Pencil className="w-4 h-4 text-primary-400" />} onClose={onClose}>
      {error && <p className="text-xs text-rose-400 bg-rose-900/30 border border-rose-700/40 rounded-lg px-4 py-2">{error}</p>}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Role</label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select value={role} onChange={(e) => handleRoleChange(e.target.value as MemberRole)} className={`${inputCls} pl-9 appearance-none`}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
        <p className="text-xs text-slate-500">{ROLE_DESCRIPTIONS[role]}</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Assigned Project (optional)</label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select value={project} onChange={(e) => setProject(e.target.value)} className={`${inputCls} appearance-none`}>
            <option value="">— No project —</option>
            {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>
      <ModuleGrid modules={modules} onToggle={toggleModule} label="Module Access" hint="customized from role defaults" />
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} isLoading={loading}>Save Changes</Button>
      </div>
    </ModalShell>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────
const inputCls = 'w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500'

function ModalShell({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600/15 flex items-center justify-center">{icon}</div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function FieldRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">{icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}{children}</div>
    </div>
  )
}

function ModuleGrid({ modules, onToggle, label, hint }: { modules: ModuleKey[]; onToggle: (m: ModuleKey) => void; label: string; hint?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        {label} {hint && <span className="ml-2 text-slate-600 normal-case">{hint}</span>}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {ALL_MODULES.map((mod) => {
          const checked = modules.includes(mod)
          return (
            <button key={mod} type="button" onClick={() => onToggle(mod)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left ${checked ? 'bg-primary-600/15 border-primary-600/40 text-primary-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${checked ? 'bg-primary-600 border-primary-600' : 'border-slate-600'}`}>
                {checked && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              {MODULE_LABELS[mod]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SendToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-t border-slate-800">
      <div>
        <p className="text-sm font-medium text-slate-300">Send invitation email</p>
        <p className="text-xs text-slate-500">Member will receive a link to register</p>
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${value ? 'bg-primary-600' : 'bg-slate-700'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

// ── RBAC Matrix ───────────────────────────────────────────────────────────────
const MATRIX_ROLES: MemberRole[] = ['company_admin', 'pm', 'qa_engineer', 'developer', 'ba', 'viewer']
const MATRIX_ROLE_LABELS: Record<MemberRole, string> = { company_admin: 'Admin', pm: 'PM', qa_engineer: 'QA', developer: 'Dev', designer: 'Design', ba: 'BA', viewer: 'Viewer' }

function RbacMatrix() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800">
        <Shield className="w-4 h-4 text-primary-400" />
        <h3 className="text-base font-semibold text-white">RBAC Permission Matrix</h3>
        <div className="ml-auto flex items-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Full</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> View</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700 inline-block" /> None</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-2.5 text-slate-400 font-semibold w-32">Module</th>
              {MATRIX_ROLES.map((r) => (
                <th key={r} className="px-2 py-2.5 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${ROLE_COLORS[r]}`}>
                    {MATRIX_ROLE_LABELS[r]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {ALL_MODULES.map((mod, i) => (
              <tr key={mod} className={i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'}>
                <td className="px-4 py-2 text-slate-300 font-medium">{MODULE_LABELS[mod]}</td>
                {MATRIX_ROLES.map((r) => {
                  const level = MODULE_ACCESS[r][mod]
                  return (
                    <td key={r} className="px-2 py-2 text-center">
                      <span title={level} className={`inline-block w-5 h-5 rounded ${accessColor[level]}`}>
                        {level === 'full' && <CheckCircle2 className="w-3 h-3 text-emerald-200 mx-auto mt-1" />}
                        {level === 'view' && <span className="text-blue-200 text-[8px] font-bold leading-5 block">V</span>}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const [members, setMembers] = useState<TeamMemberRecord[]>([])
  const [activity, setActivity] = useState<TeamActivityRecord[]>([])
  const [stats, setStats] = useState({ totalMembers: 0, activeNow: 0, avgTestCases: 0 })
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [editMember, setEditMember] = useState<TeamMemberRecord | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'members' | 'matrix'>('members')

  const load = useCallback(async () => {
    try {
      const data = await teamService.getDashboard()
      setMembers(data.members)
      setActivity(data.activity)
      setStats(data.stats)
    } catch { /* silently keep state */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleInvited = (member: TeamMemberRecord) => {
    setMembers((prev) => [...prev, member])
    setStats((prev) => ({ ...prev, totalMembers: prev.totalMembers + 1 }))
    setShowInvite(false)
    toast.success(`Invitation sent to ${member.fullName}`)
  }

  const handleSaved = (updated: TeamMemberRecord) => {
    setMembers((prev) => prev.map((m) => m.id === updated.id ? updated : m))
    setEditMember(null)
    toast.success(`${updated.fullName} updated successfully`)
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await teamService.deleteMember(id)
      const removed = members.find((m) => m.id === id)
      setMembers((prev) => prev.filter((m) => m.id !== id))
      setStats((prev) => ({ ...prev, totalMembers: Math.max(0, prev.totalMembers - 1) }))
      toast.success(`${removed?.fullName ?? 'Member'} removed from workspace`)
    } catch {
      toast.error('Failed to remove member')
    } finally { setDeletingId(null) }
  }

  return (
    <Layout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Workspace</p>
            <h1 className="text-2xl font-bold text-white">Team Management</h1>
            <p className="text-sm text-slate-400 mt-0.5">Invite members, assign roles, and control module access.</p>
          </div>
          <Button size="md" onClick={() => setShowInvite(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Invite Member
          </Button>
        </header>

        {/* Stats */}
        <section className="grid gap-5 sm:grid-cols-3">
          {[
            { label: 'Total Members', value: stats.totalMembers, color: 'text-white' },
            { label: 'Active Now', value: stats.activeNow, color: 'text-emerald-400' },
            { label: 'Avg. Test Cases', value: stats.avgTestCases, color: 'text-primary-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800">
          {(['members', 'matrix'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition ${activeTab === t ? 'text-white border-b-2 border-primary-500' : 'text-slate-400 hover:text-white'}`}>
              {t === 'matrix' ? 'RBAC Matrix' : 'Members'}
            </button>
          ))}
        </div>

        {activeTab === 'matrix' && <RbacMatrix />}

        {activeTab === 'members' && (
          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            {/* Members list */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Members</h2>
                <span className="text-xs text-slate-400">{stats.activeNow} active now</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : members.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-400 text-sm">No members yet.</p>
                  <button onClick={() => setShowInvite(true)} className="mt-2 text-xs text-primary-400 hover:text-primary-300 underline">
                    Invite the first member
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 gap-3">
                      {/* Avatar + info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full bg-primary-700 text-white flex items-center justify-center text-xs font-semibold">
                            {initials(member.fullName)}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${statusDot(member.status)}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{member.fullName}</p>
                          <p className="text-xs text-slate-400 truncate">{member.email}</p>
                        </div>
                      </div>

                      {/* Role badge + project + actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ROLE_COLORS[member.role]}`}>
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                        {member.project && (
                          <span className="hidden md:inline text-xs text-slate-500 truncate max-w-[90px]">{member.project}</span>
                        )}
                        <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] ${member.status === 'invited' ? 'text-amber-400' : member.status === 'online' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {member.status === 'invited' ? <XCircle className="w-3 h-3" /> : member.status === 'online' ? <CheckCircle2 className="w-3 h-3" /> : null}
                          {member.status}
                        </span>
                        <button
                          onClick={() => setEditMember(member)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-900/20 transition"
                          aria-label="Edit member"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          disabled={deletingId === member.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition disabled:opacity-40"
                          aria-label="Remove member"
                        >
                          {deletingId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: activity + role legend */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white">Recent Activity</h3>
                  <Activity className="w-4 h-4 text-slate-500" />
                </div>
                {activity.length === 0 ? (
                  <p className="text-xs text-slate-500">No activity yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {activity.map((item) => (
                      <li key={item.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <p className="text-sm text-white"><span className="font-semibold">{item.actor}</span> {item.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.timeLabel}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Role legend */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Role Descriptions</h3>
                </div>
                <div className="space-y-2">
                  {ROLES.map((r) => (
                    <div key={r} className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider mb-1 ${ROLE_COLORS[r]}`}>
                        {ROLE_LABELS[r]}
                      </span>
                      <p className="text-[11px] text-slate-500">{ROLE_DESCRIPTIONS[r]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={handleInvited} />}
      {editMember && <EditMemberModal member={editMember} onClose={() => setEditMember(null)} onSaved={handleSaved} />}
    </Layout>
  )
}
