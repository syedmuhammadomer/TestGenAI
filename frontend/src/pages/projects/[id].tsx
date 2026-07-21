'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import Layout from '@/components/Layout'
import {
  ArrowLeft, Sparkles, TestTube, Link, BarChart2, Layers,
  CheckCircle2, Clock, XCircle, RefreshCw, ChevronDown, ChevronUp,
  Brain, Cpu, FileSearch, GitBranch, Zap,
} from 'lucide-react'
import { config } from '@/utils/config'

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

type Feature = { id: number; title: string; description: string }
type UserStory = { id: number; actor: string; goal: string; benefit: string; acceptanceCriteria: string }
type TestCase = { id: number; testCaseId: string; title: string; preconditions: string; steps: string; expectedResult: string }
type RtmEntry = { id: number; requirementId: string; description: string; linkedUserStories: string[]; linkedTestCases: string[] }
type Analytics = {
  totalFeatures: number
  totalUserStories: number
  totalTestCases: number
  totalRequirements: number
  coverageSummary: string
  riskAreas: string | string[]
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
  aiResponse?: { analytics?: Analytics }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-primary-400 text-lg">Loading project...</div>
      </div>
    )
  }

  if (!project) return null

  const features = project.features ?? []
  const userStories = project.userStories ?? []
  const testCases = project.testCases ?? []
  const rtm = project.rtm ?? []
  const analytics = project.aiResponse?.analytics

  const isProcessing = project.status === 'processing' || project.status === 'queued'

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
          <StatusBadge status={project.status} />
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
          ) : features.map((f, i) => (
            <div key={f.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-primary-600/20 text-primary-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <h3 className="text-white font-semibold">{f.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{f.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'user_stories' && (
        <div className="space-y-4">
          {userStories.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No user stories generated yet.</p>
          ) : userStories.map((s, i) => (
            <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <p className="text-white font-medium">
                  As a <strong className="text-primary-300">{s.actor}</strong>, I want to <strong>{s.goal}</strong>
                  {s.benefit ? <span className="text-slate-400"> so that {s.benefit}</span> : null}
                </p>
              </div>
              {s.acceptanceCriteria && (
                <div className="ml-9 pl-3 border-l border-slate-700">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Acceptance Criteria</p>
                  <p className="text-sm text-slate-300 whitespace-pre-line">{s.acceptanceCriteria}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'test_cases' && (
        <div className="space-y-4">
          {testCases.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No test cases generated yet.</p>
          ) : testCases.map((tc) => (
            <div key={tc.id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-700/30 text-emerald-300 text-xs font-mono font-bold">{tc.testCaseId}</span>
                <h3 className="text-white font-semibold">{tc.title}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {tc.preconditions && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Preconditions</p>
                    <p className="text-slate-300">{tc.preconditions}</p>
                  </div>
                )}
                {tc.steps && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Steps</p>
                    <p className="text-slate-300 whitespace-pre-line">{tc.steps}</p>
                  </div>
                )}
                {tc.expectedResult && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Expected Result</p>
                    <p className="text-slate-300">{tc.expectedResult}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'rtm' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                <th className="text-left px-4 py-3 text-slate-400 font-semibold w-28">Req ID</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold">Description</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold">Linked Stories</th>
                <th className="text-left px-4 py-3 text-slate-400 font-semibold">Linked Test Cases</th>
              </tr>
            </thead>
            <tbody>
              {rtm.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-slate-500">No RTM entries yet.</td></tr>
              ) : rtm.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/50'}>
                  <td className="px-4 py-3 font-mono text-yellow-300">{r.requirementId}</td>
                  <td className="px-4 py-3 text-slate-300">{r.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.linkedUserStories?.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-xs">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.linkedTestCases?.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-700/20 text-emerald-300 text-xs">{t}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="space-y-6">
          {!analytics ? (
            <p className="text-slate-500 text-center py-12">Analytics will appear once the AI processing completes.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Features', value: analytics.totalFeatures },
                  { label: 'User Stories', value: analytics.totalUserStories },
                  { label: 'Test Cases', value: analytics.totalTestCases },
                  { label: 'Requirements', value: analytics.totalRequirements },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-center">
                    <p className="text-3xl font-bold text-white">{value ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">{label}</p>
                  </div>
                ))}
              </div>
              {analytics.coverageSummary && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-2">Coverage Summary</h3>
                  <p className="text-slate-300 text-sm">{analytics.coverageSummary}</p>
                </div>
              )}
              {analytics.riskAreas && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-2">Risk Areas</h3>
                  {Array.isArray(analytics.riskAreas) ? (
                    <ul className="space-y-1">
                      {analytics.riskAreas.map((r, i) => (
                        <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                          <span className="text-rose-400 mt-0.5">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-300 text-sm">{analytics.riskAreas}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Layout>
  )
}
