'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { useProjectContext } from '@/context/ProjectContext'
import { FileText, Upload, CheckCircle2, Clock, AlertTriangle, Layers, TestTube, Users, ClipboardList, Download, Eye, X } from 'lucide-react'

const statusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  processing: <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />,
  queued: <Clock className="w-3.5 h-3.5 text-slate-400" />,
  failed: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
}

const statusLabel: Record<string, string> = {
  completed: 'Processed',
  processing: 'Processing',
  queued: 'Queued',
  failed: 'Failed',
}

const statusColor: Record<string, string> = {
  completed: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40',
  processing: 'bg-amber-900/30 text-amber-300 border-amber-700/40',
  queued: 'bg-slate-800 text-slate-300 border-slate-700',
  failed: 'bg-rose-900/30 text-rose-300 border-rose-700/40',
}

type ProjectRecord = ReturnType<typeof useProjectContext>['projects'][number]

// Extra fields returned by the API but not in the shared ProjectRecord type
type DocProject = ProjectRecord & { srsPath?: string; extractedText?: string }
type FeatureItem = { title: string; description?: string }

type PreviewProject = DocProject | null

export default function DocumentsPage() {
  const router = useRouter()
  const { projects, loading, selectedProjectId, setSelectedProjectId } = useProjectContext()
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<PreviewProject>(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) router.push('/login')
  }, [router])

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter((p) => p.name.toLowerCase().includes(q))
  }, [projects, search])

  const stats = useMemo(() => ({
    total: projects.length,
    completed: projects.filter((p) => p.status === 'completed').length,
    processing: projects.filter((p) => p.status === 'processing' || p.status === 'queued').length,
    failed: projects.filter((p) => p.status === 'failed').length,
  }), [projects])

  return (
    <Layout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Repository</p>
            <h1 className="text-2xl font-bold text-white mt-1">Documents</h1>
            <p className="text-sm text-slate-400 mt-1">SRS documents and their extracted AI artifacts</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition"
          >
            <Upload className="w-4 h-4" />
            Upload SRS
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Documents', value: stats.total, color: 'text-white' },
            { label: 'Processed', value: stats.completed, color: 'text-emerald-400' },
            { label: 'In Queue', value: stats.processing, color: 'text-amber-400' },
            { label: 'Failed', value: stats.failed, color: 'text-rose-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-12 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {search ? 'No documents match your search.' : 'No documents yet. Upload an SRS to get started.'}
            </p>
          </div>
        )}

        {/* Document grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const p = project as DocProject
              const ext = p.srsPath ? p.srsPath.split('.').pop()?.toUpperCase() : 'DOC'
              const uploadDate = project.createdAt
                ? new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Unknown date'
              const isActive = selectedProjectId === project.id

              return (
                <div
                  key={project.id}
                  className={`bg-slate-950 border rounded-2xl p-5 space-y-4 transition cursor-pointer hover:border-slate-600 ${isActive ? 'border-primary-600/60 ring-1 ring-primary-600/30' : 'border-slate-800'}`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  {/* File icon + name */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-600/15 border border-primary-600/20 flex flex-col items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary-400" />
                      <span className="text-[9px] font-bold text-primary-500 mt-0.5">{ext}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{project.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Uploaded {uploadDate}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 ${statusColor[project.status] || statusColor.queued}`}>
                      {statusIcon[project.status]}
                      {statusLabel[project.status] || project.status}
                    </span>
                  </div>

                  {/* Artifact counts */}
                  {project.status === 'completed' && (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { icon: Layers, label: 'Features', count: project.features?.length ?? 0 },
                        { icon: Users, label: 'Stories', count: project.userStories?.length ?? 0 },
                        { icon: TestTube, label: 'Tests', count: project.testCases?.length ?? 0 },
                        { icon: ClipboardList, label: 'RTM', count: project.rtm?.length ?? 0 },
                      ].map(({ icon: Icon, label, count }) => (
                        <div key={label} className="bg-slate-900 rounded-lg p-2">
                          <Icon className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                          <p className="text-sm font-bold text-white">{count}</p>
                          <p className="text-[10px] text-slate-500">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {project.status === 'failed' && project.failureReason && (
                    <p className="text-xs text-rose-400 bg-rose-900/20 rounded-lg px-3 py-2">
                      {project.failureReason}
                    </p>
                  )}

                  {(project.status === 'processing' || project.status === 'queued') && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>AI Processing…</span>
                        <span>{project.progress ?? 0}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all"
                          style={{ width: `${project.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreview(project) }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-xs font-medium transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project.id}`) }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary-600/20 text-primary-300 hover:bg-primary-600/30 text-xs font-medium transition"
                    >
                      <Download className="w-3.5 h-3.5" /> View Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setPreview(null)}>
          <div
            className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Document Preview</p>
                <h2 className="text-white font-semibold mt-0.5">{preview.name}</h2>
              </div>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusColor[preview.status] || statusColor.queued}`}>
                    {statusIcon[preview.status]}
                    {statusLabel[preview.status] || preview.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400 mb-1">Uploaded</p>
                  <p className="text-sm text-slate-300">
                    {preview.createdAt ? new Date(preview.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
              </div>

              {preview.status === 'completed' && (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { icon: Layers, label: 'Features', count: preview.features?.length ?? 0, color: 'text-blue-400' },
                      { icon: Users, label: 'User Stories', count: preview.userStories?.length ?? 0, color: 'text-purple-400' },
                      { icon: TestTube, label: 'Test Cases', count: preview.testCases?.length ?? 0, color: 'text-emerald-400' },
                      { icon: ClipboardList, label: 'RTM Entries', count: preview.rtm?.length ?? 0, color: 'text-orange-400' },
                    ].map(({ icon: Icon, label, count, color }) => (
                      <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                        <p className="text-xl font-bold text-white">{count}</p>
                        <p className="text-[10px] text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  {preview.features && preview.features.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-400 mb-3">Extracted Features</p>
                      <ul className="space-y-2">
                        {preview.features.map((f: FeatureItem, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <div>
                              <p className="font-medium text-white">{f.title}</p>
                              {f.description && <p className="text-xs text-slate-400 mt-0.5">{f.description}</p>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {preview.extractedText && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-400 mb-2">Extracted Text Preview</p>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {preview.extractedText.slice(0, 800)}{preview.extractedText.length > 800 ? '…' : ''}
                      </div>
                    </div>
                  )}
                </>
              )}

              {preview.status === 'failed' && preview.failureReason && (
                <div className="bg-rose-900/20 border border-rose-700/40 rounded-xl p-4 text-sm text-rose-300">
                  <p className="font-semibold mb-1">Processing Error</p>
                  <p>{preview.failureReason}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-sm transition"
              >
                Close
              </button>
              <button
                onClick={() => { setPreview(null); router.push(`/projects/${preview.id}`) }}
                className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition"
              >
                View Full Details
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
