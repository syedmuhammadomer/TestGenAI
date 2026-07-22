'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { useProjectContext, UserStoryItem } from '@/context/ProjectContext'
import { userStoryService, UserStoryInput } from '@/services/userStoryService'
import { toast } from 'sonner'
import {
  Sparkles, User, Pencil, Trash2, Plus, X, Loader2, Search,
  ChevronDown, ArrowRight, CheckCircle2, Flag, UserCircle,
} from 'lucide-react'

// ── Local meta types (priority/status/assignee not stored in backend yet) ──
type StoryPriority = 'High' | 'Medium' | 'Low'
type StoryStatus   = 'Draft' | 'Ready' | 'In Progress' | 'Done'

interface StoryMeta {
  priority: StoryPriority
  status:   StoryStatus
  assignee: string
}

const DEFAULT_META: StoryMeta = { priority: 'Medium', status: 'Draft', assignee: '' }

const PRIORITY_COLORS: Record<StoryPriority, string> = {
  High:   'bg-rose-900/30 text-rose-300 border-rose-700/50',
  Medium: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
  Low:    'bg-slate-800 text-slate-400 border-slate-700',
}

const STATUS_COLORS: Record<StoryStatus, string> = {
  Draft:       'bg-slate-800 text-slate-400 border-slate-700',
  Ready:       'bg-blue-900/30 text-blue-300 border-blue-700/50',
  'In Progress':'bg-amber-900/30 text-amber-300 border-amber-700/50',
  Done:        'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
}

const PRIORITIES: StoryPriority[] = ['High', 'Medium', 'Low']
const STATUSES: StoryStatus[]     = ['Draft', 'Ready', 'In Progress', 'Done']

// ── Local meta persistence ────────────────────────────────────────────────────
function metaKey(projectId: number, storyId: number) {
  return `us_meta_${projectId}_${storyId}`
}

function loadMeta(projectId: number, storyId: number): StoryMeta {
  try {
    const raw = localStorage.getItem(metaKey(projectId, storyId))
    return raw ? { ...DEFAULT_META, ...JSON.parse(raw) } : { ...DEFAULT_META }
  } catch { return { ...DEFAULT_META } }
}

function saveMeta(projectId: number, storyId: number, meta: StoryMeta) {
  try { localStorage.setItem(metaKey(projectId, storyId), JSON.stringify(meta)) } catch { /* noop */ }
}

// ── Form type ─────────────────────────────────────────────────────────────────
type StoryForm = UserStoryInput & { priority: StoryPriority; status: StoryStatus; assignee: string }

const emptyForm: StoryForm = {
  actor: '', goal: '', benefit: '', acceptanceCriteria: '',
  priority: 'Medium', status: 'Draft', assignee: '',
}

const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500'

// ── Main page ─────────────────────────────────────────────────────────────────
export default function UserStoriesPage() {
  const router = useRouter()
  const { selectedProject, selectedProjectId, loading, refreshSelectedProject } = useProjectContext()

  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [form, setForm]             = useState<StoryForm>(emptyForm)
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError]           = useState<string | null>(null)

  // local meta state: storyId → StoryMeta
  const [metas, setMetas]           = useState<Record<number, StoryMeta>>({})
  const [pushedIds, setPushedIds]   = useState<Set<number>>(new Set())

  // filters
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<StoryStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<StoryPriority | 'all'>('all')

  const userStories: UserStoryItem[] = selectedProject?.userStories ?? []

  // load local metas whenever project/stories change
  useEffect(() => {
    if (!selectedProjectId) return
    const loaded: Record<number, StoryMeta> = {}
    for (const s of userStories) {
      loaded[s.id] = loadMeta(selectedProjectId, s.id)
    }
    setMetas(loaded)
    setPushedIds(new Set())
  }, [selectedProjectId, userStories.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const getMeta = (id: number): StoryMeta => metas[id] ?? { ...DEFAULT_META }

  const patchMeta = useCallback((storyId: number, patch: Partial<StoryMeta>) => {
    if (!selectedProjectId) return
    setMetas((prev) => {
      const next = { ...prev, [storyId]: { ...(prev[storyId] ?? DEFAULT_META), ...patch } }
      saveMeta(selectedProjectId, storyId, next[storyId])
      return next
    })
  }, [selectedProjectId])

  // ── Filtered stories ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return userStories.filter((s) => {
      const meta = getMeta(s.id)
      const matchSearch = !q || `${s.actor} ${s.goal} ${s.benefit} ${s.acceptanceCriteria}`.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || meta.status === statusFilter
      const matchPriority = priorityFilter === 'all' || meta.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
  }, [userStories, metas, search, statusFilter, priorityFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stats ──
  const statCounts = useMemo(() => {
    const counts: Record<StoryStatus, number> = { Draft: 0, Ready: 0, 'In Progress': 0, Done: 0 }
    for (const s of userStories) counts[getMeta(s.id).status]++
    return counts
  }, [userStories, metas]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD ──
  const startCreate = () => {
    setEditingId(null); setForm(emptyForm); setError(null); setShowForm(true)
  }

  const startEdit = (story: UserStoryItem) => {
    const meta = getMeta(story.id)
    setEditingId(story.id)
    setForm({
      actor: story.actor ?? '', goal: story.goal ?? '',
      benefit: story.benefit ?? '', acceptanceCriteria: story.acceptanceCriteria ?? '',
      priority: meta.priority, status: meta.status, assignee: meta.assignee,
    })
    setError(null); setShowForm(true)
  }

  const cancelForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); setError(null) }

  const handleSubmit = async () => {
    if (!selectedProjectId) return
    if (!form.goal.trim()) { setError('Goal is required'); return }
    setSaving(true); setError(null)
    try {
      const input: UserStoryInput = {
        actor: form.actor, goal: form.goal,
        benefit: form.benefit, acceptanceCriteria: form.acceptanceCriteria,
      }
      if (editingId != null) {
        await userStoryService.update(selectedProjectId, editingId, input)
        patchMeta(editingId, { priority: form.priority, status: form.status, assignee: form.assignee })
        toast.success('User story updated')
      } else {
        const created = await userStoryService.create(selectedProjectId, input)
        if (created?.id) patchMeta(created.id, { priority: form.priority, status: form.status, assignee: form.assignee })
        toast.success('User story created')
      }
      await refreshSelectedProject()
      cancelForm()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save user story'
      setError(msg)
      toast.error(msg)
    } finally { setSaving(false) }
  }

  const handleDelete = async (story: UserStoryItem) => {
    if (!selectedProjectId) return
    setDeletingId(story.id)
    try {
      await userStoryService.remove(selectedProjectId, story.id)
      await refreshSelectedProject()
      toast.success('User story deleted')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete user story'
      setError(msg)
      toast.error(msg)
    } finally { setDeletingId(null) }
  }

  const handlePushToBacklog = (storyId: number) => {
    patchMeta(storyId, { status: 'Ready' })
    setPushedIds((prev) => new Set([...prev, storyId]))
    setTimeout(() => router.push('/backlogs'), 600)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-6xl">

        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">User Stories</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              {selectedProject?.name ?? 'User Stories'}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              AI-generated and manually added stories for your selected project.
            </p>
          </div>
          <Button size="md" onClick={startCreate} disabled={!selectedProjectId}>
            <Plus className="w-4 h-4 mr-2" /> Add Story
          </Button>
        </header>

        {/* Status stat row */}
        {selectedProjectId && userStories.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                className={`rounded-xl border p-4 text-left transition ${
                  statusFilter === s
                    ? STATUS_COLORS[s] + ' ring-1 ring-inset ring-white/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <p className="text-2xl font-bold text-white">{statCounts[s]}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s}</p>
              </button>
            ))}
          </div>
        )}

        {/* Banners */}
        {!selectedProjectId && !loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-500">
            Select or create a project to view and manage its user stories.
          </div>
        )}
        {selectedProject && selectedProject.status !== 'completed' && (
          <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-300">
            AI analysis is <strong>{selectedProject.status}</strong>. Generated stories will appear here once complete.
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-rose-700/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}

        {/* Form */}
        {showForm && (
          <section className="rounded-2xl border border-slate-700 bg-slate-950 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                {editingId != null ? 'Edit User Story' : 'New User Story'}
              </h2>
              <button onClick={cancelForm} className="text-slate-500 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Actor</label>
                <input value={form.actor} onChange={(e) => setForm((f) => ({ ...f, actor: e.target.value }))}
                  placeholder="e.g. Registered member" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Goal *</label>
                <input value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                  placeholder="e.g. search the catalog by title" className={inputCls} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Benefit</label>
              <input value={form.benefit} onChange={(e) => setForm((f) => ({ ...f, benefit: e.target.value }))}
                placeholder="so that I can find books quickly" className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Acceptance Criteria</label>
              <textarea value={form.acceptanceCriteria} onChange={(e) => setForm((f) => ({ ...f, acceptanceCriteria: e.target.value }))}
                rows={3} className={`${inputCls} resize-none`} placeholder="Given… When… Then…" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Priority</label>
                <div className="relative">
                  <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as StoryPriority }))}
                    className={`${inputCls} pl-9 appearance-none`}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Status</label>
                <div className="relative">
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as StoryStatus }))}
                    className={`${inputCls} appearance-none`}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Assignee</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))}
                    placeholder="e.g. Sarah J." className={`${inputCls} pl-9`} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <Button variant="outline" size="md" onClick={cancelForm}>Cancel</Button>
              <Button size="md" onClick={handleSubmit} isLoading={saving}>
                {editingId != null ? 'Save Changes' : 'Create Story'}
              </Button>
            </div>
          </section>
        )}

        {/* Filters */}
        {selectedProjectId && userStories.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stories…"
                className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 w-52" />
            </div>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as StoryPriority | 'all')}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
              <option value="all">All Priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {(search || statusFilter !== 'all' || priorityFilter !== 'all') && (
              <button onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all') }}
                className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
            <span className="ml-auto text-xs text-slate-500">{filtered.length} of {userStories.length} stories</span>
          </div>
        )}

        {/* Story cards */}
        <section className="space-y-3">
          {userStories.length === 0 && !showForm && selectedProjectId && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-500">
              No user stories yet. They&apos;ll appear once AI processing completes, or add one manually above.
            </div>
          )}

          {filtered.length === 0 && userStories.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-500 text-center">
              No stories match your filters.
            </div>
          )}

          {filtered.map((story, i) => {
            const meta = getMeta(story.id)
            const pushed = pushedIds.has(story.id)
            return (
              <div key={story.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-3 hover:border-slate-700 transition">

                {/* Top row: index + badges + actions */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-7 h-7 rounded-full bg-primary-600/20 text-primary-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>

                    {/* Source badge */}
                    {story.source === 'ai' ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary-700/40 bg-primary-900/20 text-primary-300 text-[10px] font-semibold px-2.5 py-0.5">
                        <Sparkles className="w-3 h-3" /> AI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 text-slate-400 text-[10px] font-semibold px-2.5 py-0.5">
                        <User className="w-3 h-3" /> Manual
                      </span>
                    )}

                    {/* Priority badge */}
                    <span className={`inline-flex items-center gap-1 rounded-full border text-[10px] font-semibold px-2.5 py-0.5 ${PRIORITY_COLORS[meta.priority]}`}>
                      <Flag className="w-2.5 h-2.5" /> {meta.priority}
                    </span>

                    {/* Status dropdown */}
                    <select
                      value={meta.status}
                      onChange={(e) => patchMeta(story.id, { status: e.target.value as StoryStatus })}
                      className={`rounded-full border text-[10px] font-semibold px-2.5 py-0.5 appearance-none cursor-pointer focus:outline-none transition ${STATUS_COLORS[meta.status]}`}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Assignee chip */}
                    {meta.assignee && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 text-slate-300 text-[10px] font-medium px-2.5 py-0.5">
                        <UserCircle className="w-3 h-3" /> {meta.assignee}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Push to Backlog */}
                    <button
                      onClick={() => handlePushToBacklog(story.id)}
                      disabled={pushed || meta.status === 'Done'}
                      title="Push to Backlog"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                        pushed
                          ? 'border-emerald-700/40 bg-emerald-900/20 text-emerald-300'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                      } disabled:opacity-50`}
                    >
                      {pushed
                        ? <><CheckCircle2 className="w-3.5 h-3.5" /> Pushed!</>
                        : <><ArrowRight className="w-3.5 h-3.5" /> Push to Backlog</>}
                    </button>
                    <button
                      onClick={() => startEdit(story)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-primary-400 hover:bg-primary-900/20 transition"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(story)}
                      disabled={deletingId === story.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition disabled:opacity-40"
                      aria-label="Delete"
                    >
                      {deletingId === story.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Story body */}
                <p className="text-sm text-white">
                  As a <span className="font-semibold text-primary-300">{story.actor || 'user'}</span>, I want to{' '}
                  <span className="font-semibold">{story.goal}</span>
                  {story.benefit ? <span className="text-slate-400"> so that {story.benefit}</span> : null}.
                </p>

                {/* Acceptance criteria */}
                {story.acceptanceCriteria && (
                  <div className="ml-0 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-semibold mb-1">Acceptance Criteria</p>
                    <p className="text-xs text-slate-300 whitespace-pre-line">{story.acceptanceCriteria}</p>
                  </div>
                )}
              </div>
            )
          })}
        </section>
      </div>
    </Layout>
  )
}
