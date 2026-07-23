import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Mail, Lock, AlertCircle, User, Zap, BarChart3, ShieldCheck,
  TrendingUp, Eye, EyeOff, CheckCircle2, Sparkles, ArrowRight,
} from 'lucide-react'
import { validateEmail, validatePassword, validateName } from '@/utils/validation'
import { authService } from '@/services/authService'
import { useTheme } from '@/context/ThemeContext'

const features = [
  { icon: Zap,          title: '90% Faster Test Generation', desc: 'AI-powered automation in minutes',        color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
  { icon: BarChart3,    title: 'Real-time Analytics',        desc: 'Detailed quality metrics & insights',    color: 'text-primary-400', bg: 'bg-primary-400/10' },
  { icon: ShieldCheck,  title: 'Enterprise Security',        desc: 'End-to-end encryption & compliance',     color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: TrendingUp,   title: 'Continuous Improvement',     desc: 'ML-driven test optimization',            color: 'text-violet-400',  bg: 'bg-violet-400/10' },
]

const tags = ['Automation', 'CI/CD', 'AI-Powered', 'Enterprise']

export default function Register() {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [isInvited, setIsInvited] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string; password?: string; confirm?: string }>({})
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    const lastNameErr = validateName(lastName, 'Last name')
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    const confirmErr = password !== confirm ? 'Passwords do not match' : ''

    const newErrors: typeof errors = {}
    if (firstNameErr) newErrors.firstName = firstNameErr
    if (lastNameErr) newErrors.lastName = lastNameErr
    if (emailErr) newErrors.email = emailErr
    if (passErr) newErrors.password = passErr
    if (confirmErr) newErrors.confirm = confirmErr

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

  const fieldCls = (hasError?: boolean) =>
    `w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all ${
      hasError
        ? isDark
          ? 'border-rose-500/60 bg-rose-500/10 text-zinc-100 placeholder:text-zinc-600'
          : 'border-rose-400 bg-rose-50 text-zinc-900 placeholder:text-zinc-400'
        : isDark
          ? 'border-zinc-700 bg-zinc-800/60 text-zinc-100 placeholder:text-zinc-600 hover:border-zinc-600 focus:border-primary-500/70 focus:ring-2 focus:ring-primary-500/20'
          : 'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`

  const labelCls = `block text-xs font-semibold mb-1.5 uppercase tracking-wide ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden ${
      isDark ? 'bg-zinc-950' : 'bg-zinc-50'
    }`}>
      {/* Atmospheric blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-primary-600/8 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* ── Left panel ── */}
        <div className={`hidden lg:flex flex-col gap-8 p-10 rounded-3xl border relative overflow-hidden ${
          isDark
            ? 'bg-zinc-900/70 border-zinc-800 backdrop-blur-xl'
            : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          {/* Inner glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary-500/10 blur-3xl" />
          </div>

          {/* Logo */}
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                TestGen <span className="text-primary-400">SQA</span>
              </h2>
              <p className={`text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Next-gen quality automation platform</p>
            </div>
          </div>

          {/* Headline */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>
                Why teams choose us
              </span>
            </div>
            <h3 className={`text-xl font-bold leading-snug ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Revolutionize your testing<br />with intelligent automation
            </h3>
          </div>

          {/* Feature cards */}
          <div className="space-y-3 relative z-10">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600/60'
                    : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`w-4.5 h-4.5 ${color}`} size={18} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>{title}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap relative z-10">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  isDark
                    ? 'bg-primary-500/10 border-primary-500/25 text-primary-300'
                    : 'bg-primary-50 border-primary-100 text-primary-700'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right panel (form) ── */}
        <div className={`rounded-3xl border p-8 sm:p-10 ${
          isDark
            ? 'bg-zinc-900/80 border-zinc-800 backdrop-blur-xl'
            : 'bg-white border-zinc-200 shadow-lg'
        }`}>
          {/* Header */}
          <div className="mb-7">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-glow">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>TestGen SQA</span>
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Create an account</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Join thousands using TestGen SQA for intelligent testing
            </p>
          </div>

          {/* Banners */}
          {isInvited && !serverError && !success && (
            <div className={`mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
              isDark
                ? 'bg-primary-500/10 border-primary-500/25 text-primary-300'
                : 'bg-primary-50 border-primary-200 text-primary-700'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              You were invited to TestGen AI. Complete your profile to get started.
            </div>
          )}

          {serverError && (
            <div className={`mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
              isDark
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {serverError}
            </div>
          )}

          {success && (
            <div className={`mb-5 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelCls}>First Name</label>
                <div className="relative">
                  <User size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                    placeholder="John"
                    disabled={loading}
                    className={fieldCls(touched.firstName && !!errors.firstName)}
                  />
                </div>
                {touched.firstName && errors.firstName && (
                  <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11} />{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className={labelCls}>Last Name</label>
                <div className="relative">
                  <User size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                    placeholder="Doe"
                    disabled={loading}
                    className={fieldCls(touched.lastName && !!errors.lastName)}
                  />
                </div>
                {touched.lastName && errors.lastName && (
                  <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11} />{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelCls}>Email Address</label>
              <div className="relative">
                <Mail size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  placeholder="you@example.com"
                  disabled={loading || isInvited}
                  className={`${fieldCls(touched.email && !!errors.email)} ${isInvited ? 'opacity-70' : ''}`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <div className="relative">
                <Lock size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  placeholder="Min 8 chars, 1 special character"
                  disabled={loading}
                  className={`${fieldCls(touched.password && !!errors.password)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  disabled={loading}
                  tabIndex={-1}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-zinc-600 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11} />{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className={labelCls}>Confirm Password</label>
              <div className="relative">
                <Lock size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, confirm: true }))}
                  placeholder="Re-enter password"
                  disabled={loading}
                  className={`${fieldCls(touched.confirm && !!errors.confirm)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(prev => !prev)}
                  disabled={loading}
                  tabIndex={-1}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-zinc-600 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {touched.confirm && errors.confirm && (
                <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11} />{errors.confirm}</p>
              )}
              {confirm && password && confirm === password && (
                <p className="mt-1.5 text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 size={11} />Passwords match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-400 active:scale-[0.98] text-white text-sm font-semibold py-3 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                <>
                  {isInvited ? 'Accept Invitation & Create Account' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className={`text-center text-sm pt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Already have an account?{' '}
              <Link href="/login" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
