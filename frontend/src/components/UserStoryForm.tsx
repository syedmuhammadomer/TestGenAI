import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  FileUp,
  Save,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import Button from './Button'
import { UserStoryPayload } from '@/services/userStoryService'

type Priority = 'High' | 'Medium' | 'Low'

type AcceptanceCriterion = {
  id: string
  value: string
}

type Assignee = {
  id: string
  name: string
  role: string
  initials: string
  color: string
}

type DraftState = {
  title: string
  userRole: string
  description: string
  priority: Priority
  acceptanceCriteria: AcceptanceCriterion[]
  dueDate: string
  assigneeId: string
}

const ROLE_OPTIONS = ['Admin','Product Owner', 'QA', 'Developer']

const ASSIGNEES: Assignee[] = [
  { id: '1', name: 'Ava Thompson', role: 'Product Owner', initials: 'AT', color: 'from-black to-slate-800' },
  { id: '2', name: 'Marcus Lee', role: 'Developer', initials: 'ML', color: 'from-black to-slate-700' },
  { id: '3', name: 'Sophia Khan', role: 'QA Engineer', initials: 'SK', color: 'from-black to-slate-800' },
  { id: '4', name: 'Noah Patel', role: 'Security Lead', initials: 'NP', color: 'from-black to-slate-600' },
]

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low']

const DRAFT_STORAGE_KEY = 'user-story-form-draft'

type UserStoryFormProps = {
  mode?: 'page' | 'drawer'
  onCancel?: () => void
  onSubmitSuccess?: () => void
  initialValues?: Partial<DraftState>
  titleText?: string
  subtitleText?: string
  submitLabel?: string
  onSubmitStory?: (payload: UserStoryPayload) => Promise<void>
}

const createEmptyDraft = (): DraftState => ({
  title: '',
  userRole: ROLE_OPTIONS[0],
  description: '',
  priority: 'Medium',
  acceptanceCriteria: [{ id: createId(), value: '' }],
  dueDate: '',
  assigneeId: '',
})

function createId() {
  return Math.random().toString(36).slice(2, 10)
}

function FieldShell({
  label,
  hint,
  children,
  error,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <label className="block space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
      </div>
      {children}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-slate-400"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </label>
  )
}

function CompletionRing({ progress, darkMode }: { progress: number; darkMode: boolean }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative h-20 w-20">
      <svg className="-rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          className={darkMode ? 'stroke-slate-800' : 'stroke-slate-200'}
          strokeWidth="7"
          fill="none"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          className="stroke-slate-200 transition-all duration-500"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
        {progress}%
      </div>
    </div>
  )
}

export default function UserStoryForm({
  mode = 'page',
  onCancel,
  onSubmitSuccess,
  initialValues,
  titleText = 'Modern User Story Form',
  subtitleText = 'Autosave is active, interactions are keyboard-friendly, and every section updates progress in real time.',
  submitLabel = 'Create Story',
  onSubmitStory,
}: UserStoryFormProps) {
  const [draft, setDraft] = React.useState<DraftState>(createEmptyDraft)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [searchAssignee, setSearchAssignee] = React.useState('')
  const [assigneeOpen, setAssigneeOpen] = React.useState(false)
  const [attachments, setAttachments] = React.useState<File[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSavingDraft, setIsSavingDraft] = React.useState(false)
  const [toast, setToast] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!initialValues) {
      return
    }

    setDraft((current) => ({
      ...current,
      ...initialValues,
      acceptanceCriteria:
        initialValues.acceptanceCriteria?.length
          ? initialValues.acceptanceCriteria
          : current.acceptanceCriteria,
    }))
    if (initialValues.assigneeId) {
      const assignee = ASSIGNEES.find((item) => item.id === initialValues.assigneeId)
      if (assignee) {
        setSearchAssignee(assignee.name)
      }
    }
  }, [initialValues])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft) as DraftState
        setDraft({
          ...createEmptyDraft(),
          ...parsedDraft,
          acceptanceCriteria:
            parsedDraft.acceptanceCriteria?.length
              ? parsedDraft.acceptanceCriteria
              : [{ id: createId(), value: '' }],
        })
      } catch (error) {
        console.error('Unable to parse saved user story draft', error)
      }
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [draft])

  React.useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const completion = React.useMemo(() => {
    const checks = [
      draft.title.trim().length > 0,
      draft.userRole.length > 0,
      draft.description.trim().length > 0,
      draft.priority.length > 0,
      attachments.length > 0,
      draft.dueDate.length > 0,
      draft.assigneeId.length > 0,
    ]

    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [attachments.length, draft])

  const filteredAssignees = React.useMemo(() => {
    return ASSIGNEES.filter((assignee) =>
      `${assignee.name} ${assignee.role}`.toLowerCase().includes(searchAssignee.toLowerCase()),
    )
  }, [searchAssignee])

  const selectedAssignee = ASSIGNEES.find((assignee) => assignee.id === draft.assigneeId) ?? null
  const darkMode = true

  const themeClasses = {
    shell: 'bg-transparent text-white',
    panel: 'border-white/10 bg-slate-900/70 shadow-[0_24px_80px_rgba(8,15,30,0.45)]',
    card: 'border-white/10 bg-white/[0.03]',
    muted: 'text-slate-400',
    input:
      'border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500 focus:border-slate-200 focus:ring-slate-200/40',
    sticky: 'border-white/10 bg-slate-950/80',
  }

  const baseInputClasses =
    'w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-4'

  const updateDraft = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const setFieldError = (key: string, value?: string) => {
    setErrors((current) => {
      const next = { ...current }
      if (!value) {
        delete next[key]
      } else {
        next[key] = value
      }
      return next
    })
  }

  const mergeFiles = (files: File[]) => {
    setAttachments((current) => {
      const incoming = files.filter(
        (file) => !current.some((existingFile) => existingFile.name === file.name && existingFile.size === file.size),
      )
      return [...current, ...incoming]
    })
  }

  const handleFileDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    mergeFiles(Array.from(event.dataTransfer.files))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!draft.title.trim()) {
      nextErrors.title = 'A story title helps the team understand the work immediately.'
    }
    if (!draft.description.trim()) {
      nextErrors.description = 'Add a concise user story description.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    await new Promise((resolve) => window.setTimeout(resolve, 900))
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
    setIsSavingDraft(false)
    setToast('Draft saved successfully')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    const selectedAssigneeName =
      ASSIGNEES.find((assignee) => assignee.id === draft.assigneeId)?.name ?? undefined

    if (onSubmitStory) {
      await onSubmitStory({
        title: draft.title.trim(),
        userRole: draft.userRole.trim(),
        description: draft.description.trim(),
        priority: draft.priority,
        dueDate: draft.dueDate || undefined,
        assigneeId: draft.assigneeId || undefined,
        assigneeName: selectedAssigneeName,
        attachmentNames: attachments.map((file) => file.name),
        acceptanceCriteria: draft.acceptanceCriteria.map((criterion) => criterion.value.trim()).filter(Boolean).join('\n') || undefined,
      })
    } else {
      await new Promise((resolve) => window.setTimeout(resolve, 1500))
    }

    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    setToast('Story created successfully')
    setIsSubmitting(false)
    setAttachments([])
    setErrors({})
    setDraft(createEmptyDraft())
    setSearchAssignee('')
    setAssigneeOpen(false)
    onSubmitSuccess?.()
  }

  const handleCancel = () => {
    setDraft(createEmptyDraft())
    setAttachments([])
    setErrors({})
    setSearchAssignee('')
    setAssigneeOpen(false)
    window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    setToast('Draft cleared')
    onCancel?.()
  }

  const shellClasses =
    mode === 'drawer'
      ? `min-h-full border-0 p-0 shadow-none ${themeClasses.shell}`
      : `min-h-full rounded-[32px] border p-4 shadow-[0_24px_80px_rgba(8,15,30,0.45)] sm:p-6 lg:p-8 ${themeClasses.panel} ${themeClasses.shell}`

  const stickyClasses =
    mode === 'drawer'
      ? `sticky top-0 z-30 mb-8 border-b px-1 pb-5 pt-1 backdrop-blur ${themeClasses.sticky}`
      : `sticky top-20 z-30 mb-8 rounded-3xl border px-4 py-4 backdrop-blur xl:px-6 ${themeClasses.sticky}`

  return (
    <div className={shellClasses}>
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-2xl border border-slate-400/30 bg-slate-950/90 px-4 py-3 text-sm text-white shadow-2xl"
          >
            <CheckCircle2 className="h-5 w-5 text-slate-400" />
            <span>{toast}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={stickyClasses}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <CompletionRing progress={completion} darkMode={darkMode} />
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-200">Story Completion</p>
              <h1 className="mt-1 text-2xl font-semibold">{titleText}</h1>
              <p className={`mt-2 text-sm ${themeClasses.muted}`}>
                {subtitleText}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <motion.section
            layout
            className={`rounded-[28px] border p-6 ${themeClasses.card}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-200">Essentials</p>
                <h2 className="mt-2 text-xl font-semibold">Story Setup</h2>
              </div>
              <Sparkles className="h-5 w-5 text-slate-200" />
            </div>

            <div className="space-y-5">
              <FieldShell label="Story Title" hint="Required">
                <input
                  value={draft.title}
                  onChange={(event) => {
                    updateDraft('title', event.target.value)
                    setFieldError('title', event.target.value.trim() ? undefined : 'A title is required.')
                  }}
                  placeholder="Enter user story title"
                  className={`${baseInputClasses} ${themeClasses.input} ${errors.title ? 'border-slate-400 focus:ring-slate-400/20' : ''}`}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title ? <p className="text-sm text-slate-400">{errors.title}</p> : null}
              </FieldShell>

              <FieldShell label="User Role">
                <div className="relative">
                  <select
                    value={draft.userRole}
                    onChange={(event) => updateDraft('userRole', event.target.value)}
                    className={`${baseInputClasses} ${themeClasses.input} appearance-none pr-12`}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${themeClasses.muted}`} />
                </div>
              </FieldShell>

              <div className="pt-2">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-200">Narrative</p>
                  <h2 className="mt-2 text-xl font-semibold">User Story Description</h2>
                </div>

                <FieldShell label="User Story Description" error={errors.description}>
                  <textarea
                    rows={5}
                    value={draft.description}
                    onChange={(event) => {
                      updateDraft('description', event.target.value)
                      setFieldError('description', event.target.value.trim() ? undefined : 'Add a concise user story description.')
                    }}
                    placeholder="Describe the user story clearly"
                    className={`${baseInputClasses} ${themeClasses.input} min-h-[140px] resize-none ${errors.description ? 'border-slate-400 focus:ring-slate-400/20' : ''}`}
                  />
                </FieldShell>

                <div className="grid gap-6 pt-2 lg:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-200">Sizing</p>
                    <h2 className="mt-2 text-xl font-semibold">Priority and Planning</h2>

                    <div className="mt-6 space-y-6">
                      <div>
                        <p className={`mb-3 text-sm ${themeClasses.muted}`}>Priority Selector</p>
                        <div className={`relative grid grid-cols-3 gap-2 rounded-2xl border p-2 ${themeClasses.card}`}>
                          <motion.div
                            layout
                            className={`absolute inset-y-2 w-[calc(33.333%-0.35rem)] rounded-xl bg-slate-200/15 shadow-[0_0_0_1px_rgba(255,255,255,0.18)]`}
                            animate={{
                              x:
                                draft.priority === 'High'
                                  ? '0%'
                                  : draft.priority === 'Medium'
                                    ? '104%'
                                    : '208%',
                            }}
                            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                          />
                          {PRIORITIES.map((priority) => (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => updateDraft('priority', priority)}
                              className={`relative z-10 rounded-xl px-4 py-3 text-sm font-medium transition ${draft.priority === priority ? 'text-slate-300' : themeClasses.muted} focus:outline-none focus:ring-4 focus:ring-slate-200/20`}
                            >
                              {priority}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-200">Planning</p>
                    <h2 className="mt-2 text-xl font-semibold">Date and Assignee</h2>

                    <div className="mt-6 space-y-5">
                      <FieldShell label="Due Date">
                        <div className="relative">
                          <input
                            type="date"
                            value={draft.dueDate}
                            onChange={(event) => updateDraft('dueDate', event.target.value)}
                            className={`${baseInputClasses} ${themeClasses.input}`}
                          />
                          <Calendar className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${themeClasses.muted}`} />
                        </div>
                      </FieldShell>

                      <FieldShell label="Assignee">
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${themeClasses.muted}`} />
                            <input
                              value={searchAssignee}
                              onFocus={() => setAssigneeOpen(true)}
                              onChange={(event) => {
                                setSearchAssignee(event.target.value)
                                setAssigneeOpen(true)
                              }}
                              placeholder={selectedAssignee ? selectedAssignee.name : 'Search assignee'}
                              className={`${baseInputClasses} ${themeClasses.input} pl-11`}
                            />
                          </div>

                          <AnimatePresence initial={false}>
                            {assigneeOpen ? (
                              <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className={`overflow-hidden rounded-2xl border ${themeClasses.card}`}
                              >
                                {filteredAssignees.length === 0 ? (
                                  <div className={`px-4 py-3 text-sm ${themeClasses.muted}`}>No matching teammates found.</div>
                                ) : (
                                  filteredAssignees.map((assignee) => (
                                    <button
                                      key={assignee.id}
                                      type="button"
                                      onClick={() => {
                                        updateDraft('assigneeId', assignee.id)
                                        setSearchAssignee(assignee.name)
                                        setAssigneeOpen(false)
                                      }}
                                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-200/10 focus:outline-none focus:bg-slate-200/10"
                                    >
                                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${assignee.color} text-sm font-semibold text-white`}>
                                        {assignee.initials}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium">{assignee.name}</div>
                                        <div className={`text-sm ${themeClasses.muted}`}>{assignee.role}</div>
                                      </div>
                                      {draft.assigneeId === assignee.id ? <Check className="h-4 w-4 text-slate-200" /> : null}
                                    </button>
                                  ))
                                )}
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      </FieldShell>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
        
        <div className="grid gap-6">
          <section className={`rounded-[28px] border p-6 ${themeClasses.card}`}>
            <div className="mb-5 flex items-center gap-2">
              <FileUp className="h-5 w-5 text-slate-200" />
              <h2 className="text-lg font-semibold">Attachments</h2>
            </div>

            <label
              onDragEnter={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault()
                setIsDragging(false)
              }}
              onDrop={handleFileDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-6 py-10 text-center transition ${isDragging ? 'border-slate-200 bg-slate-200/10' : 'border-slate-200/30 hover:border-slate-200/60 hover:bg-slate-200/5'}`}
            >
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(event) => mergeFiles(Array.from(event.target.files ?? []))}
              />
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200/15 text-slate-300">
                <FileUp className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Drag and drop files here</p>
              <p className={`mt-2 text-xs ${themeClasses.muted}`}>or browse from your device</p>
            </label>

            <div className="mt-4 space-y-3">
              <AnimatePresence initial={false}>
                {attachments.map((file) => (
                  <motion.div
                    key={`${file.name}-${file.size}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${themeClasses.card}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200/10 text-slate-300">
                      <FileUp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className={`text-xs ${themeClasses.muted}`}>{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter(
                            (existingFile) =>
                              !(existingFile.name === file.name && existingFile.size === file.size),
                          ),
                        )
                      }
                      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-400/10 hover:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-400/20"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
          
          <motion.section
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-[28px] border p-6 ${themeClasses.card}`}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-200">Ready to save</p>
                <h2 className="mt-2 text-lg font-semibold">Actions</h2>
              </div>
              <div className="rounded-full border border-slate-200/20 bg-slate-200/10 px-3 py-1 text-sm font-semibold text-slate-300">
                {completion}%
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Button type="button" variant="outline" isLoading={isSavingDraft} onClick={handleSaveDraft} className="w-full rounded-2xl">
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="w-full rounded-2xl bg-white hover:bg-slate-200">
                {submitLabel}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} className="w-full rounded-2xl">
                Cancel
              </Button>
            </div>
          </motion.section>
        </div>
      </form>
    </div>
  )
}
