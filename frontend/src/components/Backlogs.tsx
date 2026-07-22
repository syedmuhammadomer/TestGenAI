import * as React from 'react'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  Search, X, Plus, Pencil, Trash2, Check, LayoutGrid,
  ChevronRight, SlidersHorizontal, ArrowUpDown, Eye, MoreHorizontal,
} from 'lucide-react'
import Button from './Button'
import { ProjectRecord, useProjectContext } from '@/context/ProjectContext'
import { userStoryService } from '@/services/userStoryService'
import { toast } from 'sonner'
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

const SECTION_COLORS: Record<string, { bar: string; count: string; countText: string }> = {
  backlog:     { bar: 'bg-slate-400',    count: 'bg-slate-800 border border-slate-700',    countText: 'text-slate-300'   },
  in_progress: { bar: 'bg-primary-500',  count: 'bg-primary-900 border border-primary-700', countText: 'text-primary-300' },
  qa_reviews:  { bar: 'bg-amber-500',    count: 'bg-amber-900 border border-amber-700',    countText: 'text-amber-300'   },
  done:        { bar: 'bg-emerald-500',  count: 'bg-emerald-900 border border-emerald-700', countText: 'text-emerald-300' },
}

const CYCLE_COLORS = [
  { bar: 'bg-violet-500', count: 'bg-violet-900 border border-violet-700', countText: 'text-violet-300' },
  { bar: 'bg-pink-500',   count: 'bg-pink-900 border border-pink-700',     countText: 'text-pink-300'   },
  { bar: 'bg-cyan-500',   count: 'bg-cyan-900 border border-cyan-700',     countText: 'text-cyan-300'   },
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
    toast.success('Section renamed')
  }

  function handleDeleteSection(id: string) {
    persistSections(sections.filter((s) => s.id !== id))
    setDeletingSectionId(null)
    toast.success('Section deleted')
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

  /* inline card creation */
  const [inlineCreateSectionId, setInlineCreateSectionId] = useState<string | null>(null)
  const [inlineTitle, setInlineTitle]                     = useState('')
  const [inlineSubmitting, setInlineSubmitting]           = useState(false)
  const inlineRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inlineCreateSectionId) inlineRef.current?.focus()
  }, [inlineCreateSectionId])

  function startInlineCreate(sectionId: string) {
    setInlineTitle('')
    setInlineCreateSectionId(sectionId)
  }

  const submitInlineCreate = useCallback(async () => {
    const title = inlineTitle.trim()
    if (!title || !selectedProjectId || inlineSubmitting) return
    setInlineSubmitting(true)
    try {
      const created = await userStoryService.create(selectedProjectId, {
        actor: '', goal: title, benefit: '', acceptanceCriteria: '',
      })
      await refreshSelectedProject()
      const storyId = created?.id ?? Date.now()
      const cardId  = `${selectedProjectId}-${storyId}`
      saveCardMeta(selectedProjectId, cardId, {
        sectionId: inlineCreateSectionId ?? sections[0]?.id ?? DEFAULT_SECTIONS[0].id,
        priority: 'Medium', labelIds: [], comments: [],
      })
      setInlineTitle('')
      setInlineCreateSectionId(null)
      toast.success('Card created')
    } catch {
      toast.error('Failed to create card')
    }
    finally { setInlineSubmitting(false) }
  }, [inlineTitle, selectedProjectId, inlineSubmitting, inlineCreateSectionId, sections, refreshSelectedProject])

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
    <div className="flex flex-col h-full gap-0">

      {/* ── Plane-style Board Header ── */}
      <div className="flex flex-col gap-0 mb-4">

        {/* Row 1: Breadcrumb + title */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 min-w-0">
            <LayoutGrid className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <span className="text-slate-500 font-medium">Backlogs</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span className="text-white font-semibold truncate">
                {selectedProject ? selectedProject.name : 'No project'}
              </span>
            </div>
          </div>

          {/* New Card button */}
          {canEdit && (
            <Button
              size="sm"
              className="whitespace-nowrap shrink-0"
              onClick={() => startInlineCreate(sections[0]?.id ?? DEFAULT_SECTIONS[0].id)}
              disabled={!selectedProjectId}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Issue
            </Button>
          )}
        </div>

        {/* Row 2: Toolbar — Filters | Group by | Display | search | progress */}
        <div className="flex items-center justify-between gap-2 pt-2 pb-1 border-b border-slate-800">
          {/* Left toolbar */}
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <ArrowUpDown className="w-3.5 h-3.5" /> Group by
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <Eye className="w-3.5 h-3.5" /> Display
            </button>
          </div>

          {/* Right: search + progress */}
          <div className="flex items-center gap-2">
            {/* Inline progress pill */}
            {totalCards > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-emerald-400 font-semibold">{progress}%</span>
                <span className="text-slate-600">{doneCount}/{totalCards}</span>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                type="text"
                placeholder="Search…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-36 pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 placeholder-slate-600 text-xs focus:outline-none focus:border-primary-500 focus:w-48 transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* No project */}
      {!selectedProject && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <LayoutGrid className="w-7 h-7 text-slate-500" />
          </div>
          <p className="text-white font-semibold">No project selected</p>
          <p className="text-slate-500 text-sm mt-1">Select a project from the dropdown in the sidebar.</p>
        </div>
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
                className={`flex flex-col rounded-2xl flex-shrink-0 w-72 border transition-all duration-200 ${
                  isDragOver
                    ? 'border-primary-500 shadow-lg shadow-primary-500/10 bg-slate-900'
                    : 'border-slate-800 bg-slate-900'
                }`}
                onDrop={(e) => handleDrop(e, section.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverSectionId(section.id) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSectionId(null) }}
              >
                {/* Column top accent bar */}
                <div className={`h-1 w-full rounded-t-2xl ${colColor.bar}`} />

                {/* Plane-style column header */}
                <div className="px-3 pt-3 pb-2.5 flex items-center gap-2 border-b border-slate-800">
                  {/* Colored dot */}
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colColor.bar}`} />

                  {isEditingThis ? (
                    <input
                      ref={editSectionRef}
                      value={editingSectionName}
                      onChange={(e) => setEditingSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSection(section.id)
                        if (e.key === 'Escape') setEditingSectionId(null)
                      }}
                      className="flex-1 rounded-md bg-slate-800 border border-primary-500 px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  ) : (
                    <h3 className="flex-1 font-semibold text-white text-sm truncate">{section.name}</h3>
                  )}

                  {/* Card count */}
                  <span className="text-xs font-semibold text-slate-500 shrink-0 tabular-nums">
                    {colCards.length}
                  </span>

                  {canEdit && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {isEditingThis ? (
                        <>
                          <button onClick={() => handleRenameSection(section.id)}
                            className="p-1 rounded-md text-emerald-400 hover:bg-slate-800 transition">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingSectionId(null)}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-800 transition">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          {/* + Add card directly in header */}
                          <button
                            onClick={() => startInlineCreate(section.id)}
                            disabled={!selectedProjectId}
                            title="Add card"
                            className="p-1 rounded-md text-slate-600 hover:text-white hover:bg-slate-800 transition disabled:opacity-40"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          {/* ··· options */}
                          <div className="relative group/menu">
                            <button
                              className="p-1 rounded-md text-slate-600 hover:text-white hover:bg-slate-800 transition"
                              title="Options"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            {/* Dropdown */}
                            <div className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 py-1 hidden group-hover/menu:block">
                              <button
                                onClick={() => { setEditingSectionId(section.id); setEditingSectionName(section.name) }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                              >
                                <Pencil className="w-3 h-3" /> Rename
                              </button>
                              {sections.length > 1 && (
                                <button
                                  onClick={() => setDeletingSectionId(section.id)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-slate-800 transition"
                                >
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Cards */}
                <div className="flex-1 px-3 pt-3 pb-3 space-y-2.5 overflow-y-auto">
                  {colCards.map((card) => {
                    const assignee   = teamMembers.find((m) => m.id === card.assigneeId)
                    const cardLabels = projectLabels.filter((l) => card.labelIds.includes(l.id))

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        onClick={() => setSelectedCard(card)}
                        className={`group relative bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 border-l-4 ${PRIORITY_LEFT[card.priority]} rounded-xl p-3.5 cursor-pointer select-none transition-all duration-150 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5`}
                      >
                        {/* Card top row */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[card.priority]}`} />
                            <span className="text-[10px] font-mono text-slate-500">#{card.id.split('-').pop()}</span>
                          </div>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition ${
                            card.priority === 'High' ? 'bg-red-900 text-red-300' :
                            card.priority === 'Medium' ? 'bg-amber-900 text-amber-300' :
                            'bg-blue-900 text-blue-300'
                          }`}>
                            {card.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-semibold text-white leading-snug mb-1.5">
                          {card.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">{card.description}</p>

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
                        <div className="flex items-center justify-between border-t border-slate-700 pt-2.5 mt-1">
                          <div className="flex items-center gap-2">
                            {/* Story points */}
                            <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-primary-400">
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
                              className="w-6 h-6 rounded-full bg-primary-700 border border-primary-600 flex items-center justify-center text-[9px] font-bold text-white"
                              title={assignee.fullName}
                            >
                              {initials(assignee.fullName)}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-700" title="Unassigned" />
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Empty drop zone */}
                  {colCards.length === 0 && (
                    <div className={`h-24 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                      isDragOver
                        ? 'border-primary-500 bg-primary-900 text-primary-400'
                        : 'border-slate-800 text-slate-600'
                    } text-xs text-center px-3 gap-1.5`}>
                      {isDragOver ? (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Drop here</span>
                        </>
                      ) : (
                        <>
                          <LayoutGrid className="w-4 h-4 opacity-40" />
                          <span>No cards yet</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Add card — bottom of column */}
                  {canEdit && (
                    inlineCreateSectionId === section.id ? (
                      <div className="mt-1 rounded-xl border border-primary-500/60 bg-slate-800 overflow-hidden">
                        <input
                          ref={inlineRef}
                          value={inlineTitle}
                          onChange={(e) => setInlineTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); submitInlineCreate() }
                            if (e.key === 'Escape') { setInlineCreateSectionId(null); setInlineTitle('') }
                          }}
                          onBlur={() => {
                            if (!inlineTitle.trim()) { setInlineCreateSectionId(null); setInlineTitle('') }
                          }}
                          placeholder="Issue title…"
                          disabled={inlineSubmitting}
                          className="w-full px-3 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
                        />
                        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700 bg-slate-900/50">
                          <span className="text-[10px] text-slate-500">Enter to save · Esc to cancel</span>
                          {inlineSubmitting && (
                            <svg className="animate-spin w-3.5 h-3.5 text-primary-400" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => startInlineCreate(section.id)}
                        disabled={!selectedProjectId}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-slate-600 hover:text-primary-400 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>Add issue</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })}

          {/* ── Plane-style Add Section column ── */}
          {canEdit && (
            <div className="flex-shrink-0 w-72">
              {showAddSection ? (
                /* Expanded: looks like a real column being named */
                <div className="flex flex-col rounded-2xl border border-primary-500 bg-slate-900 overflow-hidden">
                  <div className="h-1 w-full bg-primary-500 rounded-t-2xl" />
                  <div className="px-3 pt-3 pb-2.5 flex items-center gap-2 border-b border-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0" />
                    <input
                      ref={addSectionRef}
                      value={addingSectionName}
                      onChange={(e) => setAddingSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSection()
                        if (e.key === 'Escape') { setShowAddSection(false); setAddingSectionName('') }
                      }}
                      placeholder="Section name…"
                      className="flex-1 bg-transparent border-none text-sm font-semibold text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <div className="px-3 py-3 flex gap-2">
                    <button
                      onClick={handleAddSection}
                      className="flex-1 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition"
                    >
                      Create Section
                    </button>
                    <button
                      onClick={() => { setShowAddSection(false); setAddingSectionName('') }}
                      className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Collapsed: Plane-style "Add Section" button column */
                <button
                  onClick={() => setShowAddSection(true)}
                  className="group w-full h-14 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-800 hover:border-primary-500 text-slate-600 hover:text-primary-400 hover:bg-slate-900 transition-all duration-200 text-sm font-medium"
                >
                  <Plus className="w-4 h-4 transition-transform group-hover:scale-110 duration-200" />
                  Add Section
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
