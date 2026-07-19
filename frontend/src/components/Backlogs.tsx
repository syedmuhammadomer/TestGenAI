import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, PlusCircle, X, Plus, Pencil, Trash2, Check, AlertCircle, LayoutGrid,
} from 'lucide-react'
import Button from './Button'
import { ProjectRecord, useProjectContext } from '@/context/ProjectContext'
import { userStoryService, UserStoryInput } from '@/services/userStoryService'
import { teamService, TeamMemberRecord } from '@/services/teamService'
import KanbanCardModal, {
  KanbanCardData,
  KanbanLabel,
  CardComment,
} from './KanbanCardModal'

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface KanbanSection {
  id: string
  name: string
}

interface CardMeta {
  sectionId: string
  priority: 'High' | 'Medium' | 'Low'
  assigneeId?: number
  labelIds: string[]
  comments: CardComment[]
}

/* ─── Storage helpers ────────────────────────────────────────────────────── */

function sectionsKey(pid: string | number) { return `kanban_sections_${pid}` }
function cardMetaKey(pid: string | number, cardId: string) { return `kanban_card_${pid}_${cardId}` }
function labelsKey(pid: string | number) { return `kanban_labels_${pid}` }

const DEFAULT_SECTIONS: KanbanSection[] = [
  { id: 'backlog',     name: 'Backlog'     },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'qa_reviews',  name: 'QA Reviews'  },
  { id: 'done',        name: 'Done'        },
]

function loadSections(pid: string | number): KanbanSection[] {
  try { const raw = localStorage.getItem(sectionsKey(pid)); if (raw) return JSON.parse(raw) } catch { /* noop */ }
  return DEFAULT_SECTIONS
}

function saveSections(pid: string | number, sections: KanbanSection[]) {
  localStorage.setItem(sectionsKey(pid), JSON.stringify(sections))
}

function loadCardMeta(pid: string | number, cardId: string): CardMeta {
  try { const raw = localStorage.getItem(cardMetaKey(pid, cardId)); if (raw) return JSON.parse(raw) } catch { /* noop */ }
  return { sectionId: DEFAULT_SECTIONS[0].id, priority: 'Medium', labelIds: [], comments: [] }
}

function saveCardMeta(pid: string | number, cardId: string, meta: CardMeta) {
  localStorage.setItem(cardMetaKey(pid, cardId), JSON.stringify(meta))
}

function loadLabels(pid: string | number): KanbanLabel[] {
  try { const raw = localStorage.getItem(labelsKey(pid)); if (raw) return JSON.parse(raw) } catch { /* noop */ }
  return []
}

function saveLabels(pid: string | number, labels: KanbanLabel[]) {
  localStorage.setItem(labelsKey(pid), JSON.stringify(labels))
}

/* ─── Column accent colours (cycles for custom sections) ─────────────────── */

const SECTION_COLORS: Record<string, { bar: string; count: string; glow: string }> = {
  backlog:     { bar: 'bg-slate-500',          count: 'bg-slate-700 text-slate-300',       glow: 'hover:shadow-slate-500/10'    },
  in_progress: { bar: 'bg-primary-500',        count: 'bg-primary-500/20 text-primary-300', glow: 'hover:shadow-primary-500/10' },
  qa_reviews:  { bar: 'bg-amber-500',          count: 'bg-amber-500/20 text-amber-300',    glow: 'hover:shadow-amber-500/10'   },
  done:        { bar: 'bg-emerald-500',        count: 'bg-emerald-500/20 text-emerald-300', glow: 'hover:shadow-emerald-500/10' },
}

const CYCLE_COLORS = [
  { bar: 'bg-violet-500', count: 'bg-violet-500/20 text-violet-300', glow: 'hover:shadow-violet-500/10' },
  { bar: 'bg-pink-500',   count: 'bg-pink-500/20 text-pink-300',     glow: 'hover:shadow-pink-500/10'   },
  { bar: 'bg-cyan-500',   count: 'bg-cyan-500/20 text-cyan-300',     glow: 'hover:shadow-cyan-500/10'   },
]

function getSectionColor(id: string, idx: number) {
  return SECTION_COLORS[id] ?? CYCLE_COLORS[idx % CYCLE_COLORS.length]
}

/* ─── Priority styles ────────────────────────────────────────────────────── */

const PRIORITY_LEFT: Record<string, string> = {
  High:   'border-l-red-500',
  Medium: 'border-l-amber-500',
  Low:    'border-l-blue-500',
}

const PRIORITY_DOT: Record<string, string> = {
  High:   'bg-red-500',
  Medium: 'bg-amber-400',
  Low:    'bg-blue-400',
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

type BacklogsProps = { selectedProject: ProjectRecord | null }

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Backlogs({ selectedProject }: BacklogsProps) {
  const { selectedProjectId, refreshSelectedProject } = useProjectContext()

  const [canEdit, setCanEdit]           = useState(false)
  const [currentUserName, setCurrentUserName] = useState('You')
  useEffect(() => {
    try {
      const raw = localStorage.getItem('userData')
      if (raw) {
        const u = JSON.parse(raw)
        const role = u?.role as string
        setCanEdit(role === 'company_admin' || role === 'pm')
        const name = [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.email || 'You'
        setCurrentUserName(name)
      }
    } catch { /* noop */ }
  }, [])

  /* sections */
  const [sections, setSections] = useState<KanbanSection[]>([])
  useEffect(() => {
    if (selectedProjectId == null) return
    setSections(loadSections(selectedProjectId))
  }, [selectedProjectId])

  function persistSections(next: KanbanSection[]) {
    setSections(next)
    if (selectedProjectId != null) saveSections(selectedProjectId, next)
  }

  const [addingSectionName, setAddingSectionName]       = useState('')
  const [showAddSection, setShowAddSection]             = useState(false)
  const [editingSectionId, setEditingSectionId]         = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName]     = useState('')
  const [deletingSectionId, setDeletingSectionId]       = useState<string | null>(null)
  const [dragOverSectionId, setDragOverSectionId]       = useState<string | null>(null)
  const addSectionRef  = useRef<HTMLInputElement>(null)
  const editSectionRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (showAddSection) addSectionRef.current?.focus() }, [showAddSection])
  useEffect(() => { if (editingSectionId) editSectionRef.current?.focus() }, [editingSectionId])

  function handleAddSection() {
    const name = addingSectionName.trim()
    if (!name) return
    persistSections([...sections, { id: `sec_${Date.now()}`, name }])
    setAddingSectionName('')
    setShowAddSection(false)
  }

  function handleRenameSection(id: string) {
    const name = editingSectionName.trim()
    if (!name) return
    persistSections(sections.map((s) => (s.id === id ? { ...s, name } : s)))
    setEditingSectionId(null)
  }

  function handleDeleteSection(id: string) {
    persistSections(sections.filter((s) => s.id !== id))
    setDeletingSectionId(null)
    if (selectedProjectId != null) {
      const remaining  = sections.filter((s) => s.id !== id)
      const fallbackId = remaining[0]?.id ?? DEFAULT_SECTIONS[0].id
      cards.forEach((card) => {
        const meta = loadCardMeta(selectedProjectId, card.id)
        if (meta.sectionId === id) saveCardMeta(selectedProjectId, card.id, { ...meta, sectionId: fallbackId })
      })
      refreshCardsFromStorage()
    }
  }

  /* labels */
  const [projectLabels, setProjectLabels] = useState<KanbanLabel[]>([])
  useEffect(() => {
    if (selectedProjectId == null) return
    setProjectLabels(loadLabels(selectedProjectId))
  }, [selectedProjectId])

  function persistLabels(next: KanbanLabel[]) {
    setProjectLabels(next)
    if (selectedProjectId != null) saveLabels(selectedProjectId, next)
  }

  /* team members */
  const [teamMembers, setTeamMembers] = useState<TeamMemberRecord[]>([])
  useEffect(() => {
    teamService.getDashboard().then((r) => setTeamMembers(r.members)).catch(() => { /* noop */ })
  }, [])

  /* cards */
  const baseCards = useMemo<KanbanCardData[]>(() => {
    if (!selectedProject?.userStories) return []
    return selectedProject.userStories.map((story, idx) => {
      const id   = `${selectedProject.id}-${story.id ?? idx + 1}`
      const meta = selectedProjectId != null
        ? loadCardMeta(selectedProjectId, id)
        : ({ sectionId: DEFAULT_SECTIONS[0].id, priority: 'Medium' as const, labelIds: [], comments: [] })
      return {
        id, projectId: String(selectedProject.id), title: story.goal,
        description: story.benefit || story.acceptanceCriteria || 'No additional details.',
        points: Math.max(1, story.acceptanceCriteria?.split('\n').filter(Boolean).length ?? 1),
        sectionId: meta.sectionId, priority: meta.priority,
        assigneeId: meta.assigneeId, labelIds: meta.labelIds, comments: meta.comments,
      }
    })
  }, [selectedProject, selectedProjectId])

  const [cards, setCards] = useState<KanbanCardData[]>([])
  useEffect(() => { setCards(baseCards) }, [baseCards])

  function refreshCardsFromStorage() {
    if (!selectedProjectId || !selectedProject?.userStories) return
    setCards(selectedProject.userStories.map((story, idx) => {
      const id   = `${selectedProject.id}-${story.id ?? idx + 1}`
      const meta = loadCardMeta(selectedProjectId, id)
      return {
        id, projectId: String(selectedProject.id), title: story.goal,
        description: story.benefit || story.acceptanceCriteria || 'No additional details.',
        points: Math.max(1, story.acceptanceCriteria?.split('\n').filter(Boolean).length ?? 1),
        sectionId: meta.sectionId, priority: meta.priority,
        assigneeId: meta.assigneeId, labelIds: meta.labelIds, comments: meta.comments,
      }
    }))
  }

  function handleCardUpdate(cardId: string, patch: Partial<KanbanCardData>) {
    if (!selectedProjectId) return
    const prev = cards.find((c) => c.id === cardId)
    if (!prev) return
    const next: KanbanCardData = { ...prev, ...patch }
    saveCardMeta(selectedProjectId, cardId, {
      sectionId: next.sectionId, priority: next.priority,
      assigneeId: next.assigneeId, labelIds: next.labelIds, comments: next.comments,
    })
    setCards((p) => p.map((c) => (c.id === cardId ? next : c)))
  }

  const [selectedCard, setSelectedCard] = useState<KanbanCardData | null>(null)
  const [searchTerm, setSearchTerm]     = useState('')

  /* create form */
  const [showCreateForm, setShowCreateForm]   = useState(false)
  const [newStorySection, setNewStorySection] = useState<string>('')
  const [form, setForm] = useState<UserStoryInput>({ actor: '', goal: '', benefit: '', acceptanceCriteria: '' })
  const [submitting, setSubmitting]           = useState(false)
  const [formError, setFormError]             = useState<string | null>(null)

  function startCreate(sectionId?: string) {
    setForm({ actor: '', goal: '', benefit: '', acceptanceCriteria: '' })
    setFormError(null)
    setNewStorySection(sectionId ?? sections[0]?.id ?? '')
    setShowCreateForm(true)
  }

  async function handleCreateStory() {
    if (!selectedProjectId) { setFormError('Select a project first.'); return }
    if (!form.goal?.trim()) { setFormError('Goal is required.'); return }
    setSubmitting(true); setFormError(null)
    try {
      const created = await userStoryService.create(selectedProjectId, form)
      await refreshSelectedProject()
      const storyId = created?.id ?? Date.now()
      const cardId  = `${selectedProjectId}-${storyId}`
      saveCardMeta(selectedProjectId, cardId, {
        sectionId: newStorySection || sections[0]?.id || DEFAULT_SECTIONS[0].id,
        priority: 'Medium', labelIds: [], comments: [],
      })
      setShowCreateForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create story.')
    } finally { setSubmitting(false) }
  }

  /* drag-and-drop */
  function handleDragStart(e: React.DragEvent, cardId: string) {
    e.dataTransfer.setData('cardId', cardId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent, targetSectionId: string) {
    e.preventDefault()
    setDragOverSectionId(null)
    const cardId = e.dataTransfer.getData('cardId')
    if (cardId) handleCardUpdate(cardId, { sectionId: targetSectionId })
  }

  function sectionCards(sectionId: string) {
    return cards.filter(
      (c) => c.sectionId === sectionId &&
        `${c.title} ${c.description}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  const totalCards = cards.length
  const doneCount  = cards.filter(c => c.sectionId === 'done').length
  const progress   = totalCards > 0 ? Math.round((doneCount / totalCards) * 100) : 0

  /* ── Render ── */

  return (
    <div className="flex flex-col h-full space-y-5">

      {/* ── Board Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
            <LayoutGrid className="w-4.5 h-4.5 text-primary-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Kanban Board</h1>
              {selectedProject && (
                <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                  {selectedProject.name}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              {canEdit ? 'Drag cards between columns to update status.' : 'View and track sprint progress.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Progress */}
          {totalCards > 0 && (
            <div className="hidden md:flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
              <div className="text-right">
                <p className="text-xs text-slate-500">Progress</p>
                <p className="text-sm font-bold text-white">{progress}%</p>
              </div>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{doneCount}/{totalCards}</p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search cards…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48 pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 placeholder-slate-600 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {canEdit && (
            <Button className="whitespace-nowrap" onClick={() => startCreate()} disabled={!selectedProjectId}>
              <PlusCircle className="w-4 h-4 mr-2 inline" /> New Card
            </Button>
          )}
        </div>
      </div>

      {/* No project */}
      {!selectedProject && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <LayoutGrid className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No project selected</p>
          <p className="text-slate-600 text-sm mt-1">Select a project from the sidebar to load its board.</p>
        </div>
      )}

      {/* Create story form */}
      {showCreateForm && (
        <section className="rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-xl space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Create a card</h2>
              <p className="text-xs text-slate-500 mt-0.5">Add a new story to the board.</p>
            </div>
            <button onClick={() => setShowCreateForm(false)} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Section</span>
              <select
                value={newStorySection}
                onChange={(e) => setNewStorySection(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
              >
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Actor</span>
              <input
                value={form.actor || ''}
                onChange={(e) => setForm((f) => ({ ...f, actor: e.target.value }))}
                placeholder="e.g. Registered member"
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Goal *</span>
            <input
              value={form.goal || ''}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              placeholder="e.g. search the catalog by title"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Benefit</span>
            <input
              value={form.benefit || ''}
              onChange={(e) => setForm((f) => ({ ...f, benefit: e.target.value }))}
              placeholder="so that I can find books quickly"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Acceptance Criteria</span>
            <textarea
              value={form.acceptanceCriteria || ''}
              onChange={(e) => setForm((f) => ({ ...f, acceptanceCriteria: e.target.value }))}
              rows={3}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 resize-none"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            <Button onClick={handleCreateStory} isLoading={submitting}>{submitting ? 'Creating…' : 'Create card'}</Button>
          </div>
        </section>
      )}

      {/* Delete section dialog */}
      {deletingSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-bold text-white mb-2">Delete section?</h3>
            <p className="text-sm text-slate-400 mb-5">Cards in this section will be moved to the first remaining section.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeletingSectionId(null)}>Cancel</Button>
              <button
                onClick={() => handleDeleteSection(deletingSectionId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition shadow-lg shadow-red-900/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Kanban columns ── */}
      {selectedProject && (
        <div className="flex gap-4 flex-1 min-h-[520px] pb-6 overflow-x-auto">

          {sections.map((section, colIdx) => {
            const colCards       = sectionCards(section.id)
            const isEditingThis  = editingSectionId === section.id
            const isDragOver     = dragOverSectionId === section.id
            const colColor       = getSectionColor(section.id, colIdx)

            return (
              <div
                key={section.id}
                className={`flex flex-col rounded-2xl flex-shrink-0 w-72 border transition-all duration-200 shadow-lg ${
                  isDragOver
                    ? 'border-primary-500/50 bg-slate-900/80 shadow-primary-900/20'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
                onDrop={(e) => handleDrop(e, section.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverSectionId(section.id) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSectionId(null) }}
              >
                {/* Column top accent */}
                <div className={`h-1 w-full rounded-t-2xl ${colColor.bar}`} />

                {/* Column header */}
                <div className="px-4 py-3 flex items-center gap-2">
                  {isEditingThis ? (
                    <input
                      ref={editSectionRef}
                      value={editingSectionName}
                      onChange={(e) => setEditingSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSection(section.id)
                        if (e.key === 'Escape') setEditingSectionId(null)
                      }}
                      className="flex-1 rounded-lg bg-slate-800 border border-primary-500/50 px-2.5 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  ) : (
                    <h3 className="flex-1 font-semibold text-slate-200 text-sm truncate">{section.name}</h3>
                  )}

                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${colColor.count}`}>
                    {colCards.length}
                  </span>

                  {canEdit && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {isEditingThis ? (
                        <>
                          <button onClick={() => handleRenameSection(section.id)}
                            className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingSectionId(null)}
                            className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 transition">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingSectionId(section.id); setEditingSectionName(section.name) }}
                            className="p-1 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {sections.length > 1 && (
                            <button
                              onClick={() => setDeletingSectionId(section.id)}
                              className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto">
                  {colCards.map((card) => {
                    const assignee   = teamMembers.find((m) => m.id === card.assigneeId)
                    const cardLabels = projectLabels.filter((l) => card.labelIds.includes(l.id))

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        onClick={() => setSelectedCard(card)}
                        className={`group relative bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 border-l-2 ${PRIORITY_LEFT[card.priority]} rounded-xl p-3.5 cursor-pointer select-none transition-all duration-150 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5`}
                      >
                        {/* Card top row */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[card.priority]}`} />
                            <span className="text-[10px] font-mono text-slate-600">#{card.id.split('-').pop()}</span>
                          </div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 opacity-0 group-hover:opacity-100 transition">
                            {card.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-semibold text-slate-200 leading-snug mb-1.5 group-hover:text-white transition">
                          {card.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{card.description}</p>

                        {/* Labels */}
                        {cardLabels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {cardLabels.map((lbl) => (
                              <span
                                key={lbl.id}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: lbl.color + 'dd' }}
                              >
                                {lbl.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-slate-700/50 pt-2.5">
                          <div className="flex items-center gap-2">
                            {/* Story points */}
                            <div className="w-6 h-6 rounded-lg bg-primary-500/15 border border-primary-500/20 flex items-center justify-center text-[10px] font-bold text-primary-400">
                              {card.points}
                            </div>
                            {/* Comments */}
                            {card.comments.length > 0 && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {card.comments.length}
                              </span>
                            )}
                          </div>

                          {/* Assignee avatar */}
                          {assignee ? (
                            <div
                              className="w-6 h-6 rounded-full bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-[9px] font-bold text-primary-300"
                              title={assignee.fullName}
                            >
                              {initials(assignee.fullName)}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-dashed border-slate-700" />
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Empty drop zone */}
                  {colCards.length === 0 && (
                    <div className={`h-24 flex items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                      isDragOver ? 'border-primary-500/40 bg-primary-500/5 text-primary-400' : 'border-slate-800 text-slate-700'
                    } text-xs text-center px-3`}>
                      {isDragOver ? 'Drop here' : 'No cards'}
                    </div>
                  )}

                  {/* Add card */}
                  {canEdit && (
                    <button
                      onClick={() => startCreate(section.id)}
                      disabled={!selectedProjectId}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 py-2 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add card
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add new section */}
          {canEdit && (
            <div className="flex-shrink-0 w-64">
              {showAddSection ? (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3.5 shadow-xl space-y-2.5">
                  <input
                    ref={addSectionRef}
                    value={addingSectionName}
                    onChange={(e) => setAddingSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSection()
                      if (e.key === 'Escape') setShowAddSection(false)
                    }}
                    placeholder="Section name…"
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSection}
                      className="flex-1 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition shadow-lg shadow-primary-900/30"
                    >
                      Add section
                    </button>
                    <button
                      onClick={() => { setShowAddSection(false); setAddingSectionName('') }}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSection(true)}
                  className="w-full h-14 flex items-center justify-center gap-2 text-sm text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl hover:border-primary-500/40 hover:text-primary-400 hover:bg-primary-500/5 transition"
                >
                  <Plus className="w-4 h-4" /> Add section
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Card modal */}
      {selectedCard && (
        <KanbanCardModal
          card={selectedCard}
          sections={sections}
          teamMembers={teamMembers}
          projectLabels={projectLabels}
          canEdit={canEdit}
          currentUserName={currentUserName}
          onClose={() => setSelectedCard(null)}
          onUpdate={(patch) => {
            handleCardUpdate(selectedCard.id, patch)
            setSelectedCard((prev) => prev ? { ...prev, ...patch } : prev)
          }}
          onCreateLabel={(label) => persistLabels([...projectLabels, label])}
          onDeleteLabel={(labelId) => {
            const next = projectLabels.filter((l) => l.id !== labelId)
            persistLabels(next)
            cards.forEach((c) => {
              if (c.labelIds.includes(labelId))
                handleCardUpdate(c.id, { labelIds: c.labelIds.filter((x) => x !== labelId) })
            })
          }}
        />
      )}
    </div>
  )
}
