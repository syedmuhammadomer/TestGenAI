'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Button from '@/components/Button'

const mockTestCase = {
  id: 'TC-044',
  title: 'Validate checkout totals with promotions applied',
  requirement: 'REQ-012',
  scenario: 'Promotions and Discounts',
  priority: 'High',
  status: 'Passed',
  lastUpdated: '2026-03-29',
  preconditions: 'User is logged in and has two items in cart with valid promotion codes.',
  steps: [
    'Navigate to checkout after adding eligible products.',
    'Apply promo code from customer communications.',
    'Verify discount amount and tax recalculation.',
    'Complete payment with saved card.',
  ],
  expectedResult: 'Total reflects discount and taxes remain consistent with policy; no charge errors.',
  attachments: ['order_summary.png', 'promo-ledger.csv'],
}

export default function TestCaseDetailPage() {
  const router = useRouter()
  const { id } = router.query

  const testCase = useMemo(() => {
    if (!id) return mockTestCase
    return { ...mockTestCase, id: String(id).toUpperCase() }
  }, [id])

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Test Case Detail</p>
            <h1 className="text-3xl font-semibold text-slate-900">{testCase.title}</h1>
            <p className="text-sm text-slate-500">Review requirements, steps, and expected results before execution.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="md">Export</Button>
            <Button size="md">Edit</Button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Test Case ID</p>
              <p className="font-semibold text-slate-900">{testCase.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Requirement</p>
              <p className="font-semibold text-slate-900">{testCase.requirement}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Scenario</p>
              <p className="font-semibold text-slate-900">{testCase.scenario}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Priority</p>
              <p className="font-semibold text-slate-900">{testCase.priority}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Status</p>
              <p className="font-semibold text-primary-600">{testCase.status}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Preconditions</p>
            <p className="mt-3 text-sm text-slate-600">{testCase.preconditions}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Expected Result</p>
            <p className="mt-3 text-sm text-slate-600">{testCase.expectedResult}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Steps</p>
            <span className="text-xs text-slate-500">Updated {testCase.lastUpdated}</span>
          </div>
          <ol className="mt-4 space-y-3 list-decimal pl-5 text-sm text-slate-600">
            {testCase.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr,0.7fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Traceability</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Linked features: Booking workflow, Payment routing</p>
              <p>Linked stories: As a shopper, I want promo validation before payment</p>
              <p>Test suite: Smoke – Checkout</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Attachments</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {testCase.attachments.map((attachment) => (
                  <li key={attachment} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-4 py-2">
                    <span>{attachment}</span>
                    <Button variant="outline" size="sm">Download</Button>
                  </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </Layout>
  )
}
