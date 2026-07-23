import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Mail, Lock, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { useLoginForm } from '@/hooks/useLoginForm'
import Link from 'next/link'
import Button from '@/components/Button'

export default function Login() {
  const router = useRouter()
  const {
    email,
    password,
    errors,
    touched,
    submitted,
    loading,
    authError,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    handleSubmit
  } = useLoginForm()

  useEffect(() => {
    if (submitted) {
      // Redirect to dashboard after successful login
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 1000) // Short delay to show success message
      return () => clearTimeout(timer)
    }
  }, [submitted, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-elevated">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white mb-4">
              <Zap size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-slate-400">Log in to continue to TestGen AI</p>
          </div>

          {/* Success Message */}
          {submitted && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} className="text-emerald-400 shrink-0" />
              <span className="text-emerald-300 text-sm">Login successful!</span>
            </div>
          )}

          {/* Auth Error Message */}
          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} className="text-rose-400 shrink-0" />
              <span className="text-rose-300 text-sm">{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition outline-none ${
                    touched.email && errors.email
                      ? 'border-rose-500/60 bg-rose-500/10 text-white placeholder-slate-500'
                      : 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 hover:border-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {touched.email && errors.email && (
                <div className="mt-2 flex items-center gap-1 text-rose-400 text-sm">
                  <AlertCircle size={16} />
                  {errors.email}
                </div>
              )}
              {touched.email && !errors.email && email && (
                <div className="mt-2 flex items-center gap-1 text-emerald-400 text-sm">
                  <CheckCircle size={16} />
                  Email is valid
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition outline-none ${
                    touched.password && errors.password
                      ? 'border-rose-500/60 bg-rose-500/10 text-white placeholder-slate-500'
                      : 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 hover:border-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {touched.password && errors.password && (
                <div className="mt-2 flex items-center gap-1 text-rose-400 text-sm">
                  <AlertCircle size={16} />
                  {errors.password}
                </div>
              )}
              {touched.password && !errors.password && password && (
                <div className="mt-2 flex items-center gap-1 text-emerald-400 text-sm">
                  <CheckCircle size={16} />
                  Password is valid
                </div>
              )}
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              isLoading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center mt-6">
              <span className="text-slate-500 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Sign up
                </Link>
              </span>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
