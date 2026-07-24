'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useLoginForm } from '@/hooks/useLoginForm'
import { authService } from '@/services/authService'

const LOG_STEPS = [
  { label: 'Reading SRS document',        time: '0.4s' },
  { label: 'Generating user stories',      time: '1.2s' },
  { label: 'Creating test cases',          time: '2.1s' },
  { label: 'Building traceability matrix', time: '0.8s' },
]

const AVATARS = [
  { bg: '#f97316', letter: 'A' },
  { bg: '#8b5cf6', letter: 'B' },
  { bg: '#06b6d4', letter: 'C' },
  { bg: '#10b981', letter: 'D' },
]

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

  const inputBase =
    'w-full py-3 rounded-xl border bg-[#0f0f18] text-white text-sm placeholder-zinc-600 outline-none transition-all disabled:opacity-50'
  const inputNormal = 'border-zinc-800 hover:border-zinc-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15'
  const inputError = 'border-rose-500/50 focus:border-rose-500'

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ─────────── Left panel ─────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: '#0b1d0f' }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: '#14b8a6' }}>
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">TestGen AI</span>
        </div>

        {/* Hero + terminal */}
        <div className="relative z-10 space-y-9">
          {/* Tag */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#14b8a6' }} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#14b8a6' }}>
              AI-Powered QA
            </span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="font-extrabold leading-[1.08] tracking-tight" style={{ fontSize: '3.75rem' }}>
              <span className="text-white block">Ship tests</span>
              <span className="block" style={{ color: 'rgba(255,255,255,0.28)' }}>as fast as code.</span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed max-w-[22rem]" style={{ color: '#4d7a5a' }}>
              Paste your SRS and get sprint-ready user stories, test cases,
              and a full traceability matrix — generated in minutes, not days.
            </p>
          </div>

          {/* Terminal card */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#080f09', border: '1px solid #182b1c' }}>
            {/* Title bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: '#182b1c', backgroundColor: '#0a1409' }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#febc2e' }} />
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28c840' }} />
              <span className="ml-3 text-xs font-mono" style={{ color: '#2d5438' }}>ai_analysis.log</span>
            </div>
            {/* Log rows */}
            <div className="px-5 py-4 space-y-2.5 font-mono">
              {LOG_STEPS.map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span className="text-sm shrink-0" style={{ color: '#22c55e' }}>✓</span>
                  <span className="text-sm flex-1 truncate" style={{ color: '#4aaa60' }}>{step.label}</span>
                  <span className="text-xs tabular-nums shrink-0" style={{ color: '#2d5438' }}>{step.time}</span>
                </div>
              ))}
              {/* Blinking cursor */}
              <div className="flex items-center gap-3 pt-0.5">
                <span className="text-sm" style={{ color: '#22c55e' }}>$</span>
                <span
                  className="inline-block w-2 h-[15px] rounded-sm animate-pulse"
                  style={{ backgroundColor: 'rgba(34,197,94,0.65)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {AVATARS.map((av) => (
              <div
                key={av.letter}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                style={{ backgroundColor: av.bg, outline: '2px solid #0b1d0f' }}
              >
                {av.letter}
              </div>
            ))}
          </div>
          <p className="text-sm" style={{ color: '#4d7a5a' }}>
            <span className="text-white font-semibold">10,000+</span> QA engineers trust TestGen AI
          </p>
        </div>
      </div>

      {/* ─────────── Right panel ─────────── */}
      <div className="flex flex-col items-center justify-center bg-[#09090f] px-8 py-12 min-h-screen">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#14b8a6' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">TestGen AI</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[1.65rem] font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-zinc-500 text-sm mt-1.5">Sign in to continue to TestGen AI.</p>
          </div>

          {/* Success / Error banners */}
          {submitted && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">
              Login successful! Redirecting…
            </div>
          )}
          {(authError || googleError) && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm">
              {authError || googleError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm text-zinc-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-zinc-600" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={`${inputBase} pl-10 pr-4 ${touched.email && errors.email ? inputError : inputNormal}`}
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-zinc-600" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  disabled={loading}
                  className={`${inputBase} pl-10 pr-10 ${touched.password && errors.password ? inputError : inputNormal}`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
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
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900"
                  style={{ accentColor: '#14b8a6' }}
                />
                <span className="text-sm text-zinc-500">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium transition-colors"
                style={{ color: '#14b8a6' }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading || submitted}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#14b8a6' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d9488')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#14b8a6')}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ backgroundColor: '#1a1a2e' }} />
              <span className="text-zinc-600 text-xs whitespace-nowrap">or continue with</span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#1a1a2e' }} />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0f0f18', borderColor: '#1f1f30' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#161625'
                e.currentTarget.style.borderColor = '#2a2a40'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0f0f18'
                e.currentTarget.style.borderColor = '#1f1f30'
              }}
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Sign up link */}
            <p className="text-center text-sm text-zinc-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold transition-colors" style={{ color: '#14b8a6' }}>
                Create one
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  )
}
