'use client'

import React, { useState } from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'

export default function TestCaseCreatePage() {
  const [form, setForm] = useState({
    id: 'TC-999',
    title: '',
    requirement: '',
    scenario: '',
    priority: 'Medium',
    status: 'Not Started',
    preconditions: '',
    steps: '',
    expectedResult: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Test Case Form</p>
            <h1 className="text-3xl font-semibold text-slate-900">Create New Test Case</h1>
            <p className="text-sm text-slate-500">Capture the requirement, flow, and assertions for the new scenario.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="md">Discard</Button>
            <Button size="md">Create test case</Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-4">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-4">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Steps</p>
          <textarea
            value={form.steps}
            onChange={(e) => handleChange('steps', e.target.value)}
    rows={6}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </section>
      </div>
    </Layout>
  )
}
