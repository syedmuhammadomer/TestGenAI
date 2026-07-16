'use client'

import React, { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Activity, CheckCircle2, Clock, XCircle, RefreshCw, Search, AlertTriangle } from 'lucide-react'

type JobStatus = 'completed' | 'processing' | 'queued' | 'failed'

interface Job {
  id: string
  company: string
  project: string
  status: JobStatus
  startedAt: string
  duration: string
  error?: string
}

const JOBS: Job[] = [
  { id: 'JOB-1284', company: 'BuildRight Solutions', project: 'Auth Module', status: 'completed', startedAt: '5 min ago', duration: '28s' },
  { id: 'JOB-1283', company: 'Acme Corp', project: 'Inventory API', status: 'completed', startedAt: '12 min ago', duration: '34s' },
  { id: 'JOB-1282', company: 'DevFlow Inc', project: 'Payment Service', status: 'processing', startedAt: '2 min ago', duration: '—' },
  { id: 'JOB-1281', company: 'NanoSoft', project: 'User Portal', status: 'processing', startedAt: '4 min ago', duration: '—' },
  { id: 'JOB-1280', company: 'Startup Labs', project: 'Admin Dashboard', status: 'queued', startedAt: '1 min ago', duration: '—' },
  { id: 'JOB-1279', company: 'TechVision Ltd', project: 'SRS v2', status: 'queued', startedAt: '3 min ago', duration: '—' },
  { id: 'JOB-1278', company: 'QualityFirst', project: 'Legacy Migration', status: 'failed', startedAt: '1 hour ago', duration: '180s', error: 'AbortError: AI request timed out after 180s' },
  { id: 'JOB-1277', company: 'Acme Corp', project: 'CRM Module', status: 'failed', startedAt: '2 hours ago', duration: '180s', error: 'JSON parse error: Unexpected end of input' },
  { id: 'JOB-1276', company: 'DevFlow Inc', project: 'Analytics', status: 'completed', startedAt: '3 hours ago', duration: '31s' },
  { id: 'JOB-1275', company: 'BuildRight Solutions', project: 'API Gateway', status: 'completed', startedAt: '4 hours ago', duration: '22s' },
]

const statusIcon: Record<JobStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  processing: <Activity className="w-4 h-4 text-amber-400 animate-pulse" />,
  queued: <Clock className="w-4 h-4 text-blue-400" />,
  failed: <XCircle className="w-4 h-4 text-rose-400" />,
}

const statusColor: Record<JobStatus, string> = {
  completed: 'bg-emerald-900/20 text-emerald-400 border-emerald-700/40',
  processing: 'bg-amber-900/20 text-amber-400 border-amber-700/40',
  queued: 'bg-blue-900/20 text-blue-400 border-blue-700/40',
  failed: 'bg-rose-900/20 text-rose-400 border-rose-700/40',
}

export default function AdminJobsPage() {
  const [filter, setFilter] = useState<'all' | JobStatus>('all')
  const [search, setSearch] = useState('')
  const [retrying, setRetrying] = useState<string | null>(null)

  const filtered = JOBS.filter((j) => {
    const matchStatus = filter === 'all' || j.status === filter
    const matchSearch = `${j.company} ${j.project} ${j.id}`.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    completed: JOBS.filter((j) => j.status === 'completed').length,
    processing: JOBS.filter((j) => j.status === 'processing').length,
    queued: JOBS.filter((j) => j.status === 'queued').length,
    failed: JOBS.filter((j) => j.status === 'failed').length,
  }

  const handleRetry = async (jobId: string) => {
    setRetrying(jobId)
    await new Promise((r) => setTimeout(r, 1500))
    setRetrying(null)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Infrastructure</p>
          <h1 className="text-2xl font-bold text-white mt-1">AI Job Queue</h1>
          <p className="text-sm text-slate-400 mt-1">SRS processing jobs across all tenants</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Completed', count: stats.completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', status: 'completed' as JobStatus },
            { label: 'Processing', count: stats.processing, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10', status: 'processing' as JobStatus },
            { label: 'Queued', count: stats.queued, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', status: 'queued' as JobStatus },
            { label: 'Failed', count: stats.failed, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', status: 'failed' as JobStatus },
          ].map(({ label, count, icon: Icon, color, bg, status }) => (
            <button
              key={label}
              onClick={() => setFilter(filter === status ? 'all' : status)}
              className={`bg-[#0d0d16] border rounded-2xl p-5 text-left transition hover:border-white/10 ${filter === status ? 'border-white/20' : 'border-white/5'}`}
            >
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {stats.failed > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-700/40 bg-rose-900/15 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-300">{stats.failed} jobs failed. Review and retry them below.</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 w-56"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0d0d16] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Job ID</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Company</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Project</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Started</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500">Duration</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((job) => (
                  <React.Fragment key={job.id}>
                    <tr className="hover:bg-white/2 transition">
                      <td className="px-5 py-3 font-mono text-xs text-slate-400">{job.id}</td>
                      <td className="px-5 py-3 font-medium text-white">{job.company}</td>
                      <td className="px-5 py-3 text-slate-300">{job.project}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${statusColor[job.status]}`}>
                          {statusIcon[job.status]} {job.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">{job.startedAt}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{job.duration}</td>
                      <td className="px-5 py-3">
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            disabled={retrying === job.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700/20 text-amber-400 hover:bg-amber-700/30 text-xs font-medium transition disabled:opacity-60"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${retrying === job.id ? 'animate-spin' : ''}`} />
                            {retrying === job.id ? 'Retrying…' : 'Retry'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {job.status === 'failed' && job.error && (
                      <tr className="bg-rose-950/20">
                        <td colSpan={7} className="px-5 py-2">
                          <p className="text-xs font-mono text-rose-400/80">{job.error}</p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
