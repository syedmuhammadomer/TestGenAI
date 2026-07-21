'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { Filter, Settings, ClipboardList, X, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useProjectContext } from '@/context/ProjectContext'

type ModalMode = 'view' | 'edit' | 'create'

type TestCase = {
  id: string
  title: string
  requirement: string
  scenario: string
  priority: 'High' | 'Medium' | 'Low' | 'Critical'
  status: 'Passed' | 'Failed' | 'In Progress' | 'Not Started'
  updated: string
  preconditions?: string
  steps?: string
  expectedResult?: string
}

const statusColors: Record<string, string> = {
  Passed:       'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  Failed:       'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  'In Progress':'bg-primary-500/15 text-primary-300 ring-1 ring-primary-500/30',
  'Not Started':'bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700',
}

const priorityColors: Record<string, string> = {
  Critical: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  High:     'bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  Low:      'bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700',
}

const priorityActivePill: Record<string, string> = {
  Critical: 'bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/40',
  High:     'bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/40',
  Medium:   'bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/40',
  Low:      'bg-zinc-700 text-zinc-300 ring-2 ring-zinc-500',
}

const statusActivePill: Record<string, string> = {
  Passed:       'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40',
  Failed:       'bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/40',
  'In Progress':'bg-primary-500/20 text-primary-300 ring-2 ring-primary-500/40',
  'Not Started':'bg-zinc-700 text-zinc-300 ring-2 ring-zinc-500',
}

const badgeBase = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'

const renderBadge = (value: string, map?: Record<string, string>) => (
  <span className={`${badgeBase} ${map?.[value] ?? 'bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700'}`}>{value}</span>
)

const inputCls = 'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors'
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5'

export default function TestManagerPage() {
  const router = useRouter()
  const { selectedProject } = useProjectContext()
  const [filter, setFilter] = useState<string>('All Status')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    setLoading(false)
  }, [router])

  const testCases = useMemo<TestCase[]>(() => {
    if (!selectedProject) return []

    return (selectedProject.testCases ?? []).map((testCase, index) => {
      const linkedRequirement =
        selectedProject.rtm?.find((entry) => entry.linkedTestCases?.includes(testCase.testCaseId))?.requirementId ??
        'Unmapped'

      return {
        id: testCase.testCaseId,
        title: testCase.title,
        requirement: linkedRequirement,
        scenario: selectedProject.features?.[index]?.title || selectedProject.name,
        priority: index % 4 === 0 ? 'Critical' : index % 4 === 1 ? 'High' : index % 4 === 2 ? 'Medium' : 'Low',
        status:
          selectedProject.status === 'completed'
            ? 'Passed'
            : selectedProject.status === 'failed'
              ? 'Failed'
              : 'In Progress',
        updated: selectedProject.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        preconditions: testCase.preconditions,
        steps: testCase.steps,
        expectedResult: testCase.expectedResult,
      }
    })
  }, [selectedProject])

  const stats = useMemo(() => {
    const total = testCases.length
    const passed = testCases.filter((tc) => tc.status === 'Passed').length
    const failed = testCases.filter((tc) => tc.status === 'Failed').length
    const inProgress = testCases.filter((tc) => tc.status === 'In Progress').length
    return { total, passed, failed, inProgress }
  }, [testCases])

  const filtered = useMemo(() => {
    const statusFiltered = filter === 'All Status' ? testCases : testCases.filter((tc) => tc.status === filter)
    return statusFiltered.filter((tc) =>
      `${tc.id} ${tc.title} ${tc.requirement} ${tc.scenario}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [filter, searchTerm, testCases])

  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [modalTestCase, setModalTestCase] = useState<TestCase | null>(null)
  const [editForm, setEditForm] = useState<TestCase | null>(null)
  const defaultCreateForm = (): TestCase => ({
    id: 'TC-999',
    title: '',
    requirement: '',
    scenario: '',
    priority: 'Medium',
    status: 'Not Started',
    updated: new Date().toISOString().split('T')[0],
    preconditions: '',
    steps: '',
    expectedResult: '',
  })

  const [createForm, setCreateForm] = useState<TestCase>(defaultCreateForm())

  useEffect(() => {
    if (modalMode === 'edit' && modalTestCase) {
      setEditForm({ ...modalTestCase })
    }
  }, [modalMode, modalTestCase])

  const closeModal = () => {
    setModalMode(null)
    setModalTestCase(null)
  }

  const handleEditChange = (field: keyof TestCase, value: string) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleCreateChange = (field: keyof TestCase, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpenCreate = () => {
    setCreateForm(defaultCreateForm())
    setModalMode('create')
    setModalTestCase(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-primary-600 text-lg">Loading...</div>
      </div>
    )
  }

  const renderModalBody = () => {
    if (!modalMode) return null

    if (modalMode === 'view' && modalTestCase) {
      const steps = modalTestCase.steps?.split('\n').filter(Boolean) ?? []
      return (
        <div className="space-y-5">
          {/* Meta row */}
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-zinc-800/60 px-3 py-2 min-w-[80px]">
              <p className="text-[10px] font-medium text-zinc-500 mb-0.5">ID</p>
              <p className="text-sm font-semibold text-white">{modalTestCase.id}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/60 px-3 py-2 flex-1 min-w-[120px]">
              <p className="text-[10px] font-medium text-zinc-500 mb-0.5">Requirement</p>
              <p className="text-sm font-semibold text-white">{modalTestCase.requirement}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/60 px-3 py-2 flex-1 min-w-[120px]">
              <p className="text-[10px] font-medium text-zinc-500 mb-0.5">Scenario</p>
              <p className="text-sm font-semibold text-white">{modalTestCase.scenario}</p>
            </div>
            <div className="flex items-center gap-2 self-center">
              {renderBadge(modalTestCase.priority, priorityColors)}
              {renderBadge(modalTestCase.status, statusColors)}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs font-medium text-zinc-500 mb-2">Preconditions</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{modalTestCase.preconditions || 'Not specified'}</p>
            </article>
            <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs font-medium text-zinc-500 mb-2">Expected Result</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{modalTestCase.expectedResult || 'Not specified'}</p>
            </article>
          </div>

          <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-500">Steps</p>
              <span className="text-xs text-zinc-600">Updated {modalTestCase.updated}</span>
            </div>
            <ol className="space-y-2 text-sm leading-relaxed text-zinc-300">
              {steps.length > 0 ? (
                steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center font-semibold mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500">No steps provided.</li>
              )}
            </ol>
          </article>

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
            <Button variant="outline" size="sm" onClick={closeModal}>Close</Button>
            <Button variant="secondary" size="sm" onClick={() => setModalMode('edit')}>Edit</Button>
          </div>
        </div>
      )
    }

    if (modalMode === 'edit' && editForm) {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={labelCls}>Title</label>
              <input
                value={editForm.title}
                onChange={(e) => handleEditChange('title', e.target.value)}
                placeholder="Enter test case title"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Scenario</label>
              <input
                value={editForm.scenario}
                onChange={(e) => handleEditChange('scenario', e.target.value)}
                placeholder="Feature or scenario name"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={labelCls}>Priority</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(['Critical', 'High', 'Medium', 'Low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleEditChange('priority', p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      editForm.priority === p
                        ? priorityActivePill[p]
                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(['Passed', 'Failed', 'In Progress', 'Not Started'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleEditChange('status', s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      editForm.status === s
                        ? statusActivePill[s]
                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Preconditions</label>
            <textarea
              value={editForm.preconditions}
              onChange={(e) => handleEditChange('preconditions', e.target.value)}
              rows={3}
              placeholder="List any preconditions…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Expected Result</label>
            <textarea
              value={editForm.expectedResult}
              onChange={(e) => handleEditChange('expectedResult', e.target.value)}
              rows={3}
              placeholder="Describe the expected outcome…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Steps <span className="text-zinc-600 font-normal">(one per line)</span></label>
            <textarea
              value={editForm.steps}
              onChange={(e) => handleEditChange('steps', e.target.value)}
              rows={4}
              placeholder={"1. Navigate to…\n2. Click…\n3. Verify…"}
              className={inputCls}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
            <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
            <Button variant="secondary" size="sm">Save Changes</Button>
          </div>
        </div>
      )
    }

    if (modalMode === 'create') {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={labelCls}>Title <span className="text-rose-400">*</span></label>
              <input
                value={createForm.title}
                onChange={(e) => handleCreateChange('title', e.target.value)}
                placeholder="e.g. Verify login with valid credentials"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Requirement</label>
              <input
                value={createForm.requirement}
                onChange={(e) => handleCreateChange('requirement', e.target.value)}
                placeholder="e.g. REQ-001"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Scenario</label>
            <input
              value={createForm.scenario}
              onChange={(e) => handleCreateChange('scenario', e.target.value)}
              placeholder="Feature or scenario this test covers"
              className={inputCls}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={labelCls}>Priority</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(['Critical', 'High', 'Medium', 'Low'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleCreateChange('priority', p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      createForm.priority === p
                        ? priorityActivePill[p]
                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(['Not Started', 'In Progress', 'Passed', 'Failed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleCreateChange('status', s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      createForm.status === s
                        ? statusActivePill[s]
                        : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Preconditions</label>
            <textarea
              value={createForm.preconditions}
              onChange={(e) => handleCreateChange('preconditions', e.target.value)}
              rows={2}
              placeholder="List any setup steps or preconditions required…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Expected Result</label>
            <textarea
              value={createForm.expectedResult}
              onChange={(e) => handleCreateChange('expectedResult', e.target.value)}
              rows={2}
              placeholder="Describe the expected outcome of this test…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Steps <span className="text-zinc-600 font-normal">(one per line)</span></label>
            <textarea
              value={createForm.steps}
              onChange={(e) => handleCreateChange('steps', e.target.value)}
              rows={4}
              placeholder={"Navigate to the login page\nEnter valid email and password\nClick the Sign In button\nVerify user is redirected to dashboard"}
              className={inputCls}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
            <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
            <Button size="sm">
              <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
              Create Test Case
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium text-primary-400 mb-1">Quality Ops</p>
            <h1 className="text-2xl font-bold text-white">Test Case Manager</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Organize, filter, and manage all test cases for the selected project.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="md">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button size="md" onClick={handleOpenCreate}>
              <ClipboardList className="mr-2 h-4 w-4" />
              New Test Case
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Cases', value: stats.total, icon: ClipboardList, color: 'text-zinc-400', bg: 'bg-zinc-800/60' },
            { label: 'Passed', value: stats.passed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-primary-400', bg: 'bg-primary-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <article key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-zinc-500">{label}</p>
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{value}</p>
            </article>
          ))}
        </section>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-5 py-4 border-b border-zinc-800">
            <div className="relative">
              <input
                placeholder="Search test cases, requirements…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full md:w-72 rounded-xl border border-zinc-700 bg-zinc-900 pl-9 pr-4 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['All Status', 'Passed', 'Failed', 'In Progress', 'Not Started'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filter === s
                      ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/40'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >{s}</button>
              ))}
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Bulk Actions
              </Button>
            </div>
          </div>

          {!selectedProject && (
            <div className="px-5 py-8 text-sm text-zinc-500 text-center">
              Select a project from the sidebar dropdown to view its test cases.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">ID</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Title</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Requirement</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Scenario</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Priority</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-500">Updated</th>
                </tr>
              </thead>
              <tbody>
                {selectedProject && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-zinc-500 text-sm">
                      No test cases found for this project.
                    </td>
                  </tr>
                )}
                {filtered.map((testCase) => (
                  <tr
                    key={testCase.id}
                    className="border-t border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer transition-colors"
                    onClick={() => {
                      setModalTestCase(testCase)
                      setModalMode('view')
                    }}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary-400">{testCase.id}</td>
                    <td className="px-5 py-3.5 font-medium text-zinc-200 max-w-[200px] truncate">{testCase.title}</td>
                    <td className="px-5 py-3.5 text-zinc-400">{testCase.requirement}</td>
                    <td className="px-5 py-3.5 text-zinc-400 max-w-[140px] truncate">{testCase.scenario}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityColors[testCase.priority] ?? priorityColors.Low}`}>
                        {testCase.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[testCase.status] ?? statusColors['Not Started']}`}>
                        {testCase.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 text-xs">{testCase.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* Teal accent bar */}
              <div className="h-0.5 w-full bg-gradient-to-r from-primary-500 to-primary-400 shrink-0" />

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      {modalMode === 'create' ? 'New Test Case' : modalMode === 'edit' ? 'Edit Test Case' : (modalTestCase?.title || 'Test Case')}
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {modalMode === 'create' ? 'Fill in the details below' : modalMode === 'edit' ? `Editing ${modalTestCase?.id}` : modalTestCase?.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                  aria-label="Close modal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-6 py-5">
                {renderModalBody()}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
