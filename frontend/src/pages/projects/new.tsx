'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { CheckCircle2, ClipboardList, FileCog, Sparkles, TestTube2, Upload, XCircle } from 'lucide-react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { ProjectRecord, useProjectContext } from '@/context/ProjectContext'
import { hasPermission } from '@/utils/access'
import { config, getApiBaseUrl, handleApiError } from '@/utils/config'
import { User } from '@/types'

const formatStatusLabel = (status?: string) => {
  if (!status) return 'Waiting'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function NewProjectPage() {
  const router = useRouter()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const { reloadProjects, setSelectedProjectId } = useProjectContext()
  const [projectName, setProjectName] = useState('')
  const [srsFile, setSrsFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Upload an SRS to generate user stories and test cases.')
  const [error, setError] = useState('')
  const [resultProject, setResultProject] = useState<ProjectRecord | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }

    const storedUser = localStorage.getItem('userData')
    const user = storedUser ? (JSON.parse(storedUser) as User) : null
    if (user && !hasPermission(user, 'projects:create')) {
      console.info('Creating project is available for signed-in users; redirecting is skipped.')
    }
  }, [router])

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const generatedCounts = useMemo(() => {
    return {
      features: resultProject?.features?.length ?? 0,
      stories: resultProject?.userStories?.length ?? 0,
      testCases: resultProject?.testCases?.length ?? 0,
    }
  }, [resultProject])

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const beginPolling = (projectId: number) => {
    stopPolling()

    const fetchProject = async () => {
      try {
        const { data } = await axios.get<ProjectRecord>(`${getApiBaseUrl()}/api/projects/${projectId}`)
        setResultProject(data)
        setSelectedProjectId(data.id)

        const nextProgress = typeof data.progress === 'number' ? data.progress : 0
        setProgress(nextProgress)

        if (data.status === 'completed') {
          setMessage('Analysis complete. Review the generated user stories and test cases below.')
          await reloadProjects()
          stopPolling()
          return
        }

        if (data.status === 'failed') {
          setError(data.failureReason || 'AI processing failed for this SRS document.')
          setMessage('Processing stopped before completion.')
          setProgress(100)
          await reloadProjects()
          stopPolling()
          return
        }

        setMessage(`SRS analysis is running. Current status: ${formatStatusLabel(data.status)}.`)
      } catch (pollError) {
        stopPolling()
        setError(handleApiError(pollError))
        setMessage('Unable to continue polling project status.')
      }
    }

    void fetchProject()
    pollingRef.current = setInterval(() => {
      void fetchProject()
    }, 3000)
  }

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    if (!srsFile) {
      setError('Please upload an SRS document')
      return
    }

    setError('')
    setResultProject(null)
    setProgress(15)
    setMessage('Uploading the SRS document...')
    setIsSubmitting(true)

    const formData = new FormData()
    formData.set('projectName', projectName.trim())
    formData.set('srsDocument', srsFile)

    try {
      const { data } = await axios.post<{ projectId: number }>(config.endpoints.projects, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setProgress(35)
      setMessage('SRS uploaded. AI analysis has started.')
      await reloadProjects()
      beginPolling(data.projectId)
    } catch (submitError) {
      setError(handleApiError(submitError))
      setMessage('We could not start SRS analysis.')
      setProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const storyPreview = resultProject?.userStories?.slice(0, 6) ?? []
  const testCasePreview = resultProject?.testCases?.slice(0, 6) ?? []

  return (
    <Layout>
      <div className="mx-auto max-w-6xl py-10 space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,#27272a_0%,#0f172a_45%,#020617_100%)] p-8 shadow-[0_20px_70px_rgba(2,6,23,0.45)]">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs uppercase tracking-[0.45em] text-slate-200">AI SRS Intake</p>
              <h1 className="text-4xl font-semibold text-white">Create a project from your SRS document</h1>
              <p className="text-sm leading-7 text-slate-300">
                Upload the project SRS and we will analyze it, extract core requirements, generate user stories,
                and create test cases for the selected project workspace.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <FileCog className="h-5 w-5 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-white">Requirement analysis</p>
                <p className="mt-1 text-xs text-slate-300">Parses the SRS into features and requirements.</p>
              </div>
              <div className="rounded-2xl border border-slate-500/20 bg-slate-500/10 p-4">
                <Sparkles className="h-5 w-5 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-white">User stories</p>
                <p className="mt-1 text-xs text-slate-300">Builds backlog-ready stories and acceptance criteria.</p>
              </div>
              <div className="rounded-2xl border border-slate-500/20 bg-slate-500/10 p-4">
                <TestTube2 className="h-5 w-5 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-white">Test cases</p>
                <p className="mt-1 text-xs text-slate-300">Generates structured validation steps and outcomes.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Project Setup</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Upload your SRS</h2>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Project name</span>
              <input
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="E.g. Inventory Platform"
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">SRS document</span>
              <div
                className={`relative rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
                  srsFile ? 'border-white/70 bg-white/5' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(event) => setSrsFile(event.target.files?.[0] || null)}
                />
                <Upload className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 text-sm font-medium text-white">{srsFile ? srsFile.name : 'Choose PDF or DOCX'}</p>
                <p className="mt-1 text-xs text-slate-400">Maximum size 10 MB</p>
              </div>
            </label>

            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
                <span>Processing</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-black via-slate-800 to-slate-800 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-slate-300">{message}</p>
              {error ? (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <XCircle className="h-4 w-4" />
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => router.push('/projects')} disabled={isSubmitting}>
                Back to projects
              </Button>
              <Button onClick={handleSubmit} isLoading={isSubmitting}>
                Analyze SRS
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Features</p>
            <p className="mt-3 text-4xl font-semibold text-white">{generatedCounts.features}</p>
            <p className="mt-2 text-sm text-slate-400">Requirements grouped into product capabilities.</p>
          </div>
          <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">User Stories</p>
            <p className="mt-3 text-4xl font-semibold text-white">{generatedCounts.stories}</p>
            <p className="mt-2 text-sm text-slate-400">Backlog items generated directly from the SRS.</p>
          </div>
          <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Test Cases</p>
            <p className="mt-3 text-4xl font-semibold text-white">{generatedCounts.testCases}</p>
            <p className="mt-2 text-sm text-slate-400">Validation scenarios ready for QA review.</p>
          </div>
        </section>

        {resultProject ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Generated Backlog</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">User story preview</h2>
                </div>
                {resultProject.status === 'completed' ? (
                  <div className="flex items-center gap-2 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Ready
                  </div>
                ) : null}
              </div>

              <p className="mt-3 text-sm text-slate-300">
                {resultProject.aiResponse?.summary || 'Generated stories will appear here as soon as analysis finishes.'}
              </p>

              <div className="mt-6 space-y-4">
                {storyPreview.length > 0 ? (
                  storyPreview.map((story, index) => (
                    <article key={`${story.title}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{story.title || story.goal}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{story.actor}</p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          {story.priority || 'Medium'}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{story.description || story.benefit || story.goal}</p>
                      {story.acceptanceCriteria ? (
                        <p className="mt-3 text-xs text-slate-300">Acceptance: {story.acceptanceCriteria.split('\n')[0]}</p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
                    No user stories available yet.
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button variant="outline" onClick={() => router.push('/user-stories')} disabled={storyPreview.length === 0}>
                  Open user stories
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">QA Output</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Test case preview</h2>
                </div>
                <ClipboardList className="h-6 w-6 text-slate-500" />
              </div>

              <div className="mt-6 space-y-4">
                {testCasePreview.length > 0 ? (
                  testCasePreview.map((testCase) => (
                    <article key={testCase.testCaseId} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{testCase.testCaseId}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{testCase.title}</p>
                        </div>
                        <TestTube2 className="h-5 w-5 text-slate-300" />
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{testCase.preconditions || 'No preconditions specified.'}</p>
                      <p className="mt-3 text-xs text-slate-300">
                        Expected: {testCase.expectedResult || 'Expected result pending'}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">
                    No test cases available yet.
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button variant="outline" onClick={() => router.push('/test-manager')} disabled={testCasePreview.length === 0}>
                  Open test manager
                </Button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </Layout>
  )
}
