import * as React from 'react'
import { useMemo, useState } from 'react'
import { MoreVertical, Search } from 'lucide-react'
import { ProjectRecord } from '@/context/ProjectContext'
import { BoardSkeleton } from './Skeleton'

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
  isLoading?: boolean
}

export default function Backlogs({ selectedProject, isLoading = false }: BacklogsProps) {
  const columns: StoryStatus[] = ['Backlog', 'In Progress', 'QA Reviews', 'Done']
  const [searchTerm, setSearchTerm] = useState('')

  const initialStories = useMemo<UserStory[]>(
    () =>
      (selectedProject?.userStories ?? []).map((story, index) => ({
        id: `${selectedProject?.id ?? 'project'}-${index + 1}`,
        projectId: String(selectedProject?.id ?? ''),
        title: story.goal,
        description: story.benefit || story.acceptanceCriteria || 'No additional details provided.',
        status: 'Backlog',
        priority: index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low',
        points: Math.max(1, (story.acceptanceCriteria?.split('\n').filter(Boolean).length ?? 0) || 1),
      })),
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

  if (isLoading) {
    return <BoardSkeleton />
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Backlogs</h1>
          <p className="text-slate-400">Manage user stories and track their progress</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {selectedProject && (
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100">
              {selectedProject.name}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
         
         
        </div>
      </div>

      {!selectedProject && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 app-subtext">
          Select a project from the dropdown next to the logo to load its user stories into the backlog board.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 flex-1 min-h-[600px] pb-6">
        {columns.map((column) => {
          const columnStories = projectStories.filter((story) => story.status === column)

          return (
            <div
              key={column}
              className="flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-xl"
              onDrop={(e) => handleDrop(e, column)}
              onDragOver={handleDragOver}
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold text-slate-200">{column}</h3>
                <span className="bg-slate-800 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-md">
                  {columnStories.length}
                </span>
              </div>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {columnStories.map((story) => (
                  <div
                    key={story.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, story.id)}
                    className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 hover:border-white/50 rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:shadow-white/10 group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2 items-center">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${story.priority === 'High' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                            story.priority === 'Medium' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                              'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                          {story.priority}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">#{story.id}</span>
                      </div>
                      <button className="text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-300 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="text-sm font-medium text-slate-200 mb-1 leading-snug">{story.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{story.description}</p>

                    <div className="flex items-center justify-between border-t border-slate-700/50 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-slate-200 font-medium">
                          {story.points}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex sm:hidden overflow-x-auto gap-1">
                          <select
                            className="text-xs bg-slate-900 text-slate-300 border border-slate-700 rounded p-1"
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
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-lg text-slate-500 text-xs text-center px-4">
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
