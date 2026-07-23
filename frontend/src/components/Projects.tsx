'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, MoreVertical, Search, Trash2, Zap } from 'lucide-react'
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

type ProjectAnalyticsCache = {
  qualityScore?: number
  coveragePercentage?: number
}

interface ProjectsProps {
  projects: ProjectSummary[]
  onDeleteRequest: (project: ProjectSummary) => void
}

export default function Projects({ projects, onDeleteRequest }: ProjectsProps) {
  const router = useRouter()
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const [analyticsCache, setAnalyticsCache] = useState<Record<number, ProjectAnalyticsCache>>({})

  useEffect(() => {
    const cache: Record<number, ProjectAnalyticsCache> = {}
    for (const p of projects) {
      try {
        const raw = localStorage.getItem(`proj_analytics_${p.id}`)
        if (raw) cache[p.id] = JSON.parse(raw)
      } catch { /* noop */ }
    }
    setAnalyticsCache(cache)
  }, [projects])

  return (
    <div>
      {/* ── Value-prop hero banner ── */}
      <div className="mb-8 rounded-2xl border border-primary-500/20 bg-gradient-to-br from-primary-950/60 via-slate-900 to-slate-900 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-white leading-snug">
            Paste your SRS → Get sprint-ready stories, test cases &amp; RTM in 60 seconds
          </p>
          <p className="text-sm text-slate-400 mt-0.5">
            AI reads your requirements document and delivers a fully traceable QA artefact set — no manual work.
          </p>
        </div>
        <Button onClick={() => router.push('/projects/new')} className="shrink-0">
          <PlusCircle className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Your Projects</h1>
          <p className="text-slate-400 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''} · AI-analysed and sprint-ready</p>
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
        </div>
      </div>

      {/* grid */}
      {projects.length === 0 ? (
        <div className="text-slate-400 bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-12 text-center">No projects available yet. Queue one to start.</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const ac = analyticsCache[project.id]
            const coverage = ac?.coveragePercentage
            const quality  = ac?.qualityScore

            const coverageColor =
              coverage == null ? null
              : coverage >= 80 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : coverage >= 50 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'

            const qualityColor =
              quality == null ? null
              : quality >= 80 ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : quality >= 50 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'

            return (
              <div
                key={project.id}
                className="relative bg-slate-950 rounded-2xl shadow-soft hover:shadow-card transition-shadow border border-slate-800 overflow-hidden cursor-pointer group"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                {/* top accent bar — colour by status */}
                <div className={`h-0.5 w-full ${
                  project.status === 'completed' ? 'bg-emerald-500'
                  : project.status === 'processing' ? 'bg-primary-500'
                  : project.status === 'failed' ? 'bg-rose-500'
                  : 'bg-slate-700'
                }`} />

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

                  {/* Status + quality badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      project.status === 'completed'
                        ? 'bg-emerald-600/10 text-emerald-300'
                        : project.status === 'processing'
                          ? 'bg-primary-600/10 text-primary-300'
                          : 'bg-rose-600/10 text-rose-300'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                    {coverage != null && coverageColor && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${coverageColor}`}>
                        <span className="text-[9px]">COV</span> {coverage}%
                      </span>
                    )}
                    {quality != null && qualityColor && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${qualityColor}`}>
                        <span className="text-[9px]">QA</span> {quality}%
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-400">{project.description || 'Automated QA insight in progress'}</p>

                  {/* Coverage mini-bar (only when data exists) */}
                  {coverage != null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Coverage</span><span>{coverage}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            coverage >= 80 ? 'bg-emerald-500'
                            : coverage >= 50 ? 'bg-amber-500'
                            : 'bg-rose-500'
                          }`}
                          style={{ width: `${coverage}%` }}
                        />
                      </div>
                    </div>
                  )}

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
            )
          })}
        </div>
      )}
    </div>
  )
}
