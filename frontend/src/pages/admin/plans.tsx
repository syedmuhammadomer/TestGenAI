'use client'

import React, { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Pencil, CheckCircle2, X, Loader2 } from 'lucide-react'

interface Plan {
  id: number
  name: string
  price: { monthly: number; yearly: number }
  seats: number
  aiTokens: number
  features: string[]
  activeCompanies: number
  color: string
}

const PLANS: Plan[] = [
  { id: 1, name: 'Free Trial', price: { monthly: 0, yearly: 0 }, seats: 3, aiTokens: 50, features: ['3 projects', 'Basic AI generation', 'Community support'], activeCompanies: 23, color: 'border-slate-700' },
  { id: 2, name: 'Starter', price: { monthly: 19, yearly: 15 }, seats: 5, aiTokens: 200, features: ['10 projects', 'AI generation', 'Email support', 'RTM module'], activeCompanies: 41, color: 'border-blue-600/40' },
  { id: 3, name: 'Pro', price: { monthly: 49, yearly: 39 }, seats: 25, aiTokens: 1000, features: ['Unlimited projects', 'Priority AI', 'RBAC', 'Analytics', 'Priority support'], activeCompanies: 58, color: 'border-purple-600/40' },
  { id: 4, name: 'Enterprise', price: { monthly: 149, yearly: 119 }, seats: 100, aiTokens: 5000, features: ['Unlimited everything', 'SSO/SAML', 'Custom AI models', 'Dedicated support', 'SLA', 'Audit logs'], activeCompanies: 20, color: 'border-amber-600/40' },
]

export default function AdminPlansPage() {
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [editPrice, setEditPrice] = useState({ monthly: 0, yearly: 0 })
  const [editSeats, setEditSeats] = useState(0)
  const [editTokens, setEditTokens] = useState(0)

  const startEdit = (plan: Plan) => {
    setEditId(plan.id)
    setEditPrice({ ...plan.price })
    setEditSeats(plan.seats)
    setEditTokens(plan.aiTokens)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setEditId(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Monetization</p>
            <h1 className="text-2xl font-bold text-white mt-1">Subscription Plans</h1>
            <p className="text-sm text-slate-400 mt-1">Manage pricing, seat limits, and AI token allowances</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition">
            <Plus className="w-4 h-4" /> New Plan
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`bg-[#0d0d16] border rounded-2xl overflow-hidden ${plan.color}`}>
              <div className="px-6 py-5 border-b border-white/5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-slate-500 mb-1">{plan.activeCompanies} companies</p>
                    <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                  </div>
                  <button
                    onClick={() => startEdit(plan)}
                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                {editId === plan.id ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Monthly ($)</span>
                        <input type="number" value={editPrice.monthly} onChange={(e) => setEditPrice((p) => ({ ...p, monthly: +e.target.value }))}
                          className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" />
                      </label>
                      <label className="block">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Yearly ($/mo)</span>
                        <input type="number" value={editPrice.yearly} onChange={(e) => setEditPrice((p) => ({ ...p, yearly: +e.target.value }))}
                          className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" />
                      </label>
                      <label className="block">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">Seats</span>
                        <input type="number" value={editSeats} onChange={(e) => setEditSeats(+e.target.value)}
                          className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" />
                      </label>
                      <label className="block">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500">AI Tokens/mo</span>
                        <input type="number" value={editTokens} onChange={(e) => setEditTokens(+e.target.value)}
                          className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500" />
                      </label>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition disabled:opacity-60">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Save
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-xs font-medium hover:text-white transition">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-3xl font-bold text-white">${plan.price.monthly}</span>
                    <span className="text-slate-400 text-sm mb-1">/mo · ${plan.price.yearly}/mo billed yearly</span>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{plan.seats} seats · {plan.aiTokens} AI tokens/mo</span>
                  <span className="text-slate-300 font-semibold">{plan.activeCompanies} active</span>
                </div>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
