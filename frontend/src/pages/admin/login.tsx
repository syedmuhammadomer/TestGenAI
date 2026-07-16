'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email and password are required'); return }

    setLoading(true)
    // Demo: accept superadmin@testgen.ai / superadmin123
    await new Promise((r) => setTimeout(r, 800))
    if (email === 'superadmin@testgen.ai' && password === 'superadmin123!') {
      localStorage.setItem('adminToken', 'demo-super-admin-token')
      localStorage.setItem('adminUser', JSON.stringify({ firstName: 'Super', lastName: 'Admin', role: 'super_admin' }))
      router.push('/admin')
    } else {
      setError('Invalid super admin credentials')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Super Admin</h1>
          <p className="text-slate-400 text-sm mt-1">TestGen AI Platform Console</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#0d0d16] border border-white/8 rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@testgen.ai"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition disabled:opacity-60"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</> : 'Sign in to Admin Console'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-4">
          Demo credentials: superadmin@testgen.ai / superadmin123
        </p>
      </div>
    </div>
  )
}
