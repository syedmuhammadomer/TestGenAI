'use client'

import { useEffect, useState } from 'react'
import { PlusCircle, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/router'
import Button from './Button'
import { User } from '@/types'

type ProjectSummary = {
  id: number
  name: string
  status: string
  description?: string
  features?: { title?: string }[]
  userStories?: { id?: number }[]
  testCases?: { testCaseId?: string }[]
  createdAt?: string
  progress?: number
}

interface ProjectsProps {
  projects: ProjectSummary[]
  onDeleteRequest: (project: ProjectSummary) => void
}

export default function Projects({ projects, onDeleteRequest }: ProjectsProps) {
  const router = useRouter()
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('userData')
    setUser(storedUser ? (JSON.parse(storedUser) as User) : null)
  }, [])

  const canCreateProject = Boolean(user) || (typeof window !== 'undefined' && Boolean(window.localStorage.getItem('authToken')))

  const statusClassName = (status: string) => {
    if (status === 'completed') {
      return 'bg-slate-500/10 text-slate-300'
    }
    if (status === 'processing' || status === 'queued') {
      return 'bg-white/10 text-slate-300'
    }
    return 'bg-slate-500/10 text-slate-300'
  }

  return (
    <div>
      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="text-slate-400">Manage your QA projects and track progress</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full lg:w-64 pl-10 pr-4 py-2 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              🔍
            </span>
          </div>
          <select className="bg-slate-800 text-slate-100 rounded-lg py-2 px-3">
            <option>All Status</option>
          </select>
          <select className="bg-slate-800 text-slate-100 rounded-lg py-2 px-3">
            <option>Sort by: Recent</option>
          </select>
          {canCreateProject ? (
            <Button
              className="ml-auto bg-white hover:bg-slate-200 text-white"
              onClick={() => router.push('/projects/new')}
            >
              <PlusCircle className="w-5 h-5 mr-2" /> New Project
            </Button>
          ) : null}
        </div>
      </div>

      {/* grid */}
      {projects.length === 0 ? (
        <div className="text-slate-400">No projects available yet. Queue one to start.</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="relative bg-slate-800 rounded-xl shadow border border-slate-800 overflow-hidden"
            >
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center relative">
                  <h2 className="text-lg font-semibold text-white">{project.name}</h2>
                  <button
                    onClick={() => setMenuOpenId((prev) => (prev === project.id ? null : project.id))}
                    className="rounded-full p-1 transition hover:bg-slate-700"
                    aria-label="Project options"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                  {menuOpenId === project.id && (
                    <div className="absolute right-0 top-10 z-10 w-32 rounded-lg border border-slate-700 bg-slate-900 shadow-lg">
                      <button
                        onClick={() => {
                          setMenuOpenId(null)
                          onDeleteRequest(project)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-500/10 transition"
                      >
                        Delete project
                      </button>
                    </div>
                  )}
                </div>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusClassName(project.status)}`}
                >
                  {project.status.toUpperCase()}
                </span>
                <p className="app-subtext">{project.description || 'Automated QA insight in progress'}</p>
                <div className="grid grid-cols-3 gap-3 text-slate-300 text-xs">
                  <div>
                    <p className="text-2xl font-semibold text-white">{project.features?.length ?? 0}</p>
                    <p>Features</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{project.userStories?.length ?? 0}</p>
                    <p>Stories</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{project.testCases?.length ?? 0}</p>
                    <p>Test Cases</p>
                  </div>
                </div>
                {(project.status === 'queued' || project.status === 'processing') && typeof project.progress === 'number' ? (
                  <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-black to-slate-800 transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">Analysis progress: {project.progress}%</p>
                  </div>
                ) : null}
                <div className="text-xs h-4 text-slate-500">
                  Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
                </div>
                {/* confirmation modal handled outside */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
