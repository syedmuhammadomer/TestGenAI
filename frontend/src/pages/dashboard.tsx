import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import {
  FileText,
  FolderOpen, Sparkles, TestTube, Users,
  AlertTriangle, CheckCircle, XCircle, Clock, Upload, X, ClipboardList, ArrowUpRight
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { ProjectRecord, useProjectContext } from '@/context/ProjectContext'
import { config } from '@/utils/config'
import { teamService, TeamActivityRecord } from '@/services/teamService'

interface DashboardStats {
  totalProjects: number
  testCasesGenerated: number
  scenariosGenerated: number
  requirementsProcessed: number
  aiUsageRemaining: number
  riskScore: number
}

interface RecentActivity {
  id: string
  type: 'project' | 'test' | 'scenario' | 'requirement'
  title: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

interface TeamActivity {
  id: string
  user: string
  action: string
  timestamp: string
}


const kpiTheme: Record<string, { icon: string; bar: string }> = {
  blue: { icon: 'bg-blue-500/10 text-blue-200', bar: 'bg-blue-500' },
  emerald: { icon: 'bg-emerald-500/10 text-emerald-200', bar: 'bg-emerald-500' },
  purple: { icon: 'bg-purple-500/10 text-purple-200', bar: 'bg-purple-500' },
  orange: { icon: 'bg-orange-500/10 text-orange-200', bar: 'bg-orange-500' },
}

const initials = (name: string) =>
  name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [greetingName, setGreetingName] = useState('')
  const [teamActivityData, setTeamActivityData] = useState<TeamActivityRecord[]>([])
  const { projects, selectedProject, setSelectedProjectId, reloadProjects } = useProjectContext()

  const recentActivity = useMemo<RecentActivity[]>(() =>
    teamActivityData.slice(0, 8).map((a) => ({
      id: String(a.id),
      type: 'project' as const,
      title: `${a.actor} ${a.action}`,
      timestamp: a.timeLabel,
      status: (a.action.includes('deleted') || a.action.includes('removed') || a.action.includes('failed'))
        ? 'error' as const
        : 'success' as const,
    })),
  [teamActivityData])

  const teamActivity = useMemo<TeamActivity[]>(() =>
    teamActivityData.slice(0, 6).map((a) => ({
      id: String(a.id),
      user: a.actor,
      action: a.action,
      timestamp: a.timeLabel,
    })),
  [teamActivityData])

  // New Project Modal State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [srsFile, setSrsFile] = useState<File | null>(null)
  const [isSubmittingProject, setIsSubmittingProject] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [serverError, setServerError] = useState('')
  const [projectResult, setProjectResult] = useState<ProjectRecord | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const stats = useMemo<DashboardStats>(() => {
    const totalProjects = projects.length
    const testCasesGenerated = projects.reduce((total, project) => total + (project.testCases?.length ?? 0), 0)
    const scenariosGenerated = projects.reduce((total, project) => total + (project.userStories?.length ?? 0), 0)
    const requirementsProcessed = projects.reduce((total, project) => total + (project.rtm?.length ?? 0), 0)
    const completedProjects = projects.filter((project) => project.status === 'completed').length

    return {
      totalProjects,
      testCasesGenerated,
      scenariosGenerated,
      requirementsProcessed,
      aiUsageRemaining: Math.max(0, 1000 - totalProjects * 25),
      riskScore: totalProjects === 0 ? 0 : Math.max(5, 100 - Math.round((completedProjects / totalProjects) * 100)),
    }
  }, [projects])

  const kpis = useMemo(() => ([
    { label: 'Total Projects', value: stats.totalProjects.toLocaleString(), icon: FolderOpen, color: 'blue' },
    { label: 'Test Cases Generated', value: stats.testCasesGenerated.toLocaleString(), icon: TestTube, color: 'emerald' },
    { label: 'Scenarios Generated', value: stats.scenariosGenerated.toLocaleString(), icon: Sparkles, color: 'purple' },
    { label: 'Requirements Processed', value: stats.requirementsProcessed.toLocaleString(), icon: FileText, color: 'orange' },
  ]), [stats])

  // Real weekly trend: cumulative test cases from projects created up to each of the last 5 weeks
  const trendData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 5 }, (_, i) => {
      const cutoff = new Date(now)
      cutoff.setDate(now.getDate() - (4 - i) * 7)
      const cumulative = projects.filter((p) => p.createdAt && new Date(p.createdAt) <= cutoff)
      const value = cumulative.reduce((s, p) => s + (p.testCases?.length ?? 0) + (p.userStories?.length ?? 0), 0)
      return { label: `W${i + 1}`, value }
    })
  }, [projects])

  const chartMax = Math.max(...trendData.map((point) => point.value), 1)
  const chartPoints = trendData
    .map((point, index) => {
      const x = (index / (trendData.length - 1)) * 100
      const y = 100 - (point.value / chartMax) * 80
      return `${x},${y}`
    })
    .join(' ')

  const coveragePercent = stats.requirementsProcessed === 0
    ? 0
    : Math.min(100, Math.round((stats.testCasesGenerated / stats.requirementsProcessed) * 100))

  const chartBars = [
    { label: 'Test Cases', value: stats.testCasesGenerated, color: 'bg-primary-500' },
    { label: 'Scenarios', value: stats.scenariosGenerated, color: 'bg-emerald-500' },
    { label: 'Requirements', value: stats.requirementsProcessed, color: 'bg-purple-500' },
  ]

  const activeProject = projectResult ?? selectedProject


  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setGreetingName(parsed.firstName || '')
      } catch {
        // ignore
      }
    }
    setLoading(false)
    // Reload projects now that we know the user is authenticated
    void reloadProjects()
    // Load real team activity for both activity feeds
    teamService.getDashboard().then((d) => setTeamActivityData(d.activity)).catch(() => {})
  }, [router, reloadProjects])

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setProjectResult(selectedProject)
    setProcessingProgress(selectedProject?.progress ?? 0)
    if (selectedProject) {
      if (selectedProject.status === 'completed') {
        setProcessingMessage('Project data is ready for review.')
      } else if (selectedProject.status === 'failed') {
        setProcessingMessage('Project processing failed.')
      } else {
        setProcessingMessage(`Project is ${selectedProject.status}.`)
      }
    } else {
      setProcessingMessage('')
    }
  }, [selectedProject])

  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const startPollingProject = (projectId: number) => {
    clearPolling()
    setProcessingProgress(45)
    setProcessingMessage('AI engine is analyzing your SRS...')

    const fetchStatus = async () => {
      try {
        const { data } = await axios.get(`${config.apiBaseUrl}/api/projects/${projectId}`)
        const applyProgressValue = (value?: number) => {
          if (typeof value === 'number') {
            const normalized = Math.min(100, Math.max(0, value))
            setProcessingProgress((prev) => Math.max(prev, normalized))
            return normalized
          }
          setProcessingProgress((prev) => Math.min(99, prev + 5))
          return undefined
        }
        const progressValue = applyProgressValue(data.progress)
        setProjectResult(data)
        if (data.status === 'completed') {
          setProcessingProgress(100)
          setProcessingMessage('AI processing complete')
          await reloadProjects()
          clearPolling()
        } else if (data.status === 'failed') {
          setProcessingProgress(100)
          setProcessingMessage('AI processing failed')
          setServerError(data.failureReason || 'AI processing reported a failure')
          await reloadProjects()
          clearPolling()
        } else {
          setProcessingMessage(
            progressValue !== undefined
              ? `AI engine is analyzing your SRS (${progressValue}% complete)`
              : 'AI engine is analyzing your SRS...'
          )
        }
      } catch (error: unknown) {
        console.error('Project status poll failed', error)
        const apiMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        setServerError(apiMsg ?? 'Cannot reach the server. Status polling paused — refresh when the backend is back.')
        setProcessingMessage('Status polling paused')
        clearPolling()
      }
    }

    fetchStatus()
    pollingRef.current = setInterval(fetchStatus, 3000)
  }

  const handleProjectSubmission = async () => {
    if (!projectName.trim()) {
      setFormError('Project name is required')
      return
    }
    if (!srsFile) {
      setFormError('Please upload an SRS document')
      return
    }

    setFormError('')
    setServerError('')
    setProjectResult(null)
    setProcessingProgress(20)
    setProcessingMessage('Uploading SRS to our workspace...')
    setIsSubmittingProject(true)

    const formData = new FormData()
    formData.append('projectName', projectName.trim())
    formData.append('srsDocument', srsFile)

    try {
      const { data } = await axios.post(`${config.apiBaseUrl}/api/projects`, formData)
      await reloadProjects()
      setSelectedProjectId(data.projectId)
      setProcessingProgress(35)
      startPollingProject(data.projectId)
      setIsNewProjectModalOpen(false)
      setProjectName('')
      setSrsFile(null)
    } catch (error: unknown) {
      console.error(error)
      const isNetwork = error instanceof Error && (error.message.includes('Network') || error.message.includes('connect'))
      const apiMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      setServerError(apiMsg ?? (isNetwork ? 'Cannot reach the server. Make sure the backend is running and try again.' : 'Failed to queue the project. Please try again.'))
      setProcessingProgress(0)
    } finally {
      setIsSubmittingProject(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-primary-600 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Welcome back{greetingName ? `, ${greetingName}` : ''} — here&apos;s your QA overview
            </p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="md">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Tests
            </Button>
            <Button size="md" onClick={() => setIsNewProjectModalOpen(true)}>
              <FolderOpen className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            const theme = kpiTheme[kpi.color]
            return (
              <div
                key={kpi.label}
                className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-soft hover:shadow-card transition-shadow"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 ${theme.bar}`} />
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${theme.icon}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mt-4">{kpi.value}</p>
                <p className="text-slate-400 text-sm font-medium mt-1">{kpi.label}</p>
              </div>
            )
          })}
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr,0.65fr] gap-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Project performance</p>
                <h2 className="text-xl font-semibold text-white">Weekly progress trend</h2>
              </div>
              <div className="inline-flex rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.4em] text-slate-400">
                Live analytics
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-4">
              <div className="relative h-56">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#334155"
                    strokeWidth="0.5"
                    points="0,20 100,20"
                  />
                  <polyline
                    fill="none"
                    stroke="#334155"
                    strokeWidth="0.5"
                    points="0,40 100,40"
                  />
                  <polyline
                    fill="none"
                    stroke="#334155"
                    strokeWidth="0.5"
                    points="0,60 100,60"
                  />
                  <polyline
                    fill="none"
                    stroke="#334155"
                    strokeWidth="0.5"
                    points="0,80 100,80"
                  />
                  <polyline
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="1.5"
                    points={chartPoints}
                  />
                </svg>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between text-[11px] text-slate-500">
                  {trendData.map((point) => (
                    <span key={point.label}>{point.label}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {chartBars.map((bar) => (
                <div key={bar.label} className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{bar.label}</span>
                    <span className="text-white">{bar.value.toLocaleString()}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`${bar.color} h-full`} style={{ width: `${Math.min(100, (bar.value / (chartMax || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">Coverage</p>
                <span className="text-xs text-slate-400">vs requirements</span>
              </div>
              <div className="mt-5 flex items-end gap-4">
                <div>
                  <p className="text-4xl font-bold text-white">{coveragePercent}%</p>
                  <p className="text-sm text-slate-400">Coverage efficiency</p>
                </div>
                <div className="h-24 w-24 rounded-full border border-slate-800 bg-slate-900 p-3">
                  <div className="relative flex h-full w-full items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-slate-800" />
                    <div className="absolute inset-0 rounded-full bg-primary-500/10" />
                    <div className="absolute inset-0 rounded-full border-2 border-primary-500/30" />
                    <div className="relative flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                      {coveragePercent}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 via-emerald-500 to-violet-500" style={{ width: `${coveragePercent}%` }} />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-medium">AI Status</p>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400">Stable</span>
              </div>
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Projects queued</p>
                  <p className="text-2xl font-semibold text-white">{stats.totalProjects}</p>
                </div>
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Remaining tokens</p>
                  <p className="text-2xl font-semibold text-white">{stats.aiUsageRemaining.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {serverError && (
          <div className="rounded-xl border border-rose-600/30 bg-rose-900/80 p-4 text-sm text-rose-300 flex items-start justify-between gap-3">
            <span>{serverError}</span>
            <button
              onClick={() => setServerError('')}
              className="shrink-0 text-rose-400 hover:text-rose-200 transition"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeProject && (
          <section className="space-y-6">
            <div className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-soft">
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                activeProject.status === 'completed' ? 'bg-emerald-500' : activeProject.status === 'processing' ? 'bg-primary-500' : 'bg-rose-500'
              }`} />
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Project insights</p>
                  <h3 className="text-2xl font-semibold text-white">{activeProject.name}</h3>
                  <p className="text-xs text-slate-400">Captured on {activeProject.createdAt ? new Date(activeProject.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${activeProject.status === 'completed'
                    ? 'bg-emerald-600/10 text-emerald-200'
                    : activeProject.status === 'processing'
                      ? 'bg-primary-600/10 text-primary-200'
                      : 'bg-rose-600/10 text-rose-200'
                  }`}
                >
                  {activeProject.status.toUpperCase()}
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-primary-500 to-accent transition-all"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              {processingMessage && <p className="text-xs text-slate-400">{processingMessage}</p>}
              {activeProject.failureReason && (
                <p className="text-xs text-rose-400">Failure note: {activeProject.failureReason}</p>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-soft">
                <div className="flex items-center gap-2 text-slate-400">
                  <ClipboardList className="w-5 h-5 text-primary-400" />
                  <p className="text-sm font-semibold text-white">Features &amp; Modules</p>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {(activeProject.features ?? []).length === 0 ? (
                    <p className="text-xs text-slate-400">No features extracted yet.</p>
                  ) : (
                    (activeProject.features ?? []).map((feature, index) => (
                      <div key={`feature-${index}`} className="space-y-1 rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <p className="text-sm font-semibold text-white">{feature.title}</p>
                        <p className="text-xs text-slate-400">{feature.description || 'Description not available.'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">User Stories</p>
                    <span className="text-xs text-slate-400">{(activeProject.userStories ?? []).length} stories</span>
                  </div>
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                    {(activeProject.userStories ?? []).length === 0 ? (
                      <p className="text-xs text-slate-400">No user stories generated yet.</p>
                    ) : (
                      (activeProject.userStories ?? []).map((story, index) => (
                        <div key={`story-${index}`} className="rounded-xl border border-slate-800 p-3 bg-slate-900">
                          <p className="text-xs text-primary-300 uppercase tracking-wider">{story.actor}</p>
                          <p className="text-sm font-semibold text-white">{story.goal}</p>
                          {story.benefit && (
                            <p className="text-xs text-slate-400 italic mt-1">Benefit: {story.benefit}</p>
                          )}
                          {story.acceptanceCriteria && (
                            <p className="text-xs text-slate-400 mt-2">
                              Acceptance: {story.acceptanceCriteria}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Test Cases</p>
                    <span className="text-xs text-slate-400">{(activeProject.testCases ?? []).length} cases</span>
                  </div>
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                    {(activeProject.testCases ?? []).length === 0 ? (
                      <p className="text-xs text-slate-400">No test cases generated yet.</p>
                    ) : (
                      (activeProject.testCases ?? []).map((testCase) => (
                        <div key={testCase.testCaseId} className="rounded-xl border border-slate-800 p-3 bg-slate-900">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">{testCase.title}</p>
                            <span className="text-xs text-slate-400">{testCase.testCaseId}</span>
                          </div>
                          {testCase.preconditions && (
                            <p className="text-xs text-slate-400 mt-1">Preconditions: {testCase.preconditions}</p>
                          )}
                          {testCase.steps && (
                            <p className="text-xs text-slate-400 mt-1">Steps: {testCase.steps}</p>
                          )}
                          {testCase.expectedResult && (
                            <p className="text-xs text-emerald-300 mt-1">Expected: {testCase.expectedResult}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-soft">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary-400" />
                  <span className="text-white">Requirement Traceability Matrix</span>
                </div>
                <span className="text-slate-400">{(activeProject.rtm ?? []).length} entries</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {(activeProject.rtm ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400">RTM entries will appear once test cases are generated.</p>
                ) : (
                  (activeProject.rtm ?? []).map((entry) => (
                    <div key={entry.requirementId} className="rounded-xl border border-slate-800 p-3 bg-slate-900 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">Requirement</p>
                        <span className="text-xs font-semibold text-primary-300">{entry.requirementId}</span>
                      </div>
                      <p className="text-sm text-white">{entry.description}</p>
                      {entry.linkedUserStories?.length ? (
                        <p className="text-xs text-slate-400">Stories: {entry.linkedUserStories.join(', ')}</p>
                      ) : null}
                      {entry.linkedTestCases?.length ? (
                        <p className="text-xs text-slate-400">Test Cases: {entry.linkedTestCases.join(', ')}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {!activeProject && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center shadow-soft">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary-600/15 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary-300" />
            </div>
            <p className="text-sm text-slate-400 mt-3">
              Select a project from the dropdown next to the logo to view its user stories, RTM, test cases, and other details.
            </p>
          </div>
        )}

        {/* Activity Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-5">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className="relative flex items-start gap-3">
                  {index < recentActivity.length - 1 && (
                    <span className="absolute left-4 top-8 bottom-[-20px] w-px bg-slate-800" aria-hidden="true" />
                  )}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    activity.status === 'success' ? 'bg-emerald-600/15' :
                    activity.status === 'warning' ? 'bg-amber-600/15' : 'bg-rose-600/15'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-300" />
                    ) : activity.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-300" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-sm text-white font-medium leading-snug">{activity.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Activity Feed */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Team Activity</h3>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-5">
              {teamActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0 text-xs font-semibold">
                    {initials(activity.user)}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-sm text-white leading-snug">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-300 hover:text-primary-200">
              View all activity <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-semibold text-white">Create New Project</h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {formError && (
                <p className="text-xs text-rose-600">{formError}</p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Banking Portal"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Upload SRS Document</label>
                <div className="relative group">
                  <div className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-all ${
                    srsFile
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-slate-800 bg-slate-900 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}>
                    <input
                      type="file"
                      onChange={(e) => setSrsFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept=".pdf,.doc,.docx"
                    />
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400 group-hover:text-slate-100">
                      <Upload className={`w-8 h-8 mb-3 ${srsFile ? 'text-primary-300' : 'text-slate-500'}`} />
                      {srsFile ? (
                        <p className="text-sm font-medium text-primary-300 truncate max-w-[220px]">
                          {srsFile.name}
                        </p>
                      ) : (
                        <>
                          <p className="mb-2 text-sm"><span className="font-semibold text-primary-300">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-slate-500">PDF, DOC, DOCX up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {processingMessage && (
                <div className="space-y-2 text-slate-400">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <p>{processingMessage}</p>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full">
                    <div
                      className="h-2 bg-gradient-to-r from-primary-500 to-accent rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-950">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewProjectModalOpen(false)
                  setFormError('')
                }}
                disabled={isSubmittingProject}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProjectSubmission}
                isLoading={isSubmittingProject}
                disabled={isSubmittingProject}
              >
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
