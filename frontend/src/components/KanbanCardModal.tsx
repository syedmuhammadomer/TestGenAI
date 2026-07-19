import React, { useRef, useState } from 'react'
import {
  X, Tag, UserCircle, Flag, MessageSquare, Paperclip, Image as ImageIcon,
  Plus, Trash2, Check, ChevronDown,
} from 'lucide-react'
import { TeamMemberRecord } from '@/services/teamService'

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface CardAttachment {
  id: string
  type: 'image' | 'file'
  name: string
  dataUrl?: string   // base64, images only
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
  High:   { badge: 'bg-red-50 text-red-600 border-red-200',    dot: 'bg-red-500'    },
  Medium: { badge: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-400' },
  Low:    { badge: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-400'   },
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
]

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
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
  /* card fields */
  const [priority, setPriority]     = useState(card.priority)
  const [sectionId, setSectionId]   = useState(card.sectionId)
  const [assigneeId, setAssigneeId] = useState<number | undefined>(card.assigneeId)
  const [labelIds, setLabelIds]     = useState<string[]>(card.labelIds || [])
  const [comments, setComments]     = useState<CardComment[]>(card.comments || [])

  /* comment form */
  const [commentText, setCommentText]             = useState('')
  const [commentAttachments, setCommentAttachments] = useState<CardAttachment[]>([])
  const [submittingComment, setSubmittingComment] = useState(false)

  /* label panel */
  const [showLabels, setShowLabels]   = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0])

  const fileRef  = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  /* ── helpers ── */

  function save(patch: Partial<KanbanCardData>) {
    onUpdate(patch)
  }

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
    const label: KanbanLabel = {
      id: `lbl_${Date.now()}`,
      name: newLabelName.trim(),
      color: newLabelColor,
    }
    onCreateLabel(label)
    const next = [...labelIds, label.id]
    setLabelIds(next)
    save({ priority, sectionId, assigneeId, labelIds: next, comments })
    setNewLabelName('')
  }

  /* attachments */

  function readFiles(files: FileList | null, isImage: boolean) {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (isImage) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          setCommentAttachments((prev) => [
            ...prev,
            {
              id: `att_${Date.now()}_${Math.random()}`,
              type: 'image',
              name: file.name,
              dataUrl: ev.target?.result as string,
            },
          ])
        }
        reader.readAsDataURL(file)
      } else {
        setCommentAttachments((prev) => [
          ...prev,
          { id: `att_${Date.now()}_${Math.random()}`, type: 'file', name: file.name },
        ])
      }
    })
  }

  function removeAttachment(id: string) {
    setCommentAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  /* submit comment */

  function submitComment() {
    if (!commentText.trim() && commentAttachments.length === 0) return
    setSubmittingComment(true)
    const newComment: CardComment = {
      id: `cmt_${Date.now()}`,
      authorName: currentUserName,
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
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

  const assignee = teamMembers.find((m) => m.id === assigneeId)
  const sectionName = sections.find((s) => s.id === sectionId)?.name ?? 'Unknown'
  const priorityCfg = PRIORITY_CONFIG[priority]

  /* ── render ── */

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <p className="text-xs font-mono text-slate-400 mb-1">#{card.id}</p>
            <h2 className="text-lg font-semibold text-slate-900 leading-snug">{card.title}</h2>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{card.description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable two-column layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT: metadata */}
          <div className="w-64 shrink-0 border-r border-slate-200 p-4 space-y-5 overflow-y-auto">

            {/* Status / Section */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Status</p>
              {canEdit ? (
                <select
                  value={sectionId}
                  onChange={(e) => changeSection(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <span className="inline-block text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  {sectionName}
                </span>
              )}
            </div>

            {/* Priority */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2 flex items-center gap-1">
                <Flag className="w-3 h-3" /> Priority
              </p>
              {canEdit ? (
                <div className="flex flex-col gap-1.5">
                  {(['High', 'Medium', 'Low'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => changePriority(p)}
                      className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition ${
                        priority === p
                          ? `${PRIORITY_CONFIG[p].badge} border`
                          : 'border-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                      {p}
                      {priority === p && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${priorityCfg.badge}`}>
                  {priority}
                </span>
              )}
            </div>

            {/* Assignee */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2 flex items-center gap-1">
                <UserCircle className="w-3 h-3" /> Assignee
              </p>
              {canEdit ? (
                <select
                  value={assigneeId ?? ''}
                  onChange={(e) => changeAssignee(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              ) : assignee ? (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">
                    {assignee.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-700">{assignee.fullName}</span>
                </div>
              ) : (
                <span className="text-sm text-slate-400">Unassigned</span>
              )}
            </div>

            {/* Labels */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Labels
                </p>
                {canEdit && (
                  <button
                    onClick={() => setShowLabels(!showLabels)}
                    className="text-slate-400 hover:text-primary-600 transition"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showLabels ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* Active labels */}
              <div className="flex flex-wrap gap-1 mb-2">
                {labelIds.map((lid) => {
                  const lbl = projectLabels.find((l) => l.id === lid)
                  if (!lbl) return null
                  return (
                    <span
                      key={lid}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: lbl.color }}
                    >
                      {lbl.name}
                    </span>
                  )
                })}
                {labelIds.length === 0 && !showLabels && (
                  <span className="text-sm text-slate-400">None</span>
                )}
              </div>

              {/* Label panel */}
              {canEdit && showLabels && (
                <div className="border border-slate-200 rounded-lg bg-slate-50 p-3 space-y-3">
                  {/* existing labels */}
                  {projectLabels.length > 0 && (
                    <div className="space-y-1">
                      {projectLabels.map((lbl) => (
                        <div key={lbl.id} className="flex items-center justify-between group">
                          <button
                            onClick={() => toggleLabel(lbl.id)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: lbl.color }}
                            />
                            <span className="text-xs text-slate-700">{lbl.name}</span>
                            {labelIds.includes(lbl.id) && (
                              <Check className="w-3 h-3 text-primary-600 ml-auto" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              onDeleteLabel(lbl.id)
                              setLabelIds((prev) => prev.filter((x) => x !== lbl.id))
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 ml-1 transition"
                            aria-label="Delete label"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* create new label */}
                  <div className="space-y-2">
                    <input
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateLabel()}
                      placeholder="New label name…"
                      className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-primary-500"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setNewLabelColor(c)}
                          className={`w-5 h-5 rounded-full border-2 transition ${newLabelColor === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleCreateLabel}
                      disabled={!newLabelName.trim()}
                      className="w-full flex items-center justify-center gap-1 text-xs font-medium text-primary-600 border border-primary-200 bg-primary-50 hover:bg-primary-100 rounded py-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" /> Add label
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Points */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Story Points</p>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                {card.points}
              </span>
            </div>
          </div>

          {/* RIGHT: comments */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Comments ({comments.length})
              </h3>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {comments.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No comments yet. Be the first to comment.</p>
              )}
              {comments.map((cmt) => (
                <div key={cmt.id} className="group flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">
                    {cmt.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{cmt.authorName}</span>
                        <span className="text-xs text-slate-400">{formatTime(cmt.createdAt)}</span>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => deleteComment(cmt.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {cmt.text && (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{cmt.text}</p>
                    )}
                    {cmt.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cmt.attachments.map((att) => (
                          att.type === 'image' && att.dataUrl ? (
                            <a key={att.id} href={att.dataUrl} target="_blank" rel="noreferrer">
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="w-24 h-24 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition"
                              />
                            </a>
                          ) : (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
            <div className="shrink-0 border-t border-slate-200 px-6 py-4 space-y-3">
              {commentAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {commentAttachments.map((att) => (
                    <div key={att.id} className="relative group">
                      {att.type === 'image' && att.dataUrl ? (
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg px-2 py-1.5 border border-slate-200">
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="max-w-[80px] truncate">{att.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        aria-label="Remove"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitComment()
                }}
                placeholder="Add a comment… (Ctrl+Enter to submit)"
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Image upload */}
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => readFiles(e.target.files, true)}
                    onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                  />
                  <button
                    onClick={() => imageRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-600 border border-slate-200 hover:border-primary-300 rounded-lg px-3 py-1.5 transition"
                    title="Attach image"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Image
                  </button>

                  {/* File upload */}
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => readFiles(e.target.files, false)}
                    onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-600 border border-slate-200 hover:border-primary-300 rounded-lg px-3 py-1.5 transition"
                    title="Attach file"
                  >
                    <Paperclip className="w-3.5 h-3.5" /> File
                  </button>
                </div>

                <button
                  onClick={submitComment}
                  disabled={submittingComment || (!commentText.trim() && commentAttachments.length === 0)}
                  className="px-4 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submittingComment ? 'Posting…' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
