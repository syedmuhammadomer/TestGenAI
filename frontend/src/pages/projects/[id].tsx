'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Layout from '@/components/Layout'
import {
  ArrowLeft, Sparkles, TestTube, Link, BarChart2, Layers,
  CheckCircle2, Clock, XCircle, RefreshCw, ChevronDown, ChevronUp,
  Brain, Cpu, FileSearch, GitBranch, Zap,
  Download, FileText, FileSpreadsheet, Loader2,
} from 'lucide-react'
import { config } from '@/utils/config'
import { exportTestCasesCSV, exportTestCasesTemplate, generatePDFReport } from '@/utils/exportUtils'

// ── AI Processing animation steps ────────────────────────────────────────────
const AI_STEPS = [
  { icon: FileSearch, label: 'Reading SRS document',       color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  { icon: Brain,      label: 'Extracting requirements',    color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  { icon: Sparkles,   label: 'Generating user stories',    color: 'text-primary-400', bg: 'bg-primary-500/10' },
  { icon: GitBranch,  label: 'Building feature tree',      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: TestTube,   label: 'Creating test cases',        color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  { icon: Link,       label: 'Mapping traceability matrix', color: 'text-rose-400',   bg: 'bg-rose-500/10'    },
  { icon: Cpu,        label: 'Running AI validation',      color: 'text-cyan-400',    bg: 'bg-cyan-500/10'    },
  { icon: Zap,        label: 'Finalising output',          color: 'text-yellow-400',  bg: 'bg-yellow-500/10'  },
]

function AiAnalyzingState({ progress }: { progress: number }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [dots, setDots] = useState('.')
  const [logLines, setLogLines] = useState<string[]>([
    '> Initializing AI engine...',
    '> Loading SRS document into context...',
  ])

  const LOG_POOL = [
    '> Tokenizing requirement paragraphs...',
    '> Identifying actor-goal pairs...',
    '> Classifying functional vs non-functional...',
    '> Linking acceptance criteria...',
    '> Generating BDD scenarios...',
    '> Cross-referencing requirements...',
    '> Scoring test coverage...',
    '> Extracting edge cases...',
    '> Mapping RTM entries...',
    '> Running conflict detection...',
    '> Ranking requirements by priority...',
    '> Generating test case IDs...',
  ]

  // Cycle through steps
  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx((i) => (i + 1) % AI_STEPS.length)
    }, 2200)
    return () => clearInterval(t)
  }, [])

  // Animate trailing dots
  useEffect(() => {
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(t)
  }, [])

  // Add log lines
  useEffect(() => {
    let poolIdx = 0
    const t = setInterval(() => {
      const line = LOG_POOL[poolIdx % LOG_POOL.length]
      poolIdx++
      setLogLines((prev) => [...prev.slice(-6), line])
    }, 1800)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const step = AI_STEPS[stepIdx]
  const StepIcon = step.icon
  const done = Math.min(stepIdx, AI_STEPS.length - 1)

  return (
    <div className="py-6 space-y-6">
      {/* Active step hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`w-64 h-64 rounded-full blur-3xl opacity-10 ${step.bg.replace('/10', '')}`} />
        </div>

        <div className={`relative mx-auto w-16 h-16 rounded-2xl ${step.bg} flex items-center justify-center mb-4 ring-1 ring-white/5`}>
          <StepIcon className={`w-7 h-7 ${step.color}`} />
          {/* Pulse rings */}
          <span className={`absolute inset-0 rounded-2xl ${step.bg} animate-ping opacity-40`} />
        </div>

        <p className={`relative text-lg font-semibold ${step.color}`}>
          {step.label}{dots}
        </p>
        <p className="relative text-xs text-slate-500 mt-1">AI is actively processing your document</p>
      </div>

      {/* Step pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AI_STEPS.map((s, i) => {
          const Icon = s.icon
          const isDone = i < done
          const isActive = i === stepIdx
          return (
            <div key={i}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-500 ${
                isActive
                  ? `${s.bg} border-current ${s.color} shadow-sm`
                  : isDone
                    ? 'bg-emerald-900/15 border-emerald-800/30 text-emerald-500'
                    : 'bg-slate-900/50 border-slate-800 text-slate-600'
              }`}>
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? s.color : isDone ? 'text-emerald-500' : 'text-slate-700'}`} />
              <span className="truncate">{s.label}</span>
              {isDone && <CheckCircle2 className="w-3 h-3 ml-auto shrink-0 text-emerald-500" />}
              {isActive && <RefreshCw className="w-3 h-3 ml-auto shrink-0 animate-spin" />}
            </div>
          )
        })}
      </div>

      {/* Terminal-style log */}
      <div className="rounded-xl border border-slate-800 bg-[#0a0a0f] overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-800 bg-slate-900/50">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-[10px] text-slate-500 font-mono">ai-engine · live log</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> RUNNING
          </span>
        </div>
        <div className="p-4 font-mono text-[11px] space-y-1 min-h-[120px]">
          {logLines.map((line, i) => (
            <p key={i}
              className={`transition-all duration-500 ${i === logLines.length - 1 ? 'text-primary-300' : 'text-slate-500'}`}>
              {line}
              {i === logLines.length - 1 && <span className="ml-0.5 inline-block w-1.5 h-3.5 bg-primary-400 align-middle animate-pulse" />}
            </p>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-600">
        {progress}% complete · This page refreshes automatically
      </p>
    </div>
  )
}

// ── Animated progress bar ────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '.' : d + '.')), 500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-primary-400 font-medium">
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
          AI is analyzing your SRS{dots}
        </span>
        <span className="text-slate-400 tabular-nums">{progress}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600 bg-[length:200%_100%] animate-[shimmer_1.5s_linear_infinite] transition-all duration-700 rounded-full"
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>
    </div>
  )
}

type Feature = {
  id?: number; title: string; description: string
  userImpact?: string; technicalDetails?: string
  priority?: 'High' | 'Medium' | 'Low'; module?: string
}
type UserStory = {
  id?: number; actor: string; goal: string; benefit: string; acceptanceCriteria: string
  priority?: 'High' | 'Medium' | 'Low'; storyPoints?: number; dependencies?: string[]
}
type TestCase = {
  id?: number; testCaseId: string; title: string
  type?: 'positive' | 'negative' | 'edge'
  preconditions: string; steps: string; expectedResult: string
  severity?: 'Critical' | 'High' | 'Medium' | 'Low'; category?: string
}
type RtmEntry = { id: number; requirementId: string; description: string; linkedUserStories: string[]; linkedTestCases: string[] }
type Analytics = {
  totalFeatures: number; totalUserStories: number; totalTestCases: number; totalRequirements: number
  coverageSummary: string; riskAreas: string | string[]
  coveragePercentage?: number; qualityScore?: number
  recommendations?: string[]
  testTypeBreakdown?: { positive: number; negative: number; edge: number }
  priorityBreakdown?: { high: number; medium: number; low: number }
}

type Project = {
  id: number
  name: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  failureReason?: string
  createdAt: string
  updatedAt: string
  features?: Feature[]
  userStories?: UserStory[]
  testCases?: TestCase[]
  rtm?: RtmEntry[]
  aiResponse?: {
    analytics?: Analytics
    features?: Feature[]
    userStories?: UserStory[]
    testCases?: TestCase[]
  }
}

type Tab = 'overview' | 'features' | 'user_stories' | 'test_cases' | 'rtm' | 'analytics'

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'overview', label: 'Overview', icon: Layers },
  { key: 'features', label: 'Features', icon: Sparkles },
  { key: 'user_stories', label: 'User Stories', icon: Sparkles },
  { key: 'test_cases', label: 'Test Cases', icon: TestTube },
  { key: 'rtm', label: 'RTM', icon: Link },
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
]

function StatusBadge({ status }: { status: Project['status'] }) {
  const map = {
    completed: { color: 'bg-emerald-600/20 text-emerald-300', icon: CheckCircle2 },
    processing: { color: 'bg-primary-600/20 text-primary-300', icon: RefreshCw },
    queued: { color: 'bg-slate-600/20 text-slate-300', icon: Clock },
    failed: { color: 'bg-rose-600/20 text-rose-300', icon: XCircle },
  }
  const { color, icon: Icon } = map[status] ?? map.queued
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {status.toUpperCase()}
    </span>
  )
}

function ExpandableCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-900 transition"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [highlightedReqId, setHighlightedReqId] = useState<string | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Scroll highlighted requirement into view when navigating to RTM tab
  useEffect(() => {
    if (tab !== 'rtm' || !highlightedReqId) return
    const el = document.getElementById(`req-${highlightedReqId}`)
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
  }, [tab, highlightedReqId])

  // Auto-clear highlight after 3 s
  useEffect(() => {
    if (!highlightedReqId) return
    const t = setTimeout(() => setHighlightedReqId(null), 3000)
    return () => clearTimeout(t)
  }, [highlightedReqId])

  useEffect(() => {
    if (!id) return
    const token = localStorage.getItem('authToken')
    if (!token) { router.push('/login'); return }

    const fetchProject = async () => {
      try {
        const { data } = await axios.get<Project>(`${config.apiBaseUrl}/api/projects/${id}`)
        setProject(data)
      } catch {
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
    // Poll every 5s if still processing
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get<Project>(`${config.apiBaseUrl}/api/projects/${id}`)
        setProject(data)
        if (data.status === 'completed' || data.status === 'failed') clearInterval(interval)
      } catch { clearInterval(interval) }
    }, 5000)

    return () => clearInterval(interval)
  }, [id, router])

  // ── Side effects when project data loads/updates ──────────────────────────
  useEffect(() => {
    if (!project || project.status !== 'completed') return
    const pid = project.id

    // 1. Cache analytics for the projects list badges
    const analytics = project.aiResponse?.analytics
    if (analytics) {
      try {
        localStorage.setItem(`proj_analytics_${pid}`, JSON.stringify({
          qualityScore: analytics.qualityScore,
          coveragePercentage: analytics.coveragePercentage,
        }))
      } catch { /* storage full */ }
    }

    // 2. Auto-seed Kanban cards (only once per project)
    const seedKey = `kanban_seeded_${pid}`
    if (localStorage.getItem(seedKey)) return

    const stories = (project.aiResponse?.userStories as UserStory[] | undefined) ?? project.userStories ?? []
    if (stories.length === 0) return

    // Ensure default sections exist
    const sectionsKey = `kanban_sections_${pid}`
    let sections: { id: string; name: string }[] = []
    try {
      const raw = localStorage.getItem(sectionsKey)
      if (raw) sections = JSON.parse(raw)
    } catch { /* noop */ }
    if (sections.length === 0) {
      sections = [
        { id: 'backlog',     name: 'Backlog'      },
        { id: 'in_progress', name: 'In Progress'  },
        { id: 'qa_reviews',  name: 'QA Reviews'   },
        { id: 'done',        name: 'Done'         },
      ]
      localStorage.setItem(sectionsKey, JSON.stringify(sections))
    }

    const backlogId = sections[0].id
    stories.forEach((story, idx) => {
      const storyId = story.id ?? idx + 1
      const cardId  = `${pid}-${storyId}`
      const cardKey = `kanban_card_${pid}_${cardId}`
      if (!localStorage.getItem(cardKey)) {
        const priority: 'High' | 'Medium' | 'Low' =
          story.priority === 'High' ? 'High'
          : story.priority === 'Low' ? 'Low'
          : 'Medium'
        localStorage.setItem(cardKey, JSON.stringify({
          sectionId: backlogId, priority, labelIds: [], comments: [],
        }))
      }
    })

    localStorage.setItem(seedKey, '1')
  }, [project])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-primary-400 text-lg">Loading project...</div>
      </div>
    )
  }

  if (!project) return null

  const jumpToReq = (reqId: string) => {
    setHighlightedReqId(reqId)
    setTab('rtm')
  }

  const features = (project.aiResponse?.features as Feature[] | undefined) ?? project.features ?? []
  const userStories = (project.aiResponse?.userStories as UserStory[] | undefined) ?? project.userStories ?? []
  const testCases = (project.aiResponse?.testCases as TestCase[] | undefined) ?? project.testCases ?? []
  const rtm = project.rtm ?? []
  const analytics = project.aiResponse?.analytics

  const isProcessing = project.status === 'processing' || project.status === 'queued'

  const exportData = {
    projectName: project.name,
    createdAt: project.createdAt,
    features,
    userStories,
    testCases,
    rtm,
    analytics,
  }

  const handleGeneratePDF = async () => {
    setPdfLoading(true)
    setExportMenuOpen(false)
    // Let the UI re-render before the heavy PDF work
    await new Promise((r) => setTimeout(r, 50))
    try { generatePDFReport(exportData) } finally { setPdfLoading(false) }
  }

  return (
    <Layout>
      {/* Back + header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-slate-400 text-sm mt-1">
              Created {new Date(project.createdAt).toLocaleDateString()} · Last updated {new Date(project.updatedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={project.status} />

            {/* Export dropdown — only when completed */}
            {project.status === 'completed' && (
              <div className="relative">
                <button
                  onClick={() => setExportMenuOpen((o) => !o)}
                  disabled={pdfLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600/15 hover:bg-primary-600/25 border border-primary-600/30 text-primary-300 text-sm font-medium transition-all disabled:opacity-50"
                >
                  {pdfLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                    : <><Download className="w-4 h-4" /> Export <ChevronUp className={`w-3.5 h-3.5 transition-transform ${exportMenuOpen ? '' : 'rotate-180'}`} /></>
                  }
                </button>

                {exportMenuOpen && (
                  <>
                    {/* click-away backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-800">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Export Options</p>
                      </div>

                      {/* CSV Export */}
                      <div className="p-2 border-b border-slate-800">
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider px-2 py-1">Test Cases</p>
                        <button
                          onClick={() => { exportTestCasesCSV(exportData); setExportMenuOpen(false) }}
                          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Export CSV</p>
                            <p className="text-xs text-slate-500">All test cases with full details</p>
                          </div>
                        </button>
                        <button
                          onClick={() => { exportTestCasesTemplate(exportData); setExportMenuOpen(false) }}
                          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Execution Template</p>
                            <p className="text-xs text-slate-500">CSV with blank Actual Result & Status columns</p>
                          </div>
                        </button>
                      </div>

                      {/* PDF Report */}
                      <div className="p-2">
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider px-2 py-1">Full Report</p>
                        <button
                          onClick={handleGeneratePDF}
                          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-rose-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Generate PDF Report</p>
                            <p className="text-xs text-slate-500">Features · Stories · Test Cases · RTM · Analytics</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {isProcessing && (
          <ProgressBar progress={project.progress} />
        )}

        {project.status === 'failed' && project.failureReason && (
          <div className="mt-4 p-4 rounded-xl bg-rose-900/20 border border-rose-800 text-rose-300 text-sm">
            <strong>Processing failed:</strong> {project.failureReason}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Features', value: features.length },
          { label: 'User Stories', value: userStories.length },
          { label: 'Test Cases', value: testCases.length },
          { label: 'RTM Entries', value: rtm.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-800 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition -mb-px ${
              tab === key
                ? 'border-primary-500 text-primary-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {isProcessing ? (
            <AiAnalyzingState progress={project.progress} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ExpandableCard title={`Features (${features.length})`}>
                {features.length === 0 ? <p className="text-slate-500 text-sm">No features extracted.</p> : (
                  <ul className="space-y-2 mt-2">
                    {features.slice(0, 5).map((f) => (
                      <li key={f.id} className="text-sm text-slate-300 border-l-2 border-primary-600 pl-3">{f.title}</li>
                    ))}
                    {features.length > 5 && <li className="text-xs text-slate-500">+{features.length - 5} more…</li>}
                  </ul>
                )}
              </ExpandableCard>
              <ExpandableCard title={`User Stories (${userStories.length})`}>
                {userStories.length === 0 ? <p className="text-slate-500 text-sm">No user stories generated.</p> : (
                  <ul className="space-y-2 mt-2">
                    {userStories.slice(0, 5).map((s) => (
                      <li key={s.id} className="text-sm text-slate-300 border-l-2 border-accent pl-3">
                        As a <strong>{s.actor}</strong>, I want to {s.goal}
                      </li>
                    ))}
                    {userStories.length > 5 && <li className="text-xs text-slate-500">+{userStories.length - 5} more…</li>}
                  </ul>
                )}
              </ExpandableCard>
              <ExpandableCard title={`Test Cases (${testCases.length})`}>
                {testCases.length === 0 ? <p className="text-slate-500 text-sm">No test cases generated.</p> : (
                  <ul className="space-y-2 mt-2">
                    {testCases.slice(0, 5).map((tc) => (
                      <li key={tc.id} className="text-sm text-slate-300 border-l-2 border-emerald-600 pl-3">
                        [{tc.testCaseId}] {tc.title}
                      </li>
                    ))}
                    {testCases.length > 5 && <li className="text-xs text-slate-500">+{testCases.length - 5} more…</li>}
                  </ul>
                )}
              </ExpandableCard>
              <ExpandableCard title={`RTM Entries (${rtm.length})`}>
                {rtm.length === 0 ? <p className="text-slate-500 text-sm">No RTM entries.</p> : (
                  <ul className="space-y-2 mt-2">
                    {rtm.slice(0, 5).map((r) => (
                      <li key={r.id} className="text-sm text-slate-300 border-l-2 border-yellow-600 pl-3">
                        [{r.requirementId}] {r.description.slice(0, 80)}{r.description.length > 80 ? '…' : ''}
                      </li>
                    ))}
                    {rtm.length > 5 && <li className="text-xs text-slate-500">+{rtm.length - 5} more…</li>}
                  </ul>
                )}
              </ExpandableCard>
            </div>
          )}
        </div>
      )}

      {tab === 'features' && (
        <div className="space-y-4">
          {features.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No features extracted yet.</p>
          ) : features.map((f, i) => {
            const priorityStyle = f.priority === 'High'
              ? 'bg-rose-900/30 text-rose-300 border-rose-800/60'
              : f.priority === 'Medium'
              ? 'bg-amber-900/30 text-amber-300 border-amber-800/60'
              : f.priority === 'Low'
              ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800/60'
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
            return (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-800/60">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary-600/20 text-primary-300 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{f.title}</h3>
                      {f.priority && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityStyle}`}>{f.priority}</span>
                      )}
                      {f.module && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-900/30 text-primary-300 border border-primary-800/50">{f.module}</span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{f.description}</p>
                  </div>
                </div>
                {/* Detail grid */}
                {(f.userImpact || f.technicalDetails) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/60">
                    {f.userImpact && (
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">User Impact</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{f.userImpact}</p>
                      </div>
                    )}
                    {f.technicalDetails && (
                      <div className="px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Technical Details</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{f.technicalDetails}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'user_stories' && (
        <div className="space-y-4">
          {userStories.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No user stories generated yet.</p>
          ) : userStories.map((s, i) => {
            const priorityStyle = s.priority === 'High'
              ? 'bg-rose-900/30 text-rose-300 border-rose-800/60'
              : s.priority === 'Medium'
              ? 'bg-amber-900/30 text-amber-300 border-amber-800/60'
              : s.priority === 'Low'
              ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800/60'
              : 'bg-slate-800/60 text-slate-400 border-slate-700'
            return (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                {/* Story header */}
                <div className="px-5 py-4 border-b border-slate-800/60">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {s.priority && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityStyle}`}>{s.priority}</span>
                        )}
                        {s.storyPoints != null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">{s.storyPoints} pts</span>
                        )}
                      </div>
                      <p className="text-white font-medium leading-relaxed">
                        As a <span className="text-primary-300 font-semibold">{s.actor}</span>, I want to <span className="text-white font-semibold">{s.goal}</span>
                        {s.benefit ? <span className="text-slate-400"> so that {s.benefit}</span> : null}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Acceptance criteria */}
                {s.acceptanceCriteria && (
                  <div className="px-5 py-4 border-b border-slate-800/60">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Acceptance Criteria</p>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{s.acceptanceCriteria}</div>
                  </div>
                )}
                {/* Dependencies */}
                {s.dependencies && s.dependencies.length > 0 && (
                  <div className="px-5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Dependencies</p>
                    <div className="flex flex-wrap gap-2">
                      {s.dependencies.map((dep, di) => (
                        <span key={di} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{dep}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'test_cases' && (
        <div className="space-y-3">
            {testCases.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No test cases generated yet.</p>
            ) : (
              <>
                {/* Type summary bar */}
                {testCases.some((tc) => tc.type) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(['positive', 'negative', 'edge'] as const).map((t) => {
                      const count = testCases.filter((tc) => tc.type === t).length
                      if (count === 0) return null
                      const style = t === 'positive' ? 'bg-emerald-900/20 text-emerald-300 border-emerald-800/50'
                        : t === 'negative' ? 'bg-rose-900/20 text-rose-300 border-rose-800/50'
                        : 'bg-amber-900/20 text-amber-300 border-amber-800/50'
                      return (
                        <span key={t} className={`text-xs font-medium px-3 py-1 rounded-full border ${style}`}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}: {count}
                        </span>
                      )
                    })}
                    <span className="text-xs font-medium px-3 py-1 rounded-full border bg-slate-800/60 text-slate-400 border-slate-700">
                      Total: {testCases.length}
                    </span>
                  </div>
                )}

                {testCases.map((tc, i) => {
                  const sourceReq = rtm.find((r) => r.linkedTestCases?.includes(tc.testCaseId))
                  return (
                    <div
                      key={i}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 hover:border-slate-600 hover:bg-slate-900/60 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 font-mono text-xs font-bold px-2 py-1 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-800/50 mt-0.5">{tc.testCaseId}</span>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => setSelectedTestCase(tc)}
                            className="text-left w-full"
                          >
                            <h3 className="text-white font-medium group-hover:text-primary-300 transition-colors mb-1">{tc.title}</h3>
                          </button>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {tc.type && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                tc.type === 'positive' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800/40'
                                : tc.type === 'negative' ? 'bg-rose-900/20 text-rose-400 border-rose-800/40'
                                : 'bg-amber-900/20 text-amber-400 border-amber-800/40'
                              }`}>{tc.type}</span>
                            )}
                            {tc.severity && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                tc.severity === 'Critical' ? 'bg-rose-900/30 text-rose-300 border-rose-800/60'
                                : tc.severity === 'High' ? 'bg-orange-900/20 text-orange-400 border-orange-800/40'
                                : tc.severity === 'Medium' ? 'bg-amber-900/20 text-amber-400 border-amber-800/40'
                                : 'bg-slate-800/50 text-slate-400 border-slate-700'
                              }`}>{tc.severity}</span>
                            )}
                            {tc.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full border bg-primary-900/20 text-primary-400 border-primary-800/40">{tc.category}</span>
                            )}
                            {sourceReq && (
                              <button
                                onClick={() => jumpToReq(sourceReq.requirementId)}
                                className="text-xs px-2 py-0.5 rounded-full border bg-yellow-900/20 text-yellow-400 border-yellow-800/40 hover:bg-yellow-900/40 hover:text-yellow-300 transition-colors"
                                title="View source requirement in RTM"
                              >
                                ↗ {sourceReq.requirementId}
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedTestCase(tc)}
                          className="text-slate-600 group-hover:text-slate-400 transition-colors text-xs shrink-0 mt-1 hover:text-primary-300"
                        >
                          View details →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
      )}

      {tab === 'rtm' && (
        <div className="space-y-3">
          {rtm.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No RTM entries yet.</p>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-4">
                Click a <span className="text-emerald-400">test case</span> to view its details · Click a <span className="text-accent">user story</span> to navigate to it · Use <span className="text-yellow-400">↗ REQ-xxx</span> badges in Test Cases to trace back here
              </p>
              {rtm.map((r) => {
                const isHighlighted = highlightedReqId === r.requirementId
                return (
                  <div
                    key={r.requirementId}
                    id={`req-${r.requirementId}`}
                    className={`rounded-xl border overflow-hidden transition-all duration-500 ${
                      isHighlighted
                        ? 'border-yellow-500/70 shadow-[0_0_24px_4px_rgba(234,179,8,0.15)] bg-yellow-900/5'
                        : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    {/* Requirement header */}
                    <div className={`flex items-start gap-3 px-5 py-4 border-b ${isHighlighted ? 'border-yellow-800/40' : 'border-slate-800/60'}`}>
                      <span className={`shrink-0 font-mono text-xs font-bold px-2.5 py-1 rounded border ${
                        isHighlighted ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700/60' : 'bg-yellow-900/20 text-yellow-300 border-yellow-800/40'
                      }`}>{r.requirementId}</span>
                      <p className="text-slate-200 text-sm leading-relaxed">{r.description}</p>
                      {isHighlighted && (
                        <span className="shrink-0 text-xs text-yellow-400 font-semibold animate-pulse">← traced</span>
                      )}
                    </div>

                    {/* Linked stories + test cases */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/60">
                      {/* User stories */}
                      <div className="px-5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          User Stories <span className="text-slate-600 normal-case font-normal">({r.linkedUserStories?.length ?? 0})</span>
                        </p>
                        {(!r.linkedUserStories || r.linkedUserStories.length === 0) ? (
                          <p className="text-slate-600 text-xs">None linked</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {r.linkedUserStories.map((storyId) => (
                              <button
                                key={storyId}
                                onClick={() => setTab('user_stories')}
                                className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 hover:bg-accent/30 hover:text-white transition-colors"
                                title="Go to User Stories tab"
                              >
                                {storyId}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Test cases */}
                      <div className="px-5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Test Cases <span className="text-slate-600 normal-case font-normal">({r.linkedTestCases?.length ?? 0})</span>
                        </p>
                        {(!r.linkedTestCases || r.linkedTestCases.length === 0) ? (
                          <p className="text-slate-600 text-xs">None linked</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {r.linkedTestCases.map((tcId) => {
                              const tc = testCases.find((t) => t.testCaseId === tcId)
                              return (
                                <button
                                  key={tcId}
                                  onClick={() => tc ? setSelectedTestCase(tc) : undefined}
                                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                    tc
                                      ? 'bg-emerald-900/20 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/50 hover:text-emerald-200 cursor-pointer'
                                      : 'bg-slate-800/50 text-slate-500 border-slate-700 cursor-default'
                                  }`}
                                  title={tc ? `${tc.title} — click to view` : tcId}
                                >
                                  {tcId}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          {!analytics ? (
            <p className="text-slate-500 text-center py-12">Analytics will appear once the AI processing completes.</p>
          ) : (
            <>
              {/* Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Features', value: analytics.totalFeatures, color: 'text-primary-300' },
                  { label: 'User Stories', value: analytics.totalUserStories, color: 'text-accent' },
                  { label: 'Test Cases', value: analytics.totalTestCases, color: 'text-emerald-300' },
                  { label: 'Requirements', value: analytics.totalRequirements, color: 'text-amber-300' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-center">
                    <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Quality score + coverage % */}
              {(analytics.qualityScore != null || analytics.coveragePercentage != null) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analytics.qualityScore != null && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quality Score</p>
                        <span className={`text-lg font-bold ${analytics.qualityScore >= 80 ? 'text-emerald-300' : analytics.qualityScore >= 60 ? 'text-amber-300' : 'text-rose-300'}`}>
                          {analytics.qualityScore}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${analytics.qualityScore >= 80 ? 'bg-emerald-500' : analytics.qualityScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${analytics.qualityScore}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {analytics.qualityScore >= 80 ? 'Excellent — high-quality output' : analytics.qualityScore >= 60 ? 'Good — some areas need attention' : 'Needs improvement'}
                      </p>
                    </div>
                  )}
                  {analytics.coveragePercentage != null && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Test Coverage</p>
                        <span className={`text-lg font-bold ${analytics.coveragePercentage >= 80 ? 'text-emerald-300' : analytics.coveragePercentage >= 60 ? 'text-amber-300' : 'text-rose-300'}`}>
                          {analytics.coveragePercentage}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${analytics.coveragePercentage >= 80 ? 'bg-emerald-500' : analytics.coveragePercentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${analytics.coveragePercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Requirements covered by test cases</p>
                    </div>
                  )}
                </div>
              )}

              {/* Test type breakdown */}
              {analytics.testTypeBreakdown && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Test Type Breakdown</p>
                  <div className="space-y-3">
                    {([
                      { key: 'positive', label: 'Positive', color: 'bg-emerald-500', textColor: 'text-emerald-300' },
                      { key: 'negative', label: 'Negative', color: 'bg-rose-500', textColor: 'text-rose-300' },
                      { key: 'edge', label: 'Edge Cases', color: 'bg-amber-500', textColor: 'text-amber-300' },
                    ] as const).map(({ key, label, color, textColor }) => {
                      const count = analytics.testTypeBreakdown![key] ?? 0
                      const total = (analytics.testTypeBreakdown!.positive ?? 0) + (analytics.testTypeBreakdown!.negative ?? 0) + (analytics.testTypeBreakdown!.edge ?? 0)
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-300">{label}</span>
                            <span className={`font-semibold ${textColor}`}>{count} <span className="text-slate-500 font-normal text-xs">({pct}%)</span></span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Priority breakdown */}
              {analytics.priorityBreakdown && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Priority Distribution</p>
                  <div className="space-y-3">
                    {([
                      { key: 'high', label: 'High Priority', color: 'bg-rose-500', textColor: 'text-rose-300' },
                      { key: 'medium', label: 'Medium Priority', color: 'bg-amber-500', textColor: 'text-amber-300' },
                      { key: 'low', label: 'Low Priority', color: 'bg-emerald-500', textColor: 'text-emerald-300' },
                    ] as const).map(({ key, label, color, textColor }) => {
                      const count = analytics.priorityBreakdown![key] ?? 0
                      const total = (analytics.priorityBreakdown!.high ?? 0) + (analytics.priorityBreakdown!.medium ?? 0) + (analytics.priorityBreakdown!.low ?? 0)
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-300">{label}</span>
                            <span className={`font-semibold ${textColor}`}>{count} <span className="text-slate-500 font-normal text-xs">({pct}%)</span></span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Coverage summary */}
              {analytics.coverageSummary && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-3">Coverage Summary</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{analytics.coverageSummary}</p>
                </div>
              )}

              {/* Risk areas */}
              {analytics.riskAreas && (
                <div className="bg-slate-950 border border-rose-900/40 rounded-xl p-5">
                  <h3 className="text-rose-300 font-semibold mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Risk Areas
                  </h3>
                  {Array.isArray(analytics.riskAreas) ? (
                    <ul className="space-y-2">
                      {analytics.riskAreas.map((r, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                          <span className="text-rose-400 mt-0.5 shrink-0">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-300 text-sm leading-relaxed">{analytics.riskAreas}</p>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {analytics.recommendations && analytics.recommendations.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-3">Recommendations</h3>
                  <ul className="space-y-3">
                    {analytics.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600/20 text-primary-300 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* Global test case detail modal — works from any tab */}
      {selectedTestCase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedTestCase(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-800/50">{selectedTestCase.testCaseId}</span>
                  {selectedTestCase.type && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      selectedTestCase.type === 'positive' ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800/60'
                      : selectedTestCase.type === 'negative' ? 'bg-rose-900/30 text-rose-300 border-rose-800/60'
                      : 'bg-amber-900/30 text-amber-300 border-amber-800/60'
                    }`}>{selectedTestCase.type.charAt(0).toUpperCase() + selectedTestCase.type.slice(1)}</span>
                  )}
                  {selectedTestCase.severity && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      selectedTestCase.severity === 'Critical' ? 'bg-rose-900/40 text-rose-300 border-rose-800'
                      : selectedTestCase.severity === 'High' ? 'bg-orange-900/30 text-orange-300 border-orange-800/60'
                      : selectedTestCase.severity === 'Medium' ? 'bg-amber-900/30 text-amber-300 border-amber-800/60'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700'
                    }`}>{selectedTestCase.severity}</span>
                  )}
                  {selectedTestCase.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-900/30 text-primary-300 border border-primary-800/50">{selectedTestCase.category}</span>
                  )}
                </div>
                <h2 className="text-white font-bold text-lg">{selectedTestCase.title}</h2>
                {(() => {
                  const src = rtm.find((r) => r.linkedTestCases?.includes(selectedTestCase.testCaseId))
                  return src ? (
                    <button
                      onClick={() => { setSelectedTestCase(null); jumpToReq(src.requirementId) }}
                      className="mt-1.5 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      ↗ Traced from {src.requirementId} — view in RTM
                    </button>
                  ) : null
                })()}
              </div>
              <button onClick={() => setSelectedTestCase(null)} className="text-slate-400 hover:text-white ml-4 text-xl leading-none">×</button>
            </div>
            <div className="divide-y divide-slate-800">
              {selectedTestCase.preconditions && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Preconditions</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedTestCase.preconditions}</p>
                </div>
              )}
              {selectedTestCase.steps && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Test Steps</p>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{selectedTestCase.steps}</div>
                </div>
              )}
              {selectedTestCase.expectedResult && (
                <div className="px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Expected Result</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{selectedTestCase.expectedResult}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
