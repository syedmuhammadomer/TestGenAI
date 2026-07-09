'use client'

import React, { useMemo, useState } from 'react'
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
  steps: `
    1. Navigate to the shopping cart with eligible items.
    2. Apply promo code from customer communication.
    3. Verify discounts and tax calculations.
    4. Complete the purchase with saved payment method.
  `,
  expectedResult: 'Total reflects discount and tax rules with no errors during payment.',
}

export default function TestCaseEditPage() {
  const router = useRouter()
  const { id } = router.query
  const testCase = useMemo(() => {
    if (!id) return mockTestCase
    return { ...mockTestCase, id: String(id).toUpperCase() }
  }, [id])

  const [form, setForm] = useState(() => ({
    title: testCase.title,
    requirement: testCase.requirement,
    scenario: testCase.scenario,
    priority: testCase.priority,
    status: testCase.status,
    preconditions: testCase.preconditions,
    steps: testCase.steps,
    expectedResult: testCase.expectedResult,
  }))

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Test Case Form</p>
            <h1 className="text-3xl font-semibold text-slate-900">Edit Test Case {testCase.id}</h1>
            <p className="text-sm text-slate-500">Update metadata, execution status, and expected behavior before marking complete.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="md" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button size="md">Save changes</Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <label className="block space-y-2 text-sm text-slate-600">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Title</span>
              <input
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm text-slate-600">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Requirement</span>
                <input
                  value={form.requirement}
                  onChange={(e) => handleChange('requirement', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </label>
              <label className="block space-y-2 text-sm text-slate-600">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Scenario</span>
                <input
                  value={form.scenario}
                  onChange={(e) => handleChange('scenario', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm text-slate-600">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Priority</span>
                <select
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm text-slate-600">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option>Passed</option>
                  <option>Failed</option>
                  <option>In Progress</option>
                  <option>Not Started</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <label className="block space-y-2 text-sm text-slate-600">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Preconditions</span>
              <textarea
                value={form.preconditions}
                onChange={(e) => handleChange('preconditions', e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </label>
            <label className="block space-y-2 text-sm text-slate-600">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Expected Result</span>
              <textarea
                value={form.expectedResult}
                onChange={(e) => handleChange('expectedResult', e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </label>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Steps</p>
          <textarea
            value={form.steps}
            onChange={(e) => handleChange('steps', e.target.value)}
            rows={6}
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </section>
      </div>
    </Layout>
  )
}
