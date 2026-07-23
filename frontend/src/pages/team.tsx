import React, { useCallback, useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import {
  Shield, Activity, X, Mail, User, Briefcase, ChevronDown, Check,
  Trash2, UserPlus, Pencil, CheckCircle2, XCircle, Loader2, Users,
  ChevronRight, ArrowLeft, Plus,
} from 'lucide-react'
import { MemberRole, ModuleKey } from '@/types'
import { ALL_MODULES, DEFAULT_MODULES_BY_ROLE, MODULE_LABELS, ROLE_LABELS } from '@/utils/access'
import { teamService, TeamMemberRecord, TeamActivityRecord, TeamGroup } from '@/services/teamService'
import { toast } from 'sonner'
import { useProjectContext } from '@/context/ProjectContext'

// ── Role config ───────────────────────────────────────────────────────────────
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
  company_admin: { dashboard:'full', projects:'full', backlogs:'full', user_stories:'full', test_manager:'full', rtm:'full', documents:'full', analytics:'full', team:'full', calendar:'full', settings:'full', billing:'full' },
  pm:            { dashboard:'full', projects:'full', backlogs:'full', user_stories:'full', test_manager:'full', rtm:'full', documents:'full', analytics:'full', team:'view', calendar:'full', settings:'full', billing:'none' },
  qa_engineer:   { dashboard:'view', projects:'view', backlogs:'view', user_stories:'view', test_manager:'full', rtm:'full', documents:'view', analytics:'view', team:'none', calendar:'view', settings:'full', billing:'none' },
  developer:     { dashboard:'view', projects:'view', backlogs:'view', user_stories:'view', test_manager:'view', rtm:'view', documents:'view', analytics:'view', team:'none', calendar:'view', settings:'full', billing:'none' },
  designer:      { dashboard:'view', projects:'view', backlogs:'none', user_stories:'none', test_manager:'none', rtm:'none', documents:'full', analytics:'none', team:'none', calendar:'view', settings:'full', billing:'none' },
  ba:            { dashboard:'view', projects:'view', backlogs:'none', user_stories:'full', test_manager:'none', rtm:'full', documents:'full', analytics:'view', team:'none', calendar:'view', settings:'full', billing:'none' },
  viewer:        { dashboard:'view', projects:'view', backlogs:'none', user_stories:'view', test_manager:'view', rtm:'view', documents:'view', analytics:'view', team:'none', calendar:'view', settings:'view', billing:'none' },
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

// ── Create Team Modal ─────────────────────────────────────────────────────────
function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: (team: TeamGroup) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) { setError('Team name is required'); return }
    setError(''); setLoading(true)
    try {
      const team = await teamService.createTeamGroup({ name: name.trim(), description: description.trim() || undefined })
      onCreated(team)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to create team')
    } finally { setLoading(false) }
  }

  return (
    <ModalShell title="Create Team" icon={<Users className="w-4 h-4 text-primary-400" />} onClose={onClose}>
      {error && <p className="text-xs text-rose-400 bg-rose-900/30 border border-rose-700/40 rounded-lg px-4 py-2">{error}</p>}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Team Name</label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. QA Team, Frontend Squad" className={inputCls} autoFocus />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Description <span className="text-slate-600 normal-case font-normal">(optional)</span>
        </label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this team work on?" rows={3}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none" />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleCreate} isLoading={loading}>Create Team</Button>
      </div>
    </ModalShell>
  )
}

// ── Invite Modal ──────────────────────────────────────────────────────────────
interface InviteModalProps {
  onClose: () => void
  onInvited: (member: TeamMemberRecord) => void
  teams?: TeamGroup[]
  preselectedTeam?: string
}

function InviteModal({ onClose, onInvited, teams = [], preselectedTeam = '' }: InviteModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('qa_engineer')
  const [team, setTeam] = useState(preselectedTeam)
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
      const member = await teamService.inviteMember({
        fullName: fullName.trim(), email: email.trim(), role,
        team: team.trim() || undefined, project: project.trim() || undefined,
        modules, sendCopy,
      })
      onInvited(member)
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to send invitation')
    } finally { setLoading(false) }
  }

  return (
    <ModalShell title="Invite Team Member" icon={<UserPlus className="w-4 h-4 text-primary-400" />} onClose={onClose}>
      {error && <p className="text-xs text-rose-400 bg-rose-900/30 border border-rose-700/40 rounded-lg px-4 py-2">{error}</p>}

      {/* Name + Email */}
      <FieldRow icon={<User className="w-4 h-4 text-slate-500" />} label="Full Name">
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sarah Johnson" className={inputCls} />
      </FieldRow>
      <FieldRow icon={<Mail className="w-4 h-4 text-slate-500" />} label="Work Email">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@company.com" className={inputCls} />
      </FieldRow>

      {/* Role */}
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

      {/* Team selector — always visible */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Team <span className="text-slate-600 normal-case font-normal">(optional)</span>
        </label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          {teams.length > 0 ? (
            <>
              <select value={team} onChange={(e) => setTeam(e.target.value)} className={`${inputCls} appearance-none`}>
                <option value="">— No team —</option>
                {teams.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </>
          ) : (
            <div className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-500 text-sm">
              No teams yet — create one from the Teams tab
            </div>
          )}
        </div>
      </div>

      {/* Project */}
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
function EditMemberModal({ member, onClose, onSaved }: { member: TeamMemberRecord; onClose: () => void; onSaved: (u: TeamMemberRecord) => void }) {
  const [role, setRole] = useState<MemberRole>(member.role)
  const [project, setProject] = useState(member.project ?? '')
  const [modules, setModules] = useState<ModuleKey[]>(member.modules ?? DEFAULT_MODULES_BY_ROLE[member.role])
  const { projects } = useProjectContext()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRoleChange = (newRole: MemberRole) => { setRole(newRole); setModules(DEFAULT_MODULES_BY_ROLE[newRole]) }
  const toggleModule = (mod: ModuleKey) => setModules((prev) => prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod])

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

// ── Member Row (reusable) ─────────────────────────────────────────────────────
function MemberRow({
  member, onEdit, onDelete, deletingId,
}: { member: TeamMemberRecord; onEdit: (m: TeamMemberRecord) => void; onDelete: (id: number) => void; deletingId: number | null }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 gap-3">
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
        <button onClick={() => onEdit(member)} className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-900/20 transition" aria-label="Edit member">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(member.id)} disabled={deletingId === member.id}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition disabled:opacity-40" aria-label="Remove member">
          {deletingId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const [members, setMembers] = useState<TeamMemberRecord[]>([])
  const [activity, setActivity] = useState<TeamActivityRecord[]>([])
  const [stats, setStats] = useState({ totalMembers: 0, activeNow: 0, avgTestCases: 0 })
  const [teams, setTeams] = useState<TeamGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [editMember, setEditMember] = useState<TeamMemberRecord | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'members' | 'teams' | 'matrix'>('members')
  const [selectedTeam, setSelectedTeam] = useState<TeamGroup | null>(null)
  const [invitePreselectedTeam, setInvitePreselectedTeam] = useState('')

  const load = useCallback(async () => {
    try {
      const [data, groups] = await Promise.all([
        teamService.getDashboard(),
        teamService.getTeamGroups(),
      ])
      setMembers(data.members)
      setActivity(data.activity)
      setStats(data.stats)
      setTeams(groups)
    } catch { /* keep state */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const openInvite = (teamName = '') => {
    setInvitePreselectedTeam(teamName)
    setShowInvite(true)
  }

  const handleTeamCreated = (team: TeamGroup) => {
    setTeams((prev) => [...prev, team])
    setShowCreateTeam(false)
    toast.success(`Team "${team.name}" created`)
  }

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

  const teamMembers = selectedTeam ? members.filter((m) => m.team === selectedTeam.name) : []

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
          <div className="flex items-center gap-3">
            <Button size="md" variant="outline" onClick={() => setShowCreateTeam(true)}>
              <Users className="w-4 h-4 mr-2" /> Create Team
            </Button>
            <Button size="md" onClick={() => openInvite()}>
              <UserPlus className="w-4 h-4 mr-2" /> Invite Member
            </Button>
          </div>
        </header>

        {/* Stats */}
        <section className="grid gap-5 sm:grid-cols-3">
          {[
            { label: 'Total Members', value: stats.totalMembers, color: 'text-white' },
            { label: 'Active Now',    value: stats.activeNow,    color: 'text-emerald-400' },
            { label: 'Teams',         value: teams.length,       color: 'text-primary-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </section>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-800">
          {([
            { key: 'members', label: 'Members' },
            { key: 'teams',   label: `Teams${teams.length > 0 ? ` (${teams.length})` : ''}` },
            { key: 'matrix',  label: 'RBAC Matrix' },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => { setActiveTab(key); if (key !== 'teams') setSelectedTeam(null) }}
              className={`px-4 py-2.5 text-sm font-medium transition ${activeTab === key ? 'text-white border-b-2 border-primary-500' : 'text-slate-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── RBAC Matrix ── */}
        {activeTab === 'matrix' && <RbacMatrix />}

        {/* ── MEMBERS TAB ── */}
        {activeTab === 'members' && (
          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">All Members</h2>
                <span className="text-xs text-slate-400">{stats.activeNow} active now</span>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : members.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-slate-400 text-sm">No members yet.</p>
                  <button onClick={() => openInvite()} className="mt-2 text-xs text-primary-400 hover:text-primary-300 underline">
                    Invite the first member
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <MemberRow key={m.id} member={m} onEdit={setEditMember} onDelete={handleDelete} deletingId={deletingId} />
                  ))}
                </div>
              )}
            </div>

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

        {/* ── TEAMS TAB ── */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            {!selectedTeam ? (
              /* Team grid */
              teams.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-600/15 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6 text-primary-400" />
                  </div>
                  <p className="text-white font-semibold">No teams yet</p>
                  <p className="text-sm text-slate-500">Create a team to group members by function or project.</p>
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition"
                  >
                    <Plus className="w-4 h-4" /> Create first team
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map((team) => {
                    const count = members.filter((m) => m.team === team.name).length
                    const teamMemberList = members.filter((m) => m.team === team.name)
                    return (
                      <div
                        key={team.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950 p-5 hover:border-primary-500/40 transition-all cursor-pointer group"
                        onClick={() => setSelectedTeam(team)}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-600/15 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-primary-400" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition mt-1" />
                        </div>
                        <p className="text-base font-semibold text-white truncate">{team.name}</p>
                        {team.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{team.description}</p>
                        )}

                        {/* Member avatars */}
                        <div className="flex items-center gap-2 mt-4">
                          <div className="flex -space-x-2">
                            {teamMemberList.slice(0, 4).map((m) => (
                              <div key={m.id} title={m.fullName}
                                className="w-7 h-7 rounded-full bg-primary-700 text-white flex items-center justify-center text-[10px] font-semibold ring-2 ring-slate-950">
                                {initials(m.fullName)}
                              </div>
                            ))}
                            {count > 4 && (
                              <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-semibold ring-2 ring-slate-950">
                                +{count - 4}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 ml-1">
                            {count} {count === 1 ? 'member' : 'members'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                          <button
                            onClick={(e) => { e.stopPropagation(); openInvite(team.name) }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary-600/15 hover:bg-primary-600/25 text-primary-400 text-xs font-medium transition"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Invite
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedTeam(team) }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                          >
                            <Users className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add team card */}
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="rounded-2xl border border-dashed border-slate-700 hover:border-primary-500/40 bg-slate-950 p-5 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-primary-400 transition min-h-[160px]"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-sm font-medium">New Team</span>
                  </button>
                </div>
              )
            ) : (
              /* Team detail */
              <div className="space-y-5">
                {/* Back + header */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
                  >
                    <ArrowLeft className="w-4 h-4" /> All Teams
                  </button>
                  <span className="text-slate-700">/</span>
                  <span className="text-white font-semibold">{selectedTeam.name}</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
                  {/* Team header */}
                  <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-600/15 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{selectedTeam.name}</h2>
                        {selectedTeam.description && (
                          <p className="text-sm text-slate-400 mt-0.5">{selectedTeam.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => openInvite(selectedTeam.name)}>
                      <UserPlus className="w-4 h-4 mr-1.5" /> Invite to Team
                    </Button>
                  </div>

                  {/* Members list */}
                  <div className="p-6">
                    {teamMembers.length === 0 ? (
                      <div className="py-10 text-center space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mx-auto">
                          <Users className="w-5 h-5 text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-sm">No members in this team yet.</p>
                        <button
                          onClick={() => openInvite(selectedTeam.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/15 text-primary-400 text-xs font-medium hover:bg-primary-600/25 transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Invite first member
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-white">Members</h3>
                          <span className="text-xs text-slate-500">{teamMembers.filter(m => m.status === 'online').length} active</span>
                        </div>
                        {teamMembers.map((m) => (
                          <MemberRow key={m.id} member={m} onEdit={setEditMember} onDelete={handleDelete} deletingId={deletingId} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateTeam && <CreateTeamModal onClose={() => setShowCreateTeam(false)} onCreated={handleTeamCreated} />}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={handleInvited}
          teams={teams}
          preselectedTeam={invitePreselectedTeam}
        />
      )}
      {editMember && <EditMemberModal member={editMember} onClose={() => setEditMember(null)} onSaved={handleSaved} />}
    </Layout>
  )
}
