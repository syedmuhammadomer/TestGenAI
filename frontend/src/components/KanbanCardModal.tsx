import React, { useRef, useState } from 'react'
import {
  X, Tag, UserCircle, Flag, MessageSquare, Paperclip, Image as ImageIcon,
  Plus, Trash2, Check, ChevronDown, Clock, Hash, Zap,
} from 'lucide-react'
import { TeamMemberRecord } from '@/services/teamService'

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface CardAttachment {
  id: string
  type: 'image' | 'file'
  name: string
  dataUrl?: string
}

export interface CardComment {
  id: string
  authorName: string
  text: string
  createdAt: string
  attachments: CardAttachment[]
}

export interface KanbanLabel {
  id: string
  name: string
  color: string
}

export interface KanbanCardData {
  id: string
  projectId: string
  title: string
  description: string
  points: number
  sectionId: string
  priority: 'High' | 'Medium' | 'Low'
  assigneeId?: number
  labelIds: string[]
  comments: CardComment[]
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const PRIORITY_CONFIG = {
  High:   { badge: 'bg-red-500/15 text-red-400 border-red-500/30',    dot: 'bg-red-500',    glow: 'shadow-red-500/20',    bar: 'bg-red-500'    },
  Medium: { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-400', glow: 'shadow-amber-500/20', bar: 'bg-amber-400' },
  Low:    { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',  dot: 'bg-blue-400',   glow: 'shadow-blue-500/20',   bar: 'bg-blue-400'   },
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
]

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface KanbanCardModalProps {
  card: KanbanCardData
  sections: { id: string; name: string }[]
  teamMembers: TeamMemberRecord[]
  projectLabels: KanbanLabel[]
  canEdit: boolean
  currentUserName: string
  onClose: () => void
  onUpdate: (patch: Partial<KanbanCardData>) => void
  onCreateLabel: (label: KanbanLabel) => void
  onDeleteLabel: (labelId: string) => void
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function KanbanCardModal({
  card,
  sections,
  teamMembers,
  projectLabels,
  canEdit,
  currentUserName,
  onClose,
  onUpdate,
  onCreateLabel,
  onDeleteLabel,
}: KanbanCardModalProps) {
  const [priority, setPriority]     = useState(card.priority)
  const [sectionId, setSectionId]   = useState(card.sectionId)
  const [assigneeId, setAssigneeId] = useState<number | undefined>(card.assigneeId)
  const [labelIds, setLabelIds]     = useState<string[]>(card.labelIds || [])
  const [comments, setComments]     = useState<CardComment[]>(card.comments || [])

  const [commentText, setCommentText]             = useState('')
  const [commentAttachments, setCommentAttachments] = useState<CardAttachment[]>([])
  const [submittingComment, setSubmittingComment] = useState(false)

  const [showLabels, setShowLabels]     = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0])

  const fileRef  = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  function save(patch: Partial<KanbanCardData>) { onUpdate(patch) }

  function changePriority(p: typeof priority) {
    setPriority(p)
    save({ priority: p, sectionId, assigneeId, labelIds, comments })
  }

  function changeSection(sid: string) {
    setSectionId(sid)
    save({ priority, sectionId: sid, assigneeId, labelIds, comments })
  }

  function changeAssignee(id: number | undefined) {
    setAssigneeId(id)
    save({ priority, sectionId, assigneeId: id, labelIds, comments })
  }

  function toggleLabel(lid: string) {
    const next = labelIds.includes(lid) ? labelIds.filter(x => x !== lid) : [...labelIds, lid]
    setLabelIds(next)
    save({ priority, sectionId, assigneeId, labelIds: next, comments })
  }

  function handleCreateLabel() {
    if (!newLabelName.trim()) return
    const label: KanbanLabel = { id: `lbl_${Date.now()}`, name: newLabelName.trim(), color: newLabelColor }
    onCreateLabel(label)
    const next = [...labelIds, label.id]
    setLabelIds(next)
    save({ priority, sectionId, assigneeId, labelIds: next, comments })
    setNewLabelName('')
  }

  function readFiles(files: FileList | null, isImage: boolean) {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (isImage) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          setCommentAttachments((prev) => [...prev, {
            id: `att_${Date.now()}_${Math.random()}`, type: 'image', name: file.name,
            dataUrl: ev.target?.result as string,
          }])
        }
        reader.readAsDataURL(file)
      } else {
        setCommentAttachments((prev) => [...prev, {
          id: `att_${Date.now()}_${Math.random()}`, type: 'file', name: file.name,
        }])
      }
    })
  }

  function removeAttachment(id: string) {
    setCommentAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  function submitComment() {
    if (!commentText.trim() && commentAttachments.length === 0) return
    setSubmittingComment(true)
    const newComment: CardComment = {
      id: `cmt_${Date.now()}`, authorName: currentUserName,
      text: commentText.trim(), createdAt: new Date().toISOString(),
      attachments: commentAttachments,
    }
    const next = [...comments, newComment]
    setComments(next)
    setCommentText('')
    setCommentAttachments([])
    save({ priority, sectionId, assigneeId, labelIds, comments: next })
    setSubmittingComment(false)
  }

  function deleteComment(id: string) {
    const next = comments.filter((c) => c.id !== id)
    setComments(next)
    save({ priority, sectionId, assigneeId, labelIds, comments: next })
  }

  const assignee     = teamMembers.find((m) => m.id === assigneeId)
  const sectionName  = sections.find((s) => s.id === sectionId)?.name ?? 'Unknown'
  const priorityCfg  = PRIORITY_CONFIG[priority]
  const activeLabels = labelIds.map(lid => projectLabels.find(l => l.id === lid)).filter(Boolean) as KanbanLabel[]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Top accent bar */}
        <div className={`h-1 w-full shrink-0 ${priorityCfg.bar} opacity-80`} />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                <Hash className="w-3 h-3" />{card.id.split('-').pop()}
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                {sectionName}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${priorityCfg.badge}`}>
                {priority}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{card.title}</h2>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{card.description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT sidebar */}
          <div className="w-64 shrink-0 border-r border-slate-800 p-5 space-y-6 overflow-y-auto bg-slate-900/60">

            {/* Status */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Status</p>
              {canEdit ? (
                <div className="relative">
                  <select
                    value={sectionId}
                    onChange={(e) => changeSection(e.target.value)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 appearance-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                  >
                    {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              ) : (
                <span className="inline-block text-sm font-medium text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                  {sectionName}
                </span>
              )}
            </div>

            {/* Priority */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                <Flag className="w-3 h-3" /> Priority
              </p>
              {canEdit ? (
                <div className="flex flex-col gap-1.5">
                  {(['High', 'Medium', 'Low'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => changePriority(p)}
                      className={`flex items-center gap-2.5 text-sm font-medium px-3 py-2 rounded-xl border transition-all ${
                        priority === p
                          ? `${PRIORITY_CONFIG[p].badge} shadow-lg ${PRIORITY_CONFIG[p].glow}`
                          : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                      {p}
                      {priority === p && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border ${priorityCfg.badge}`}>
                  <span className={`w-2 h-2 rounded-full ${priorityCfg.dot}`} />
                  {priority}
                </span>
              )}
            </div>

            {/* Assignee */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                <UserCircle className="w-3 h-3" /> Assignee
              </p>
              {canEdit ? (
                <div className="relative">
                  <select
                    value={assigneeId ?? ''}
                    onChange={(e) => changeAssignee(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 appearance-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              ) : assignee ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/40 flex items-center justify-center text-xs font-bold text-primary-300">
                    {initials(assignee.fullName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{assignee.fullName}</p>
                    <p className="text-[10px] text-slate-500">{assignee.role}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                    <UserCircle className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Unassigned</span>
                </div>
              )}
            </div>

            {/* Labels */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Labels
                </p>
                {canEdit && (
                  <button onClick={() => setShowLabels(!showLabels)} className="text-slate-500 hover:text-primary-400 transition">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLabels ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {activeLabels.map((lbl) => (
                  <span
                    key={lbl.id}
                    className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: lbl.color + 'cc', border: `1px solid ${lbl.color}` }}
                  >
                    {lbl.name}
                  </span>
                ))}
                {activeLabels.length === 0 && !showLabels && (
                  <span className="text-sm text-slate-600">None</span>
                )}
              </div>

              {canEdit && showLabels && (
                <div className="border border-slate-700 rounded-xl bg-slate-800/60 p-3 space-y-3">
                  {projectLabels.length > 0 && (
                    <div className="space-y-1">
                      {projectLabels.map((lbl) => (
                        <div key={lbl.id} className="flex items-center justify-between group">
                          <button onClick={() => toggleLabel(lbl.id)} className="flex items-center gap-2 flex-1 text-left py-1">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: lbl.color }} />
                            <span className="text-xs text-slate-300">{lbl.name}</span>
                            {labelIds.includes(lbl.id) && <Check className="w-3 h-3 text-primary-400 ml-auto" />}
                          </button>
                          <button
                            onClick={() => { onDeleteLabel(lbl.id); setLabelIds((p) => p.filter(x => x !== lbl.id)) }}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 ml-1 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2 pt-1 border-t border-slate-700">
                    <input
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                      placeholder="New label name…"
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewLabelColor(c)}
                          className={`w-5 h-5 rounded-full border-2 transition-transform ${newLabelColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleCreateLabel}
                      disabled={!newLabelName.trim()}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary-400 border border-primary-500/30 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg py-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" /> Add label
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Story Points */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Story Points
              </p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center font-bold text-primary-400 text-base">
                  {card.points}
                </div>
                <span className="text-xs text-slate-500">pts estimated</span>
              </div>
            </div>

            {/* Created info */}
            <div className="pt-2 border-t border-slate-800">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Created
              </p>
              <p className="text-xs text-slate-600">Story #{card.id.split('-').pop()}</p>
            </div>
          </div>

          {/* RIGHT: comments */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">

            {/* Comments header */}
            <div className="px-6 py-4 border-b border-slate-800 shrink-0">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-400" />
                Activity
                <span className="ml-1 bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">{comments.length}</span>
              </h3>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500">No comments yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Be the first to add a comment.</p>
                </div>
              )}
              {comments.map((cmt) => (
                <div key={cmt.id} className="group flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600/25 border border-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-300 shrink-0">
                    {initials(cmt.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">{cmt.authorName}</span>
                        <span className="text-xs text-slate-600">{formatTime(cmt.createdAt)}</span>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => deleteComment(cmt.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {cmt.text && (
                      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{cmt.text}</p>
                      </div>
                    )}
                    {cmt.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cmt.attachments.map((att) => (
                          att.type === 'image' && att.dataUrl ? (
                            <a key={att.id} href={att.dataUrl} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={att.dataUrl} alt={att.name} className="w-24 h-24 object-cover rounded-xl border border-slate-700 hover:opacity-80 transition" />
                            </a>
                          ) : (
                            <div key={att.id} className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                              <Paperclip className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{att.name}</span>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div className="shrink-0 border-t border-slate-800 px-6 py-4 space-y-3 bg-slate-900/80">
              {commentAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {commentAttachments.map((att) => (
                    <div key={att.id} className="relative group">
                      {att.type === 'image' && att.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={att.dataUrl} alt={att.name} className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 rounded-lg px-2 py-1.5 border border-slate-700">
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="max-w-[80px] truncate">{att.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-600/25 border border-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-300 shrink-0 mt-1">
                  {initials(currentUserName)}
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitComment() }}
                    placeholder="Write a comment… (Ctrl+Enter to post)"
                    rows={3}
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 resize-none transition"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input ref={imageRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => readFiles(e.target.files, true)}
                        onClick={(e) => { (e.target as HTMLInputElement).value = '' }} />
                      <button onClick={() => imageRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-400 border border-slate-700 hover:border-primary-500/40 rounded-lg px-3 py-1.5 transition bg-slate-800">
                        <ImageIcon className="w-3.5 h-3.5" /> Image
                      </button>
                      <input ref={fileRef} type="file" multiple className="hidden"
                        onChange={(e) => readFiles(e.target.files, false)}
                        onClick={(e) => { (e.target as HTMLInputElement).value = '' }} />
                      <button onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-400 border border-slate-700 hover:border-primary-500/40 rounded-lg px-3 py-1.5 transition bg-slate-800">
                        <Paperclip className="w-3.5 h-3.5" /> File
                      </button>
                    </div>
                    <button
                      onClick={submitComment}
                      disabled={submittingComment || (!commentText.trim() && commentAttachments.length === 0)}
                      className="px-5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-900/30"
                    >
                      {submittingComment ? 'Posting…' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
