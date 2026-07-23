'use client'

import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { useTheme } from '@/context/ThemeContext'
import { settingsService, ManagedUser } from '@/services/settingsService'
import { storage } from '@/utils/config'
import {
  Moon, Sun, ShieldCheck, Loader2, AlertTriangle, Check,
  User, Building2, Briefcase, Lock, Eye, EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'

type Tab = 'profile' | 'theme' | 'permissions'

const inputCls = 'w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition'
const labelCls = 'block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [tab, setTab] = useState<Tab>('profile')

  // ── auth state ──
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [roleLoading, setRoleLoading] = useState(true)

  // ── profile state ──
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', companyName: '', jobTitle: '' })
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)

  // ── password state ──
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [pwSaving, setPwSaving] = useState(false)

  // ── permissions state ──
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // Load me on mount
  useEffect(() => {
    let cancelled = false
    const cachedUser = storage.getUser()
    if (cachedUser) {
      setIsAdmin(cachedUser.role === 'admin')
      setCurrentUserId(cachedUser.id ?? null)
      setProfile({
        firstName: cachedUser.firstName ?? '',
        lastName: cachedUser.lastName ?? '',
        email: cachedUser.email ?? '',
        companyName: (cachedUser as any).companyName ?? '',
        jobTitle: (cachedUser as any).jobTitle ?? '',
      })
    }
    settingsService.getMe().then((me) => {
      if (cancelled) return
      setIsAdmin(me.role === 'admin')
      setCurrentUserId(me.id)
      setProfile({
        firstName: me.firstName,
        lastName: me.lastName,
        email: me.email,
        companyName: me.companyName ?? '',
        jobTitle: me.jobTitle ?? '',
      })
    }).catch(() => {}).finally(() => { if (!cancelled) { setRoleLoading(false); setProfileLoading(false) } })
    return () => { cancelled = true }
  }, [])

  // Load users when permissions tab opens
  useEffect(() => {
    if (tab !== 'permissions' || !isAdmin) return
    let cancelled = false
    setUsersLoading(true); setUsersError(null)
    settingsService.listUsers()
      .then((data) => { if (!cancelled) setUsers(data) })
      .catch((e) => { if (!cancelled) setUsersError(e.message || 'Failed to load users') })
      .finally(() => { if (!cancelled) setUsersLoading(false) })
    return () => { cancelled = true }
  }, [tab, isAdmin])

  const handleProfileSave = async () => {
    setProfileSaving(true)
    try {
      const updated = await settingsService.updateProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        companyName: profile.companyName.trim(),
        jobTitle: profile.jobTitle.trim(),
      })
      setProfile((p) => ({ ...p, ...updated, companyName: updated.companyName ?? '', jobTitle: updated.jobTitle ?? '' }))
      // Update localStorage cache
      const cached = storage.getUser()
      if (cached) storage.setUser({ ...cached, ...updated })
      toast.success('Profile updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save profile')
    } finally { setProfileSaving(false) }
  }

  const handlePasswordChange = async () => {
    if (!pw.current) { toast.error('Enter your current password'); return }
    if (pw.next.length < 6) { toast.error('New password must be at least 6 characters'); return }
    if (pw.next !== pw.confirm) { toast.error('Passwords do not match'); return }
    setPwSaving(true)
    try {
      await settingsService.changePassword(pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      toast.success('Password changed successfully')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to change password')
    } finally { setPwSaving(false) }
  }

  const handleRoleChange = async (user: ManagedUser, role: 'admin' | 'member') => {
    if (role === user.role) return
    setUpdatingId(user.id)
    try {
      const updated = await settingsService.updateUserRole(user.id, role)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      toast.success(`${updated.firstName} ${updated.lastName} is now ${updated.role}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role')
    } finally { setUpdatingId(null) }
  }

  const avatarInitials = [profile.firstName[0], profile.lastName[0]].filter(Boolean).join('').toUpperCase() || '?'

  const TABS: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'theme', label: 'Theme' },
    { key: 'permissions', label: 'User Permissions' },
  ]

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-3xl">
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Workspace</p>
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-slate-500">Manage your profile, appearance, and team permissions.</p>
        </header>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-slate-800">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === key ? 'border-primary-600 text-primary-400' : 'border-transparent text-slate-500 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="space-y-6">
            {profileLoading ? (
              <div className="flex items-center gap-2 text-slate-500 py-8">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading profile…
              </div>
            ) : (
              <>
                {/* Avatar + name hero */}
                <div className="flex items-center gap-5 p-6 rounded-2xl border border-slate-800 bg-slate-900">
                  <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-600/30 flex items-center justify-center text-2xl font-bold text-primary-300 shrink-0">
                    {avatarInitials}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{profile.firstName} {profile.lastName}</p>
                    {profile.companyName && <p className="text-sm text-slate-400">{profile.companyName}</p>}
                    {profile.jobTitle && <p className="text-xs text-slate-500">{profile.jobTitle}</p>}
                    <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
                  </div>
                </div>

                {/* Profile form */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-primary-400" />
                    <h2 className="text-base font-semibold text-white">Personal Information</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>First Name</label>
                      <input value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                        className={inputCls} placeholder="First name" />
                    </div>
                    <div>
                      <label className={labelCls}>Last Name</label>
                      <input value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                        className={inputCls} placeholder="Last name" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <input value={profile.email} disabled
                      className={`${inputCls} opacity-50 cursor-not-allowed`} />
                    <p className="text-xs text-slate-600 mt-1">Email cannot be changed</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-white">Company Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input value={profile.companyName} onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
                          className={`${inputCls} pl-10`} placeholder="e.g. Acme Corp" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Job Title</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input value={profile.jobTitle} onChange={(e) => setProfile((p) => ({ ...p, jobTitle: e.target.value }))}
                          className={`${inputCls} pl-10`} placeholder="e.g. QA Lead" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button onClick={handleProfileSave} disabled={profileSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition disabled:opacity-60">
                      {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </section>

                {/* Change password */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <h2 className="text-base font-semibold text-white">Change Password</h2>
                  </div>
                  {(['current', 'next', 'confirm'] as const).map((field) => {
                    const labels = { current: 'Current Password', next: 'New Password', confirm: 'Confirm New Password' }
                    return (
                      <div key={field}>
                        <label className={labelCls}>{labels[field]}</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type={showPw[field] ? 'text' : 'password'}
                            value={pw[field]}
                            onChange={(e) => setPw((p) => ({ ...p, [field]: e.target.value }))}
                            className={`${inputCls} pl-10 pr-10`}
                            placeholder={field === 'current' ? 'Enter current password' : field === 'next' ? 'At least 6 characters' : 'Repeat new password'}
                          />
                          <button type="button" onClick={() => setShowPw((p) => ({ ...p, [field]: !p[field] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                            {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex justify-end pt-1">
                    <button onClick={handlePasswordChange} disabled={pwSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-700/40 text-sm font-semibold transition disabled:opacity-60">
                      {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Update Password
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* ── THEME TAB ── */}
        {tab === 'theme' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
            <p className="text-sm text-slate-400">Choose how the app looks. Your preference is saved to this browser.</p>
            <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
              <button onClick={() => setTheme('light')}
                className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-colors ${
                  theme === 'light' ? 'border-primary-600 bg-primary-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}>
                <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Light Mode</p>
                  <p className="text-xs text-slate-400">Bright background, dark text</p>
                </div>
                {theme === 'light' && <Check className="h-4 w-4 text-primary-600 ml-auto shrink-0" />}
              </button>
              <button onClick={() => setTheme('dark')}
                className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-colors ${
                  theme === 'dark' ? 'border-primary-600 bg-primary-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}>
                <Moon className="h-5 w-5 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Dark Mode</p>
                  <p className="text-xs text-slate-400">Dark background, light text</p>
                </div>
                {theme === 'dark' && <Check className="h-4 w-4 text-primary-600 ml-auto shrink-0" />}
              </button>
            </div>
          </section>
        )}

        {/* ── PERMISSIONS TAB ── */}
        {tab === 'permissions' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white">User Permissions & Role Management</h2>
            </div>
            {roleLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking your access level…
              </div>
            ) : !isAdmin ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Only administrators can view and manage user roles. Contact an admin if you need access changed.</p>
              </div>
            ) : usersLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
              </div>
            ) : usersError ? (
              <div className="rounded-xl border border-red-700/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">{usersError}</div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {user.firstName} {user.lastName}
                        {user.id === currentUserId && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {updatingId === user.id && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                      <select value={user.role} disabled={updatingId === user.id}
                        onChange={(e) => handleRoleChange(user, e.target.value as 'admin' | 'member')}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60">
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  )
}
