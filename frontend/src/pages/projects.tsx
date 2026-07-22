'use client'

import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import Layout from '@/components/Layout'
import Projects from '@/components/Projects'
import { config, handleApiError } from '@/utils/config'

type ProjectSummary = {
  id: number
  name: string
  status: string
  features?: { title?: string }[]
  testCases?: { testCaseId?: string }[]
  updatedAt?: string
  createdAt?: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [serverState, setServerState] = useState<'ready' | 'down' | 'idle'>('idle')
  const [deleteModalProject, setDeleteModalProject] = useState<ProjectSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }

    const loadProjects = async () => {
      try {
        setServerState('idle')
        const [projectRes, healthRes] = await Promise.all([
          axios.get<ProjectSummary[]>(config.endpoints.projects),
          axios.post(config.endpoints.health),
          axios.get(config.endpoints.root),
        ])
        setProjects(projectRes.data)
        if (healthRes.status === 200) {
          setServerState('ready')
        }
      } catch (error) {
        console.error('Failed to fetch projects or health', error)
        setServerState('down')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-primary-600 text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="mb-6 text-sm text-slate-500">
        Server status: {serverState === 'ready' ? 'Healthy' : serverState === 'down' ? 'Unavailable' : 'Checking...'}
      </div>
      <Projects
        projects={projects}
        onDeleteRequest={(project) => setDeleteModalProject(project)}
      />
      {deleteModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
            {/* Red top bar */}
            <div className="h-1 w-full bg-rose-500" />
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Delete project?</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    <span className="font-semibold text-zinc-200">{deleteModalProject.name}</span> will be permanently removed. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setDeleteModalProject(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition-all duration-150 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsDeleting(true)
                    try {
                      await axios.delete(`${config.endpoints.projects}/${deleteModalProject.id}`)
                      setProjects((prev) => prev.filter(project => project.id !== deleteModalProject.id))
                      setDeleteModalProject(null)
                      toast.success('Project deleted successfully.')
                    } catch (error) {
                      toast.error(handleApiError(error))
                    } finally {
                      setIsDeleting(false)
                    }
                  }}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all duration-150 disabled:opacity-50"
                >
                  {isDeleting && (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Delete project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
