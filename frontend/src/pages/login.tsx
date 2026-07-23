'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight, FileText, GitBranch, TestTube } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useLoginForm } from '@/hooks/useLoginForm'
import { authService } from '@/services/authService'

export default function Login() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const {
    email, password, errors, touched, submitted, loading, authError,
    handleEmailChange, handlePasswordChange, handleBlur, handleSubmit,
  } = useLoginForm()

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => router.push('/dashboard'), 1000)
      return () => clearTimeout(timer)
    }
  }, [submitted, router])

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setGoogleError(null)
      try {
        await authService.googleLogin(tokenResponse.access_token)
        router.push('/dashboard')
      } catch (err: unknown) {
        const e = err as { message?: string }
        setGoogleError(e?.message ?? 'Google sign-in failed')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => setGoogleError('Google sign-in was cancelled or failed'),
  })

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left panel: brand ── */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-600 to-teal-500 p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">TestGen AI</span>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-[0.2em] mb-4">AI-POWERED QA</p>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Generate test cases,<br />
              <span className="italic font-extrabold text-white/80">faster than ever.</span>
            </h2>
            <p className="text-white/70 text-sm mt-4 leading-relaxed max-w-sm">
              Paste your SRS document and get sprint-ready user stories, test cases, and a full RTM — automatically.
            </p>
          </div>

          {/* Mini terminal widget */}
          <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
              <span className="text-white/40 text-xs ml-2 font-mono">ai_analysis.log</span>
            </div>
            {[
              { icon: FileText,  label: 'Reading SRS document',       status: 'done'    },
              { icon: GitBranch, label: 'Generating user stories',     status: 'done'    },
              { icon: TestTube,  label: 'Creating test cases',         status: 'active'  },
            ].map(({ icon: Icon, label, status }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  status === 'done'   ? 'bg-emerald-400/20' :
                  status === 'active' ? 'bg-white/20 animate-pulse' :
                  'bg-white/10'
                }`}>
                  <Icon className={`w-3 h-3 ${
                    status === 'done'   ? 'text-emerald-300' :
                    status === 'active' ? 'text-white' :
                    'text-white/30'
                  }`} />
                </div>
                <span className={`text-xs font-mono ${
                  status === 'done'   ? 'text-emerald-300' :
                  status === 'active' ? 'text-white' :
                  'text-white/30'
                }`}>{label}</span>
                {status === 'done' && <span className="ml-auto text-emerald-400 text-xs">✓</span>}
                {status === 'active' && (
                  <span className="ml-auto flex gap-0.5">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1 h-1 rounded-full bg-white/60 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['#f97316','#8b5cf6','#06b6d4','#10b981'].map((color, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: color }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-white/70 text-sm"><span className="text-white font-semibold">10,000+</span> QA engineers trust TestGen AI</p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-col items-center justify-center bg-[#09090b] px-8 py-12 min-h-screen">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">TestGen AI</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-zinc-500 text-sm mt-1">Sign in to continue to TestGen AI.</p>
          </div>

          {/* Banners */}
          {submitted && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">
              Login successful! Redirecting…
            </div>
          )}
          {(authError || googleError) && (
            <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm">
              {authError || googleError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm text-zinc-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-zinc-900 text-white text-sm placeholder-zinc-600 outline-none transition-all disabled:opacity-50 ${
                    touched.email && errors.email
                      ? 'border-rose-500/50 focus:border-rose-500'
                      : 'border-zinc-800 hover:border-zinc-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15'
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-xs text-rose-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  disabled={loading}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-zinc-900 text-white text-sm placeholder-zinc-600 outline-none transition-all disabled:opacity-50 ${
                    touched.password && errors.password
                      ? 'border-rose-500/50 focus:border-rose-500'
                      : 'border-zinc-800 hover:border-zinc-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-xs text-rose-400">{errors.password}</p>
              )}
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-primary-500" />
                <span className="text-sm text-zinc-500">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium">
                Forgot password?
              </Link>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-600 text-xs">or continue with</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Sign up link */}
            <p className="text-center text-sm text-zinc-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
