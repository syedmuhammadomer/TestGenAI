'use client'

import { useState } from 'react'
import { PlusCircle, MoreVertical, Search } from 'lucide-react'
import { useRouter } from 'next/router'
import Button from './Button'

type ProjectSummary = {
  id: number
  name: string
  status: string
  description?: string
  features?: { title?: string }[]
  testCases?: { testCaseId?: string }[]
  createdAt?: string
}

interface ProjectsProps {
  projects: ProjectSummary[]
  onDeleteRequest: (project: ProjectSummary) => void
}

export default function Projects({ projects, onDeleteRequest }: ProjectsProps) {
  const router = useRouter()
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  return (
    <div>
      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500">Manage your QA projects and track progress</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full lg:w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <select className="border border-slate-200 bg-white text-slate-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>All Status</option>
          </select>
          <select className="border border-slate-200 bg-white text-slate-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>Sort by: Recent</option>
          </select>
          <Button onClick={() => router.push('/projects/new')}>
            <PlusCircle className="w-5 h-5 mr-2" /> New Project
          </Button>
        </div>
      </div>

      {/* grid */}
      {projects.length === 0 ? (
        <div className="text-slate-500 bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">No projects available yet. Queue one to start.</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="relative bg-white rounded-2xl shadow-soft hover:shadow-card transition-shadow border border-slate-200 overflow-hidden"
            >
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center relative">
                  <h2 className="text-lg font-semibold text-slate-900">{project.name}</h2>
                  <button
                    onClick={() => setMenuOpenId((prev) => (prev === project.id ? null : project.id))}
                    className="rounded-full p-1 transition hover:bg-slate-100"
                    aria-label="Project options"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                  {menuOpenId === project.id && (
                    <div className="absolute right-0 top-10 z-10 w-36 rounded-lg border border-slate-200 bg-white shadow-elevated">
                      <button
                        onClick={() => {
                          setMenuOpenId(null)
                          onDeleteRequest(project)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition"
                      >
                        Delete project
                      </button>
                    </div>
                  )}
                </div>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    project.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-600'
                      : project.status === 'processing'
                        ? 'bg-primary-50 text-primary-600'
                        : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {project.status.toUpperCase()}
                </span>
                <p className="text-sm text-slate-500">{project.description || 'Automated QA insight in progress'}</p>
                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{project.features?.length ?? 0}</p>
                    <p className="text-slate-500">Features</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{project.testCases?.length ?? 0}</p>
                    <p className="text-slate-500">Test Cases</p>
                  </div>
                </div>
                <div className="text-xs h-4 text-slate-400">
                  Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
