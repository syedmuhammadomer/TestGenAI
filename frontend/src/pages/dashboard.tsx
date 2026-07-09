import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import {
  FileText, Zap,
  FolderOpen, Sparkles, TestTube, Users,
  AlertTriangle, CheckCircle, XCircle, Clock, Upload, X, ClipboardList, ArrowUpRight
} from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { ProjectRecord, useProjectContext } from '@/context/ProjectContext'

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

// Mock data for dashboard
const mockRecentActivity: RecentActivity[] = [
  { id: '1', type: 'project', title: 'Created new project: E-commerce Platform', timestamp: '2 hours ago', status: 'success' },
  { id: '2', type: 'test', title: 'Generated 45 test cases for login flow', timestamp: '4 hours ago', status: 'success' },
  { id: '3', type: 'scenario', title: 'AI generated checkout scenarios', timestamp: '6 hours ago', status: 'warning' },
  { id: '4', type: 'requirement', title: 'Processed user authentication requirements', timestamp: '1 day ago', status: 'success' },
  { id: '5', type: 'project', title: 'Failed to generate test cases for complex workflow', timestamp: '1 day ago', status: 'error' },
]

const mockTeamActivity: TeamActivity[] = [
  { id: '1', user: 'Sarah Johnson', action: 'completed test case review', timestamp: '30 min ago' },
  { id: '2', user: 'Mike Chen', action: 'generated 23 new scenarios', timestamp: '1 hour ago' },
  { id: '3', user: 'Emma Davis', action: 'updated project requirements', timestamp: '2 hours ago' },
  { id: '4', user: 'Alex Rodriguez', action: 'created new test suite', timestamp: '3 hours ago' },
]

const kpiTheme: Record<string, { icon: string; bar: string }> = {
  blue: { icon: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  purple: { icon: 'bg-purple-50 text-purple-600', bar: 'bg-purple-500' },
  orange: { icon: 'bg-orange-50 text-orange-600', bar: 'bg-orange-500' },
}

const initials = (name: string) =>
  name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [greetingName, setGreetingName] = useState('')
  const [recentActivity] = useState<RecentActivity[]>(mockRecentActivity)
  const [teamActivity] = useState<TeamActivity[]>(mockTeamActivity)
  const { projects, selectedProject, setSelectedProjectId, reloadProjects } = useProjectContext()

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
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

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
  }, [router])

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
        const { data } = await axios.get(`${API_BASE_URL}/api/projects/${projectId}`)
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
      } catch (error) {
        console.error('Project status poll failed', error)
        setServerError('Unable to reach the projects API for updates.')
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
      const { data } = await axios.post(`${API_BASE_URL}/api/projects`, formData)
      await reloadProjects()
      setSelectedProjectId(data.projectId)
      setProcessingProgress(35)
      startPollingProject(data.projectId)
      setIsNewProjectModalOpen(false)
      setProjectName('')
      setSrsFile(null)
    } catch (error) {
      console.error(error)
      setServerError('Unable to queue the project. Try again with a different document.')
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
            <p className="text-sm text-slate-500">
              Welcome back{greetingName ? `, ${greetingName}` : ''} — here&apos;s your QA overview
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Dashboard</h1>
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
                className="relative overflow-hidden bg-white border border-slate-200 rounded-xl p-6 shadow-soft hover:shadow-card transition-shadow"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 ${theme.bar}`} />
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${theme.icon}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-4">{kpi.value}</p>
                <p className="text-slate-500 text-sm font-medium mt-1">{kpi.label}</p>
              </div>
            )
          })}
        </div>

        {/* Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-500 text-sm font-medium">AI Usage Remaining</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.aiUsageRemaining.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">tokens this month</p>
              </div>
              <div className="w-11 h-11 bg-primary-50 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-5">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats.aiUsageRemaining / 1000) * 100}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-600">
                    {Math.round((stats.aiUsageRemaining / 1000) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-primary-500 rounded-full" />
                  <span className="text-slate-600">Remaining</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
                  <span className="text-slate-600">Used</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-slate-500 text-sm font-medium">Risk Score</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.riskScore}%</p>
                <p className="text-xs text-slate-400 mt-1">based on completion rate</p>
              </div>
              <div className="w-11 h-11 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="mt-6">
              <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-sm transition-all duration-300"
                  style={{ left: `${stats.riskScore}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>

        {serverError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {serverError}
          </div>
        )}

        {activeProject && (
          <section className="space-y-6">
            <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-soft">
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                activeProject.status === 'completed' ? 'bg-emerald-500' : activeProject.status === 'processing' ? 'bg-primary-500' : 'bg-rose-500'
              }`} />
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Project insights</p>
                  <h3 className="text-2xl font-semibold text-slate-900">{activeProject.name}</h3>
                  <p className="text-xs text-slate-500">Captured on {activeProject.createdAt ? new Date(activeProject.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${activeProject.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-600'
                    : activeProject.status === 'processing'
                      ? 'bg-primary-50 text-primary-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {activeProject.status.toUpperCase()}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-primary-500 to-accent transition-all"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              {processingMessage && <p className="text-xs text-slate-500">{processingMessage}</p>}
              {activeProject.failureReason && (
                <p className="text-xs text-rose-600">Failure note: {activeProject.failureReason}</p>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-soft">
                <div className="flex items-center gap-2 text-slate-600">
                  <ClipboardList className="w-5 h-5 text-primary-600" />
                  <p className="text-sm font-semibold">Features &amp; Modules</p>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {(activeProject.features ?? []).length === 0 ? (
                    <p className="text-xs text-slate-400">No features extracted yet.</p>
                  ) : (
                    (activeProject.features ?? []).map((feature, index) => (
                      <div key={`feature-${index}`} className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{feature.title}</p>
                        <p className="text-xs text-slate-500">{feature.description || 'Description not available.'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">User Stories</p>
                    <span className="text-xs text-slate-500">{(activeProject.userStories ?? []).length} stories</span>
                  </div>
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                    {(activeProject.userStories ?? []).length === 0 ? (
                      <p className="text-xs text-slate-400">No user stories generated yet.</p>
                    ) : (
                      (activeProject.userStories ?? []).map((story, index) => (
                        <div key={`story-${index}`} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                          <p className="text-xs text-primary-600 uppercase tracking-wider">{story.actor}</p>
                          <p className="text-sm font-semibold text-slate-900">{story.goal}</p>
                          {story.benefit && (
                            <p className="text-xs text-slate-500 italic mt-1">Benefit: {story.benefit}</p>
                          )}
                          {story.acceptanceCriteria && (
                            <p className="text-xs text-slate-500 mt-2">
                              Acceptance: {story.acceptanceCriteria}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-soft">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Test Cases</p>
                    <span className="text-xs text-slate-500">{(activeProject.testCases ?? []).length} cases</span>
                  </div>
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                    {(activeProject.testCases ?? []).length === 0 ? (
                      <p className="text-xs text-slate-400">No test cases generated yet.</p>
                    ) : (
                      (activeProject.testCases ?? []).map((testCase) => (
                        <div key={testCase.testCaseId} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">{testCase.title}</p>
                            <span className="text-xs text-slate-500">{testCase.testCaseId}</span>
                          </div>
                          {testCase.preconditions && (
                            <p className="text-xs text-slate-500 mt-1">Preconditions: {testCase.preconditions}</p>
                          )}
                          {testCase.steps && (
                            <p className="text-xs text-slate-500 mt-1">Steps: {testCase.steps}</p>
                          )}
                          {testCase.expectedResult && (
                            <p className="text-xs text-emerald-600 mt-1">Expected: {testCase.expectedResult}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-soft">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary-600" />
                  <span>Requirement Traceability Matrix</span>
                </div>
                <span>{(activeProject.rtm ?? []).length} entries</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {(activeProject.rtm ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400">RTM entries will appear once test cases are generated.</p>
                ) : (
                  (activeProject.rtm ?? []).map((entry) => (
                    <div key={entry.requirementId} className="rounded-xl border border-slate-200 p-3 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">Requirement</p>
                        <span className="text-xs font-semibold text-primary-600">{entry.requirementId}</span>
                      </div>
                      <p className="text-sm text-slate-900">{entry.description}</p>
                      {entry.linkedUserStories?.length ? (
                        <p className="text-xs text-slate-500">Stories: {entry.linkedUserStories.join(', ')}</p>
                      ) : null}
                      {entry.linkedTestCases?.length ? (
                        <p className="text-xs text-slate-500">Test Cases: {entry.linkedTestCases.join(', ')}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {!activeProject && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-soft">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-sm text-slate-500 mt-3">
              Select a project from the dropdown next to the logo to view its user stories, RTM, test cases, and other details.
            </p>
          </div>
        )}

        {/* Activity Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-5">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className="relative flex items-start gap-3">
                  {index < recentActivity.length - 1 && (
                    <span className="absolute left-4 top-8 bottom-[-20px] w-px bg-slate-100" aria-hidden="true" />
                  )}
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    activity.status === 'success' ? 'bg-emerald-50' :
                    activity.status === 'warning' ? 'bg-amber-50' : 'bg-red-50'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : activity.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-sm text-slate-900 font-medium leading-snug">{activity.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Activity Feed */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Team Activity</h3>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-5">
              {teamActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center shrink-0 text-xs font-semibold">
                    {initials(activity.user)}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-sm text-slate-900 leading-snug">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-2 flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
              View all activity <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Create New Project</h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors"
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
                <label className="text-sm font-medium text-slate-600">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Banking Portal"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Upload SRS Document</label>
                <div className="relative group">
                  <div className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-all ${
                    srsFile
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300'
                  }`}>
                    <input
                      type="file"
                      onChange={(e) => setSrsFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept=".pdf,.doc,.docx"
                    />
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500 group-hover:text-slate-800">
                      <Upload className={`w-8 h-8 mb-3 ${srsFile ? 'text-primary-600' : 'text-slate-400'}`} />
                      {srsFile ? (
                        <p className="text-sm font-medium text-primary-600 truncate max-w-[220px]">
                          {srsFile.name}
                        </p>
                      ) : (
                        <>
                          <p className="mb-2 text-sm"><span className="font-semibold text-primary-600">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-slate-400">PDF, DOC, DOCX up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {processingMessage && (
                <div className="space-y-2 text-slate-600">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <p>{processingMessage}</p>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div
                      className="h-2 bg-gradient-to-r from-primary-500 to-accent rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-white">
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
