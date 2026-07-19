import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, PlusCircle, X, MoreVertical, Plus, Pencil, Trash2, Check, AlertCircle,
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

function sectionsKey(pid: string | number) {
  return `kanban_sections_${pid}`
}
function cardMetaKey(pid: string | number, cardId: string) {
  return `kanban_card_${pid}_${cardId}`
}
function labelsKey(pid: string | number) {
  return `kanban_labels_${pid}`
}

const DEFAULT_SECTIONS: KanbanSection[] = [
  { id: 'backlog',      name: 'Backlog'      },
  { id: 'in_progress',  name: 'In Progress'  },
  { id: 'qa_reviews',   name: 'QA Reviews'   },
  { id: 'done',         name: 'Done'         },
]

function loadSections(pid: string | number): KanbanSection[] {
  try {
    const raw = localStorage.getItem(sectionsKey(pid))
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  return DEFAULT_SECTIONS
}

function saveSections(pid: string | number, sections: KanbanSection[]) {
  localStorage.setItem(sectionsKey(pid), JSON.stringify(sections))
}

function loadCardMeta(pid: string | number, cardId: string): CardMeta {
  try {
    const raw = localStorage.getItem(cardMetaKey(pid, cardId))
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  return {
    sectionId: DEFAULT_SECTIONS[0].id,
    priority: 'Medium',
    labelIds: [],
    comments: [],
  }
}

function saveCardMeta(pid: string | number, cardId: string, meta: CardMeta) {
  localStorage.setItem(cardMetaKey(pid, cardId), JSON.stringify(meta))
}

function loadLabels(pid: string | number): KanbanLabel[] {
  try {
    const raw = localStorage.getItem(labelsKey(pid))
    if (raw) return JSON.parse(raw)
  } catch { /* noop */ }
  return []
}

function saveLabels(pid: string | number, labels: KanbanLabel[]) {
  localStorage.setItem(labelsKey(pid), JSON.stringify(labels))
}

/* ─── Priority colours ───────────────────────────────────────────────────── */

const PRIORITY_BADGE: Record<string, string> = {
  High:   'bg-red-50 text-red-600 border border-red-200',
  Medium: 'bg-orange-50 text-orange-600 border border-orange-200',
  Low:    'bg-blue-50 text-blue-600 border border-blue-200',
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

type BacklogsProps = {
  selectedProject: ProjectRecord | null
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Backlogs({ selectedProject }: BacklogsProps) {
  const { selectedProjectId, refreshSelectedProject } = useProjectContext()

  /* role check — only company_admin and pm can edit */
  const [canEdit, setCanEdit] = useState(false)
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

  /* section CRUD state */
  const [addingSectionName, setAddingSectionName] = useState('')
  const [showAddSection, setShowAddSection]       = useState(false)
  const [editingSectionId, setEditingSectionId]   = useState<string | null>(null)
  const [editingSectionName, setEditingSectionName] = useState('')
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)
  const addSectionRef = useRef<HTMLInputElement>(null)
  const editSectionRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showAddSection) addSectionRef.current?.focus()
  }, [showAddSection])

  useEffect(() => {
    if (editingSectionId) editSectionRef.current?.focus()
  }, [editingSectionId])

  function handleAddSection() {
    const name = addingSectionName.trim()
    if (!name) return
    const newSection: KanbanSection = { id: `sec_${Date.now()}`, name }
    persistSections([...sections, newSection])
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
    /* move orphaned cards to first remaining section */
    if (selectedProjectId != null) {
      const remaining = sections.filter((s) => s.id !== id)
      const fallbackId = remaining[0]?.id ?? DEFAULT_SECTIONS[0].id
      cards.forEach((card) => {
        const meta = loadCardMeta(selectedProjectId, card.id)
        if (meta.sectionId === id) {
          saveCardMeta(selectedProjectId, card.id, { ...meta, sectionId: fallbackId })
        }
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
    teamService.getDashboard()
      .then((r) => setTeamMembers(r.members))
      .catch(() => { /* ignore — not critical */ })
  }, [])

  /* cards derived from userStories */
  const baseCards = useMemo<KanbanCardData[]>(() => {
    if (!selectedProject?.userStories) return []
    return selectedProject.userStories.map((story, idx) => {
      const id = `${selectedProject.id}-${story.id ?? idx + 1}`
      const meta = selectedProjectId != null
        ? loadCardMeta(selectedProjectId, id)
        : ({
            sectionId: DEFAULT_SECTIONS[0].id,
            priority: 'Medium' as const,
            labelIds: [],
            comments: [],
          })
      return {
        id,
        projectId: String(selectedProject.id),
        title: story.goal,
        description: story.benefit || story.acceptanceCriteria || 'No additional details.',
        points: Math.max(1, story.acceptanceCriteria?.split('\n').filter(Boolean).length ?? 1),
        sectionId: meta.sectionId,
        priority: meta.priority,
        assigneeId: meta.assigneeId,
        labelIds: meta.labelIds,
        comments: meta.comments,
      }
    })
  }, [selectedProject, selectedProjectId])

  const [cards, setCards] = useState<KanbanCardData[]>([])
  useEffect(() => { setCards(baseCards) }, [baseCards])

  function refreshCardsFromStorage() {
    if (!selectedProjectId || !selectedProject?.userStories) return
    setCards(
      selectedProject.userStories.map((story, idx) => {
        const id = `${selectedProject.id}-${story.id ?? idx + 1}`
        const meta = loadCardMeta(selectedProjectId, id)
        return {
          id,
          projectId: String(selectedProject.id),
          title: story.goal,
          description: story.benefit || story.acceptanceCriteria || 'No additional details.',
          points: Math.max(1, story.acceptanceCriteria?.split('\n').filter(Boolean).length ?? 1),
          sectionId: meta.sectionId,
          priority: meta.priority,
          assigneeId: meta.assigneeId,
          labelIds: meta.labelIds,
          comments: meta.comments,
        }
      }),
    )
  }

  /* update a card's metadata */
  function handleCardUpdate(cardId: string, patch: Partial<KanbanCardData>) {
    if (!selectedProjectId) return
    const prev = cards.find((c) => c.id === cardId)
    if (!prev) return
    const next: KanbanCardData = { ...prev, ...patch }
    const meta: CardMeta = {
      sectionId:  next.sectionId,
      priority:   next.priority,
      assigneeId: next.assigneeId,
      labelIds:   next.labelIds,
      comments:   next.comments,
    }
    saveCardMeta(selectedProjectId, cardId, meta)
    setCards((prev) => prev.map((c) => (c.id === cardId ? next : c)))
  }

  /* selected card (modal) */
  const [selectedCard, setSelectedCard] = useState<KanbanCardData | null>(null)

  /* search */
  const [searchTerm, setSearchTerm] = useState('')

  /* create story form */
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
    setSubmitting(true)
    setFormError(null)
    try {
      const created = await userStoryService.create(selectedProjectId, form)
      await refreshSelectedProject()
      /* assign initial meta for the new card */
      const storyId = created?.id ?? Date.now()
      const cardId  = `${selectedProjectId}-${storyId}`
      const meta: CardMeta = {
        sectionId: newStorySection || sections[0]?.id || DEFAULT_SECTIONS[0].id,
        priority:  'Medium',
        labelIds:  [],
        comments:  [],
      }
      saveCardMeta(selectedProjectId, cardId, meta)
      setShowCreateForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create story.')
    } finally {
      setSubmitting(false)
    }
  }

  /* drag-and-drop */
  function handleDragStart(e: React.DragEvent, cardId: string) {
    e.dataTransfer.setData('cardId', cardId)
  }

  function handleDrop(e: React.DragEvent, targetSectionId: string) {
    e.preventDefault()
    const cardId = e.dataTransfer.getData('cardId')
    if (cardId) handleCardUpdate(cardId, { sectionId: targetSectionId })
  }

  /* filter cards for a section */
  function sectionCards(sectionId: string) {
    return cards.filter(
      (c) =>
        c.sectionId === sectionId &&
        `${c.title} ${c.description}`.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  /* ── Render ── */

  return (
    <div className="flex flex-col h-full space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Kanban Board</h1>
          <p className="text-slate-500 text-sm">
            {canEdit ? 'Manage sections, cards and track progress.' : 'View cards and track progress.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedProject && (
            <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
              {selectedProject.name}
            </span>
          )}
          <div className="relative">
            <input
              type="text"
              placeholder="Search cards…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-52 pl-9 pr-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {canEdit && (
            <Button className="whitespace-nowrap" onClick={() => startCreate()} disabled={!selectedProjectId}>
              <PlusCircle className="w-4 h-4 mr-2 inline" /> New Card
            </Button>
          )}
        </div>
      </div>

      {/* No project message */}
      {!selectedProject && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Select a project from the sidebar dropdown to load its kanban board.
        </div>
      )}

      {/* Create story form */}
      {showCreateForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create a card</h2>
              <p className="text-sm text-slate-500">Add a new card to the kanban board.</p>
            </div>
            <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="text-xs uppercase tracking-widest text-slate-400">Section</span>
              <select
                value={newStorySection}
                onChange={(e) => setNewStorySection(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-xs uppercase tracking-widest text-slate-400">Actor</span>
              <input
                value={form.actor || ''}
                onChange={(e) => setForm((f) => ({ ...f, actor: e.target.value }))}
                placeholder="e.g. Registered member"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="text-xs uppercase tracking-widest text-slate-400">Goal *</span>
            <input
              value={form.goal || ''}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              placeholder="e.g. search the catalog by title"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="text-xs uppercase tracking-widest text-slate-400">Benefit</span>
            <input
              value={form.benefit || ''}
              onChange={(e) => setForm((f) => ({ ...f, benefit: e.target.value }))}
              placeholder="so that I can find books quickly"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="text-xs uppercase tracking-widest text-slate-400">Acceptance Criteria</span>
            <textarea
              value={form.acceptanceCriteria || ''}
              onChange={(e) => setForm((f) => ({ ...f, acceptanceCriteria: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </label>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            <Button onClick={handleCreateStory} isLoading={submitting}>
              {submitting ? 'Creating…' : 'Create card'}
            </Button>
          </div>
        </section>
      )}

      {/* Delete section confirmation */}
      {deletingSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete section?</h3>
            <p className="text-sm text-slate-500 mb-5">
              Cards in this section will be moved to the first remaining section.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeletingSectionId(null)}>Cancel</Button>
              <button
                onClick={() => handleDeleteSection(deletingSectionId)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      {selectedProject && (
        <div className="flex gap-4 flex-1 min-h-[600px] pb-6 overflow-x-auto">

          {sections.map((section) => {
            const colCards = sectionCards(section.id)
            const isEditingThis = editingSectionId === section.id

            return (
              <div
                key={section.id}
                className="flex flex-col bg-white border border-slate-200 rounded-xl flex-shrink-0 w-72"
                onDrop={(e) => handleDrop(e, section.id)}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Column header */}
                <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                  {isEditingThis ? (
                    <input
                      ref={editSectionRef}
                      value={editingSectionName}
                      onChange={(e) => setEditingSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSection(section.id)
                        if (e.key === 'Escape') setEditingSectionId(null)
                      }}
                      className="flex-1 rounded border border-primary-400 px-2 py-0.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  ) : (
                    <h3 className="flex-1 font-semibold text-slate-600 text-sm truncate">{section.name}</h3>
                  )}

                  <span className="bg-slate-100 text-slate-500 text-xs font-medium px-2 py-0.5 rounded shrink-0">
                    {colCards.length}
                  </span>

                  {canEdit && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {isEditingThis ? (
                        <>
                          <button
                            onClick={() => handleRenameSection(section.id)}
                            className="p-1 rounded text-green-600 hover:bg-green-50 transition"
                            aria-label="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingSectionId(null)}
                            className="p-1 rounded text-slate-400 hover:bg-slate-100 transition"
                            aria-label="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingSectionId(section.id)
                              setEditingSectionName(section.name)
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            aria-label="Rename section"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {sections.length > 1 && (
                            <button
                              onClick={() => setDeletingSectionId(section.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                              aria-label="Delete section"
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
                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {colCards.map((card) => {
                    const assignee = teamMembers.find((m) => m.id === card.assigneeId)
                    const cardLabels = projectLabels.filter((l) => card.labelIds.includes(l.id))

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        onClick={() => setSelectedCard(card)}
                        className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary-300 rounded-lg p-3.5 cursor-pointer transition-all hover:shadow-card group select-none"
                      >
                        {/* priority + id */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${PRIORITY_BADGE[card.priority]}`}>
                              {card.priority}
                            </span>
                            <span className="text-slate-400 text-xs font-mono">#{card.id.split('-').pop()}</span>
                          </div>
                          <MoreVertical className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                        </div>

                        {/* title */}
                        <h4 className="text-sm font-medium text-slate-700 leading-snug mb-1">{card.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{card.description}</p>

                        {/* labels */}
                        {cardLabels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {cardLabels.map((lbl) => (
                              <span
                                key={lbl.id}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: lbl.color }}
                              >
                                {lbl.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* footer: points + assignee + comment count */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700">
                              {card.points}
                            </span>
                            {card.comments.length > 0 && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                💬 {card.comments.length}
                              </span>
                            )}
                          </div>
                          {assignee ? (
                            <div
                              className="w-6 h-6 rounded-full bg-primary-200 flex items-center justify-center text-[10px] font-bold text-primary-800"
                              title={assignee.fullName}
                            >
                              {assignee.fullName.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300" />
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {colCards.length === 0 && (
                    <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs text-center px-3">
                      Drop cards here
                    </div>
                  )}

                  {/* Add card to this section */}
                  {canEdit && (
                    <button
                      onClick={() => startCreate(section.id)}
                      disabled={!selectedProjectId}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 py-1.5 rounded-lg hover:bg-primary-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div className="flex-shrink-0 w-72">
              {showAddSection ? (
                <div className="bg-white border border-primary-300 rounded-xl p-3 shadow-sm space-y-2">
                  <input
                    ref={addSectionRef}
                    value={addingSectionName}
                    onChange={(e) => setAddingSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSection()
                      if (e.key === 'Escape') setShowAddSection(false)
                    }}
                    placeholder="Section name…"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSection}
                      className="flex-1 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition"
                    >
                      Add section
                    </button>
                    <button
                      onClick={() => { setShowAddSection(false); setAddingSectionName('') }}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddSection(true)}
                  className="w-full h-12 flex items-center justify-center gap-2 text-sm text-slate-500 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition"
                >
                  <Plus className="w-4 h-4" /> Add section
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Card detail modal */}
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
            /* remove from all cards */
            cards.forEach((c) => {
              if (c.labelIds.includes(labelId)) {
                handleCardUpdate(c.id, { labelIds: c.labelIds.filter((x) => x !== labelId) })
              }
            })
          }}
        />
      )}
    </div>
  )
}
