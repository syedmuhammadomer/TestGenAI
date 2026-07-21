'use client'

import { useState } from 'react'
import { PlusCircle, MoreVertical, Search, Trash2 } from 'lucide-react'
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
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400">Manage your QA projects and track progress</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full lg:w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <select className="border border-slate-800 bg-slate-900 text-slate-100 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>All Status</option>
          </select>
          <select className="border border-slate-800 bg-slate-900 text-slate-100 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>Sort by: Recent</option>
          </select>
          <Button onClick={() => router.push('/projects/new')}>
            <PlusCircle className="w-5 h-5 mr-2" /> New Project
          </Button>
        </div>
      </div>

      {/* grid */}
      {projects.length === 0 ? (
        <div className="text-slate-400 bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-12 text-center">No projects available yet. Queue one to start.</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="relative bg-slate-950 rounded-2xl shadow-soft hover:shadow-card transition-shadow border border-slate-800 overflow-hidden cursor-pointer group"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center relative">
                  <h2 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">{project.name}</h2>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId((prev) => (prev === project.id ? null : project.id)) }}
                    className="rounded-full p-1 transition hover:bg-slate-800"
                    aria-label="Project options"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                  {menuOpenId === project.id && (
                    <div className="absolute right-0 top-10 z-10 w-44 rounded-xl border border-slate-700/60 bg-zinc-900 shadow-elevated overflow-hidden p-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpenId(null)
                          onDeleteRequest(project)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-all duration-150"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        Delete project
                      </button>
                    </div>
                  )}
                </div>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    project.status === 'completed'
                      ? 'bg-emerald-600/10 text-emerald-200'
                      : project.status === 'processing'
                        ? 'bg-primary-600/10 text-primary-200'
                        : 'bg-rose-600/10 text-rose-200'
                  }`}
                >
                  {project.status.toUpperCase()}
                </span>
                <p className="text-sm text-slate-400">{project.description || 'Automated QA insight in progress'}</p>
                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                  <div>
                    <p className="text-2xl font-semibold text-white">{project.features?.length ?? 0}</p>
                    <p className="text-slate-400">Features</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-white">{project.testCases?.length ?? 0}</p>
                    <p className="text-slate-400">Test Cases</p>
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
