'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Mail, Lock, User, Zap, Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2,
  FileText, GitBranch, TestTube,
} from 'lucide-react'
import { validateEmail, validatePassword, validateName } from '@/utils/validation'
import { authService } from '@/services/authService'
import { useGoogleLogin } from '@react-oauth/google'

export default function Register() {
  const router = useRouter()

  const [firstName, setFirstName]     = useState('')
  const [lastName, setLastName]       = useState('')
  const [email, setEmail]             = useState('')
  const [isInvited, setIsInvited]     = useState(false)
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [agreed, setAgreed]           = useState(false)
  const [errors, setErrors]           = useState<{ firstName?: string; lastName?: string; email?: string; password?: string; confirm?: string }>({})
  const [touched, setTouched]         = useState<{ [k: string]: boolean }>({})
  const [loading, setLoading]         = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess]         = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (router.isReady && router.query.email) {
      setEmail(decodeURIComponent(router.query.email as string))
      setIsInvited(true)
    }
  }, [router.isReady, router.query.email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const firstNameErr = validateName(firstName, 'First name')
    const lastNameErr  = validateName(lastName, 'Last name')
    const emailErr     = validateEmail(email)
    const passErr      = validatePassword(password)
    const confirmErr   = password !== confirm ? 'Passwords do not match' : ''

    const newErrors: typeof errors = {}
    if (firstNameErr) newErrors.firstName = firstNameErr
    if (lastNameErr)  newErrors.lastName  = lastNameErr
    if (emailErr)     newErrors.email     = emailErr
    if (passErr)      newErrors.password  = passErr
    if (confirmErr)   newErrors.confirm   = confirmErr

    setErrors(newErrors)
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirm: true })
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      if (isInvited) {
        await authService.registerInvited({ firstName, lastName, email, password })
        setSuccess('Account created! Redirecting…')
        router.push('/dashboard')
      } else {
        await authService.register({ firstName, lastName, email, password, confirmPassword: confirm })
        setSuccess('OTP sent to your email.')
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
      }
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string } } }
      setServerError(error?.response?.data?.message || error?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setServerError(null)
      try {
        await authService.googleLogin(tokenResponse.access_token)
        router.push('/dashboard')
      } catch (err: unknown) {
        const e = err as { message?: string }
        setServerError(e?.message ?? 'Google sign-in failed')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => setServerError('Google sign-in was cancelled or failed'),
  })

  const inputCls = (hasError?: boolean) =>
    `w-full pl-10 pr-4 py-3 rounded-xl border bg-zinc-900 text-white text-sm placeholder-zinc-600 outline-none transition-all disabled:opacity-50 ${
      hasError
        ? 'border-rose-500/50 focus:border-rose-500'
        : 'border-zinc-800 hover:border-zinc-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15'
    }`

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left panel: brand ── */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-600 to-teal-500 p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-black/10 blur-3xl" />
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
              Plan your sprints,<br />
              <span className="italic font-extrabold text-white/80">ship with confidence.</span>
            </h2>
            <p className="text-white/70 text-sm mt-4 leading-relaxed max-w-sm">
              From SRS to RTM in 60 seconds. Join thousands of QA engineers who automate their entire testing workflow.
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
              { icon: FileText,  label: 'Reading SRS document',    status: 'done'   },
              { icon: GitBranch, label: 'Generating user stories',  status: 'done'   },
              { icon: TestTube,  label: 'Creating test cases',      status: 'active' },
            ].map(({ icon: Icon, label, status }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  status === 'done'   ? 'bg-emerald-400/20' :
                  status === 'active' ? 'bg-white/20 animate-pulse' : 'bg-white/10'
                }`}>
                  <Icon className={`w-3 h-3 ${
                    status === 'done'   ? 'text-emerald-300' :
                    status === 'active' ? 'text-white' : 'text-white/30'
                  }`} />
                </div>
                <span className={`text-xs font-mono ${
                  status === 'done'   ? 'text-emerald-300' :
                  status === 'active' ? 'text-white' : 'text-white/30'
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
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">TestGen AI</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Back button */}
          <Link href="/login"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all mb-6">
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-zinc-500 text-sm mt-1">A few details and you&apos;re in.</p>
          </div>

          {/* Banners */}
          {isInvited && !serverError && !success && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              You were invited. Complete your profile to get started.
            </div>
          )}
          {serverError && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {serverError}
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm text-zinc-400">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, email: true }))}
                  placeholder="you@example.com"
                  disabled={loading || isInvited}
                  className={`${inputCls(touched.email && !!errors.email)} ${isInvited ? 'opacity-60' : ''}`}
                />
              </div>
              {touched.email && errors.email && <p className="text-xs text-rose-400">{errors.email}</p>}
            </div>

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="block text-sm text-zinc-400">First name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    id="firstName" type="text" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => setTouched(p => ({ ...p, firstName: true }))}
                    placeholder="John" disabled={loading}
                    className={inputCls(touched.firstName && !!errors.firstName)}
                  />
                </div>
                {touched.firstName && errors.firstName && <p className="text-xs text-rose-400">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="block text-sm text-zinc-400">Last name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    id="lastName" type="text" value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => setTouched(p => ({ ...p, lastName: true }))}
                    placeholder="Doe" disabled={loading}
                    className={inputCls(touched.lastName && !!errors.lastName)}
                  />
                </div>
                {touched.lastName && errors.lastName && <p className="text-xs text-rose-400">{errors.lastName}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, password: true }))}
                  placeholder="Create a strong password" disabled={loading}
                  className={`${inputCls(touched.password && !!errors.password)} pr-10`}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && <p className="text-xs text-rose-400">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="block text-sm text-zinc-400">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  id="confirm" type={showConfirm ? 'text' : 'password'} value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setTouched(p => ({ ...p, confirm: true }))}
                  placeholder="Re-enter your password" disabled={loading}
                  className={`${inputCls(touched.confirm && !!errors.confirm)} pr-10`}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.confirm && errors.confirm && <p className="text-xs text-rose-400">{errors.confirm}</p>}
              {confirm && password && confirm === password && (
                <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Passwords match</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-primary-500 shrink-0"
              />
              <span className="text-sm text-zinc-500 leading-snug">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-400 hover:text-primary-300 font-medium">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary-400 hover:text-primary-300 font-medium">Privacy Policy</Link>
              </span>
            </label>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{isInvited ? 'Accept Invitation & Join' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
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

            {/* Sign in link */}
            <p className="text-center text-sm text-zinc-600">
              Already a member?{' '}
              <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
