import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Mail, Lock, CheckCircle, AlertCircle, User, Cpu, Zap, BarChart3, ShieldCheck, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { validateEmail, validatePassword, validateName } from '@/utils/validation'
import { authService } from '@/services/authService'
import Button from '@/components/Button'

export default function Register() {
  const router = useRouter()
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

  // Pre-fill email from invite link query param
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
        // Invited members skip OTP — account is created directly
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

  const inputClass = (hasError?: boolean) => `w-full pl-10 pr-4 py-3.5 rounded-lg border outline-none transition ${
    hasError
      ? 'border-rose-400 bg-rose-50 text-slate-900 placeholder-slate-400'
      : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-surface">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left banner (SQA themed) */}
        <div className="hidden md:flex flex-col items-start justify-center p-12 rounded-3xl gap-8 bg-white border border-slate-200 shadow-elevated">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
              <Cpu size={32} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold gradient-text">TestGen SQA</h2>
              <p className="text-slate-500 text-sm font-medium">Next-gen quality automation platform</p>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-lg font-semibold text-slate-900 mb-6">Revolutionize your testing with intelligent automation:</p>

            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Zap size={22} className="text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900">90% Faster Test Generation</h3>
                  <p className="text-sm text-slate-500">AI-powered automation in minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <BarChart3 size={22} className="text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900">Real-time Analytics</h3>
                  <p className="text-sm text-slate-500">Detailed quality metrics & insights</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <ShieldCheck size={22} className="text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900">Enterprise Security</h3>
                  <p className="text-sm text-slate-500">End-to-end encryption & compliance</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <TrendingUp size={22} className="text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900">Continuous Improvement</h3>
                  <p className="text-sm text-slate-500">ML-driven test optimization</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex gap-2 flex-wrap">
            {['Automation', 'CI/CD', 'AI-Powered', 'Enterprise'].map((tag) => (
              <div key={tag} className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 border border-primary-100 text-primary-700">
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Registration Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-elevated">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create an account</h1>
            <p className="text-slate-500">Join thousands using TestGen SQA for intelligent testing</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-sm text-rose-700">
              <AlertCircle size={16} /> {serverError}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle size={16} /> {success}
            </div>
          )}

          {isInvited && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
              <CheckCircle size={16} /> You were invited to TestGen AI. Complete your profile to get started.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name Field */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><User size={18} /></div>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                  placeholder="John"
                  disabled={loading}
                  className={inputClass(touched.firstName && !!errors.firstName)}
                />
              </div>
              {touched.firstName && errors.firstName && (
                <div className="mt-2 flex items-center gap-1 text-rose-600 text-sm"><AlertCircle size={14} /> {errors.firstName}</div>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><User size={18} /></div>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                  placeholder="Doe"
                  disabled={loading}
                  className={inputClass(touched.lastName && !!errors.lastName)}
                />
              </div>
              {touched.lastName && errors.lastName && (
                <div className="mt-2 flex items-center gap-1 text-rose-600 text-sm"><AlertCircle size={14} /> {errors.lastName}</div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><Mail size={18} /></div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  placeholder="you@example.com"
                  disabled={loading || isInvited}
                  className={inputClass(touched.email && !!errors.email)}
                />
              </div>
              {touched.email && errors.email && (
                <div className="mt-2 flex items-center gap-1 text-rose-600 text-sm"><AlertCircle size={14} /> {errors.email}</div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`${inputClass(touched.password && !!errors.password)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  disabled={loading}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <div className="mt-2 flex items-center gap-1 text-rose-600 text-sm"><AlertCircle size={14} /> {errors.password}</div>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"><Lock size={18} /></div>
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, confirm: true }))}
                  placeholder="Re-enter password"
                  disabled={loading}
                  className={`${inputClass(touched.confirm && !!errors.confirm)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(prev => !prev)}
                  disabled={loading}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.confirm && errors.confirm && (
                <div className="mt-2 flex items-center gap-1 text-rose-600 text-sm"><AlertCircle size={14} /> {errors.confirm}</div>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Creating account...' : isInvited ? 'Accept Invitation & Create Account' : 'Create account'}
            </Button>

            <div className="text-center mt-4">
              <span className="text-slate-500 text-sm">Already have an account? <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">Login</Link></span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
