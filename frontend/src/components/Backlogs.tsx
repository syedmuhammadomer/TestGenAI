import * as React from 'react'
import { useMemo, useState } from 'react'
import { MoreVertical, Search, PlusCircle, X } from 'lucide-react'
import Button from './Button'
import { ProjectRecord, useProjectContext } from '@/context/ProjectContext'
import { userStoryService, UserStoryInput } from '@/services/userStoryService'

export type StoryStatus = 'Backlog' | 'In Progress' | 'QA Reviews' | 'Done'

export interface UserStory {
  id: string
  projectId: string
  title: string
  description: string
  status: StoryStatus
  priority: 'High' | 'Medium' | 'Low'
  points: number
}

type BacklogsProps = {
  selectedProject: ProjectRecord | null
}

export default function Backlogs({ selectedProject }: BacklogsProps) {
  const { selectedProjectId, refreshSelectedProject } = useProjectContext()
  const columns: StoryStatus[] = ['Backlog', 'In Progress', 'QA Reviews', 'Done']
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState<UserStoryInput>({ actor: '', goal: '', benefit: '', acceptanceCriteria: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const initialStories = useMemo<UserStory[]>(
    () =>
      (selectedProject?.userStories ?? []).map((story, index) => {
        let savedPriority: 'High' | 'Medium' | 'Low' = index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low'
        let savedStatus: StoryStatus = 'Backlog'
        try {
          const raw = localStorage.getItem(`us_meta_${selectedProject?.id}_${story.id}`)
          if (raw) {
            const meta = JSON.parse(raw)
            if (meta.priority) savedPriority = meta.priority
            if (meta.status === 'In Progress') savedStatus = 'In Progress'
            else if (meta.status === 'Done') savedStatus = 'Done'
          }
        } catch { /* noop */ }
        return {
          id: `${selectedProject?.id ?? 'project'}-${index + 1}`,
          projectId: String(selectedProject?.id ?? ''),
          title: story.goal,
          description: story.benefit || story.acceptanceCriteria || 'No additional details provided.',
          status: savedStatus,
          priority: savedPriority,
          points: Math.max(1, (story.acceptanceCriteria?.split('\n').filter(Boolean).length ?? 0) || 1),
        }
      }),
    [selectedProject],
  )
  const [stories, setStories] = useState<UserStory[]>([])

  React.useEffect(() => {
    setStories(initialStories)
  }, [initialStories])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('storyId', id)
  }

  const handleDrop = (e: React.DragEvent, status: StoryStatus) => {
    e.preventDefault()
    const storyId = e.dataTransfer.getData('storyId')
    if (storyId) {
      setStories((prev) =>
        prev.map((story) => (story.id === storyId ? { ...story, status } : story))
      )
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const projectStories = stories.filter(
    (story) =>
      story.projectId === String(selectedProject?.id ?? '') &&
      `${story.title} ${story.description}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const startCreateStory = () => {
    setForm({ actor: '', goal: '', benefit: '', acceptanceCriteria: '' })
    setFormError(null)
    setShowCreateForm(true)
  }

  const cancelCreateStory = () => {
    setShowCreateForm(false)
    setForm({ actor: '', goal: '', benefit: '', acceptanceCriteria: '' })
    setFormError(null)
  }

  const handleCreateStory = async () => {
    if (!selectedProjectId) {
      setFormError('Select a project before creating a story.')
      return
    }

    if (!form.goal?.trim()) {
      setFormError('Goal is required.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      await userStoryService.create(selectedProjectId, form)
      await refreshSelectedProject()
      setStories((prev) => [
        {
          id: `${selectedProjectId}-${Date.now()}`,
          projectId: String(selectedProjectId),
          title: form.goal.trim(),
          description: form.benefit?.trim() || form.acceptanceCriteria?.trim() || 'No additional details provided.',
          status: 'Backlog',
          priority: 'Medium',
          points: Math.max(1, (form.acceptanceCriteria?.split('\n').filter(Boolean).length ?? 0) || 1),
        },
        ...prev,
      ])
      cancelCreateStory()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create the story right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Backlogs</h1>
          <p className="text-slate-500">Manage user stories and track their progress</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {selectedProject && (
            <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
              {selectedProject.name}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>
          <Button className="whitespace-nowrap" onClick={startCreateStory} disabled={!selectedProjectId}>
            <PlusCircle className="w-4 h-4 mr-2 inline" /> New Story
          </Button>
        </div>
      </div>

      {!selectedProject && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Select a project from the dropdown next to the logo to load its user stories into the backlog board.
        </div>
      )}

      {showCreateForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create a story manually</h2>
              <p className="text-sm text-slate-500">Add a new backlog item without waiting for AI generation.</p>
            </div>
            <button onClick={cancelCreateStory} className="text-slate-400 hover:text-slate-700" aria-label="Close form">
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2 text-sm text-slate-600">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Actor</span>
              <input
                value={form.actor || ''}
                onChange={(event) => setForm((current) => ({ ...current, actor: event.target.value }))}
                placeholder="e.g. Registered member"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </label>
            <label className="block space-y-2 text-sm text-slate-600">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Goal *</span>
              <input
                value={form.goal || ''}
                onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
                placeholder="e.g. search the catalog by title"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Benefit</span>
            <input
              value={form.benefit || ''}
              onChange={(event) => setForm((current) => ({ ...current, benefit: event.target.value }))}
              placeholder="so that I can find books quickly"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Acceptance Criteria</span>
            <textarea
              value={form.acceptanceCriteria || ''}
              onChange={(event) => setForm((current) => ({ ...current, acceptanceCriteria: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={cancelCreateStory}>Cancel</Button>
            <Button onClick={handleCreateStory} isLoading={submitting}>
              {submitting ? 'Creating...' : 'Create story'}
            </Button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 min-h-[600px] pb-6">
        {columns.map((column) => {
          const columnStories = projectStories.filter((story) => story.status === column)

          return (
            <div
              key={column}
              className="flex flex-col bg-white border border-slate-200 rounded-xl"
              onDrop={(e) => handleDrop(e, column)}
              onDragOver={handleDragOver}
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-600">{column}</h3>
                <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-md">
                  {columnStories.length}
                </span>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {columnStories.map((story) => (
                  <div
                    key={story.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, story.id)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-primary-300 rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-card group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${story.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-200' :
                            story.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                              'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}>
                          {story.priority}
                        </span>
                        <span className="text-slate-500 text-xs font-medium">#{story.id}</span>
                      </div>
                      <button className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-800 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="text-sm font-medium text-slate-600 mb-1 leading-snug">{story.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{story.description}</p>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-[10px] text-primary-600 font-medium">
                          {story.points}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex sm:hidden overflow-x-auto gap-1">
                          <select
                            className="text-xs bg-white text-slate-600 border border-slate-200 rounded p-1"
                            value={story.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as StoryStatus
                              setStories(prev => prev.map(s => s.id === story.id ? { ...s, status: newStatus } : s))
                            }}
                          >
                            {columns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {columnStories.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs text-center px-4">
                    Drop stories here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
