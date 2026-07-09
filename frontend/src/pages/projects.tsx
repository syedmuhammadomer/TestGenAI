'use client'

import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Projects from '@/components/Projects'
import Button from '@/components/Button'
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
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

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
      {actionMessage && (
        <div
          className={`mb-4 text-sm ${
            actionMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {actionMessage.text}
        </div>
      )}
      <Projects
        projects={projects}
        onDeleteRequest={(project) => {
          setActionMessage(null)
          setDeleteModalProject(project)
        }}
      />
      {deleteModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Confirm Delete</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteModalProject.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setDeleteModalProject(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  setIsDeleting(true)
                  try {
                    await axios.delete(`${config.endpoints.projects}/${deleteModalProject.id}`)
                    setProjects((prev) => prev.filter(project => project.id !== deleteModalProject.id))
                    setActionMessage({ text: 'Project deleted successfully.', type: 'success' })
                    setDeleteModalProject(null)
                  } catch (error) {
                    setActionMessage({ text: handleApiError(error), type: 'error' })
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                isLoading={isDeleting}
              >
                Delete project
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
