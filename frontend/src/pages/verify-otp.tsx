import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { authService } from '@/services/authService'
import Button from '@/components/Button'

export default function VerifyOtp() {
  const router = useRouter()
  const queryEmail = Array.isArray(router.query.email) ? router.query.email[0] : router.query.email
  const [email, setEmail] = useState<string>(queryEmail || '')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!email && typeof window !== 'undefined') {
      const pending = localStorage.getItem('pendingRegistration')
      if (pending) {
        try {
          const parsed = JSON.parse(pending)
          setEmail(parsed.email || '')
        } catch {
          // ignore
        }
      }
    }
  }, [email])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email) return router.push('/register')

    const otpString = otp.join('')
    if (otpString.length < 6) return setError('Please enter the complete 6-digit OTP')

    setLoading(true)
    try {
      await authService.verifyOtp({ email, otp: otpString })
      // success -> redirect to dashboard
      router.push('/dashboard')
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      const res = await authService.resendOtp(email)
      setInfo(res.message || 'OTP resent')
      // show the OTP in console/localStorage for dev
      const last = typeof window !== 'undefined' ? localStorage.getItem('lastSentOtp') : null
      if (last) console.info('Resent OTP (dev):', last)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setError(error?.message || 'Resend failed')
    } finally {
      setLoading(false)
      setTimeout(() => setInfo(null), 2500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-elevated">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="w-14 h-14 bg-primary-50 border border-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Verify your email</h1>
            <p className="text-slate-500 text-sm mb-1">We sent a 6-digit code to</p>
            <p className="text-slate-800 font-medium">{email || 'your email address'}</p>
          </div>

          {/* Error/Info Messages */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-sm text-rose-700">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          {info && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle size={16} /> {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Boxes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-4 text-center">Enter verification code</label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    maxLength={1}
                    disabled={loading}
                    className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg bg-white text-slate-900 outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      digit ? 'border-primary-400' : 'border-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify & continue'}
            </Button>

            {/* Footer */}
            <div className="flex justify-between items-center text-sm">
              <Button
                type="button"
                onClick={handleResend}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="!text-primary-600 hover:!text-primary-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend code
              </Button>
              <Link href="/login" className="text-slate-500 hover:text-slate-700">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
