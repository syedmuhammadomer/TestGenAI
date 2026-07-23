'use client'

import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { useTheme } from '@/context/ThemeContext'
import { storage } from '@/utils/config'
import { KeyRound, Loader2, Eye, EyeOff, Camera } from 'lucide-react'
import { toast } from 'sonner'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface ProfileUser {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
}

export default function ProfilePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [user, setUser] = useState<ProfileUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Change password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) { setLoading(false); return }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setUser(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?'

  const fullName = user ? `${user.firstName} ${user.lastName}` : ''

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match')
      return
    }
    if (newPw.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    const token = localStorage.getItem('authToken')
    if (!token) { toast.error('Not authenticated'); return }

    setPwLoading(true)
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to change password')
      toast.success('Password changed successfully')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  const inputCls = `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary-500/40 ${
    isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-primary-500/60'
      : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-primary-400'
  }`

  const disabledInputCls = `w-full rounded-xl border px-4 py-2.5 text-sm cursor-not-allowed ${
    isDark
      ? 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
      : 'bg-zinc-50 border-zinc-200 text-zinc-400'
  }`

  const labelCls = `block text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`

  const cardCls = `rounded-2xl border p-6 ${
    isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
  }`

  return (
    <Layout>
      <div className="max-w-2xl space-y-8 p-6">
        <header>
          <p className={`text-xs uppercase tracking-[0.4em] mb-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Account</p>
          <h1 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Profile</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Your personal information and security settings.
          </p>
        </header>

        {/* Profile card */}
        <section className={cardCls}>
          <h2 className={`text-base font-semibold mb-5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Personal Information
          </h2>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
            </div>
          ) : (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-primary-500/20 ring-2 ring-primary-500/30 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-400">{initials}</span>
                  </div>
                  <div className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center ring-2 ${
                    isDark ? 'bg-zinc-800 ring-zinc-900' : 'bg-zinc-100 ring-white'
                  }`}>
                    <Camera className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                  </div>
                </div>
                <div>
                  <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{fullName}</p>
                  <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{user?.email}</p>
                  <span className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-50 text-primary-700'
                  }`}>
                    {user?.role ?? 'member'}
                  </span>
                </div>
              </div>

              {/* Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>First Name</label>
                  <input
                    type="text"
                    value={user?.firstName ?? ''}
                    disabled
                    className={disabledInputCls}
                    readOnly
                  />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input
                    type="text"
                    value={user?.lastName ?? ''}
                    disabled
                    className={disabledInputCls}
                    readOnly
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Email Address</label>
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className={disabledInputCls}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Change password card */}
        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/15' : 'bg-amber-50'}`}>
              <KeyRound className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current password */}
            <div>
              <label className={labelCls}>Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className={labelCls}>New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min 8 chars, 1 special character"
                  required
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPw && newPw && confirmPw !== newPw && (
                <p className="mt-1.5 text-xs text-rose-500">Passwords do not match</p>
              )}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {pwLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  )
}
