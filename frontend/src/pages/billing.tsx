'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { CreditCard, CheckCircle2, Zap, Crown, Calendar, Users, FolderOpen, TestTube, BarChart2, ShieldCheck, Loader2 } from 'lucide-react'

type BillingCycle = 'monthly' | 'yearly'

const PLAN_PRICE = { monthly: 49, yearly: 39 }
const YEARLY_SAVINGS = Math.round((1 - PLAN_PRICE.yearly / PLAN_PRICE.monthly) * 100)

const PLAN_FEATURES = [
  { icon: FolderOpen, label: 'Unlimited Projects' },
  { icon: TestTube, label: 'AI Test Case Generation' },
  { icon: Users, label: 'Up to 25 Team Members' },
  { icon: BarChart2, label: 'Advanced Analytics' },
  { icon: ShieldCheck, label: 'RBAC & Role Management' },
  { icon: Zap, label: 'Priority AI Processing' },
]

const INVOICES = [
  { date: 'Jun 1, 2026', amount: 49, status: 'Paid', cycle: 'Monthly' },
  { date: 'May 1, 2026', amount: 49, status: 'Paid', cycle: 'Monthly' },
  { date: 'Apr 1, 2026', amount: 49, status: 'Paid', cycle: 'Monthly' },
]

export default function BillingPage() {
  const router = useRouter()
  const [cycle, setCycle] = useState<BillingCycle>('monthly')
  const [isAdmin, setIsAdmin] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<BillingCycle | null>('monthly')
  const [cancelConfirm, setCancelConfirm] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) { router.push('/login'); return }
    const userData = localStorage.getItem('userData')
    if (userData) {
      const parsed = JSON.parse(userData)
      setIsAdmin(parsed.role === 'company_admin')
    }
  }, [router])

  const handleUpgrade = async () => {
    if (!isAdmin) return
    setUpgrading(true)
    await new Promise((r) => setTimeout(r, 1500))
    setCurrentPlan(cycle)
    setUpgrading(false)
  }

  const nextRenewal = () => {
    const d = new Date()
    if (currentPlan === 'yearly') d.setFullYear(d.getFullYear() + 1)
    else d.setMonth(d.getMonth() + 1)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Subscription</p>
          <h1 className="text-2xl font-bold text-white mt-1">Billing &amp; Plan</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your TestGen AI subscription</p>
        </div>

        {/* Non-admin notice */}
        {!isAdmin && (
          <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-300">
            Only the Company Admin can manage billing and subscription changes.
          </div>
        )}

        {/* Current status card */}
        {currentPlan && (
          <div className="rounded-2xl border border-emerald-700/40 bg-emerald-900/15 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-500 mb-1">Active Plan</p>
              <p className="text-white font-bold text-lg">Pro — {currentPlan === 'yearly' ? 'Annual' : 'Monthly'}</p>
              <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Renews {nextRenewal()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">${currentPlan === 'yearly' ? PLAN_PRICE.yearly : PLAN_PRICE.monthly}</p>
              <p className="text-xs text-slate-400">/ month</p>
            </div>
          </div>
        )}

        {/* Plan card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
          {/* Billing toggle */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-800">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400 mb-3">Billing Cycle</p>
            <div className="inline-flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 gap-1">
              <button
                onClick={() => setCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${cycle === 'monthly' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${cycle === 'yearly' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Yearly
                <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${cycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-700/30 text-emerald-400'}`}>
                  -{YEARLY_SAVINGS}%
                </span>
              </button>
            </div>
          </div>

          {/* Plan details */}
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400 mb-1">Pro Plan</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold text-white">${PLAN_PRICE[cycle]}</span>
                  <span className="text-slate-400 mb-2">/ month</span>
                </div>
                {cycle === 'yearly' && (
                  <p className="text-sm text-emerald-400 mt-1">Billed as ${PLAN_PRICE.yearly * 12}/year — save ${(PLAN_PRICE.monthly - PLAN_PRICE.yearly) * 12} annually</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLAN_FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-primary-600/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary-400" />
                  </div>
                  {label}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading || currentPlan === cycle}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgrading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : currentPlan === cycle ? (
                    <><CheckCircle2 className="w-4 h-4" /> Current Plan</>
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Switch to {cycle === 'yearly' ? 'Annual' : 'Monthly'}</>
                  )}
                </button>
                {currentPlan && !cancelConfirm && (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-700/50 text-sm font-medium transition"
                  >
                    Cancel Subscription
                  </button>
                )}
                {cancelConfirm && (
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-rose-400">Cancel your plan?</p>
                    <button
                      onClick={() => { setCurrentPlan(null); setCancelConfirm(false) }}
                      className="px-4 py-2 rounded-xl bg-rose-700/30 text-rose-300 text-sm font-medium hover:bg-rose-700/50 transition"
                    >
                      Yes, cancel
                    </button>
                    <button
                      onClick={() => setCancelConfirm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:text-white transition"
                    >
                      Keep plan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" /> Billing History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  <th className="text-left px-6 py-3 text-slate-400 font-semibold">Date</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-semibold">Cycle</th>
                  <th className="text-right px-6 py-3 text-slate-400 font-semibold">Amount</th>
                  <th className="text-right px-6 py-3 text-slate-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {INVOICES.map((inv, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/40'}>
                    <td className="px-6 py-3 text-slate-300">{inv.date}</td>
                    <td className="px-6 py-3 text-slate-400">{inv.cycle}</td>
                    <td className="px-6 py-3 text-right text-white font-bold">${inv.amount}</td>
                    <td className="px-6 py-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
