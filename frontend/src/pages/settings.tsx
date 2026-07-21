'use client'

import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { useTheme } from '@/context/ThemeContext'
import { settingsService, ManagedUser } from '@/services/settingsService'
import { storage } from '@/utils/config'
import { Moon, Sun, ShieldCheck, Loader2, AlertTriangle, Check } from 'lucide-react'

type Tab = 'theme' | 'permissions'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [tab, setTab] = useState<Tab>('theme')
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [roleLoading, setRoleLoading] = useState(true)

  const [users, setUsers] = useState<ManagedUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    const cachedUser = storage.getUser()
    if (cachedUser?.role) {
      setIsAdmin(cachedUser.role === 'admin')
      setCurrentUserId(cachedUser.id ?? null)
    }

    settingsService
      .getMe()
      .then((me) => {
        if (cancelled) return
        setIsAdmin(me.role === 'admin')
        setCurrentUserId(me.id)
      })
      .catch(() => {
        // fall back to cached role if the request fails (e.g. offline)
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (tab !== 'permissions' || !isAdmin) return
    let cancelled = false
    setUsersLoading(true)
    setUsersError(null)
    settingsService
      .listUsers()
      .then((data) => {
        if (!cancelled) setUsers(data)
      })
      .catch((error) => {
        if (!cancelled) setUsersError(error.message || 'Failed to load users')
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab, isAdmin])

  const handleRoleChange = async (user: ManagedUser, role: 'admin' | 'member') => {
    if (role === user.role) return
    setUpdatingId(user.id)
    setBanner(null)
    try {
      const updated = await settingsService.updateUserRole(user.id, role)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setBanner({ type: 'success', text: `${updated.firstName} ${updated.lastName} is now ${updated.role}.` })
    } catch (error) {
      setBanner({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update role' })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-5xl">
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Workspace</p>
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Manage the appearance of the app and control who has administrative access.
          </p>
        </header>

        <div className="flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setTab('theme')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'theme'
                ? 'border-primary-600 text-primary-400'
                : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            Theme
          </button>
          <button
            onClick={() => setTab('permissions')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'permissions'
                ? 'border-primary-600 text-primary-400'
                : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            User Permissions
          </button>
        </div>

        {tab === 'theme' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-soft space-y-4">
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
            <p className="text-sm text-slate-400">
              Choose how the app looks. Your preference is saved to this browser and applied automatically next time you visit.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-colors ${
                  theme === 'light' ? 'border-primary-600 bg-primary-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Light Mode</p>
                  <p className="text-xs text-slate-400">Bright background, dark text</p>
                </div>
                {theme === 'light' && <Check className="h-4 w-4 text-primary-600 ml-auto shrink-0" />}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-colors ${
                  theme === 'dark' ? 'border-primary-600 bg-primary-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
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

        {tab === 'permissions' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-white">User Permissions & Role Management</h2>
            </div>

            {roleLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking your access level...
              </div>
            ) : !isAdmin ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-300">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Only administrators can view and manage user roles. Contact an admin if you need access changed.</p>
              </div>
            ) : (
              <>
                {banner && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm ${
                      banner.type === 'success'
                        ? 'border border-emerald-700/40 bg-emerald-900/20 text-emerald-300'
                        : 'border border-red-700/40 bg-red-900/20 text-red-300'
                    }`}
                  >
                    {banner.text}
                  </div>
                )}

                {usersLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
                  </div>
                ) : usersError ? (
                  <div className="rounded-xl border border-red-700/40 bg-red-900/20 px-4 py-3 text-sm text-red-300">{usersError}</div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {user.firstName} {user.lastName}
                            {user.id === currentUserId && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                          </p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {updatingId === user.id && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                          <select
                            value={user.role}
                            disabled={updatingId === user.id}
                            onChange={(event) => handleRoleChange(user, event.target.value as 'admin' | 'member')}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </Layout>
  )
}
