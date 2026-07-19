'use client'

import React, { useEffect, useRef, useState } from 'react'
import Layout from '@/components/Layout'
import {
  MessageSquare, Plus, Search, X, Send, Users, Hash,
  ChevronDown, Check, FolderOpen, User, MoreVertical,
  Paperclip, Smile, Phone, Video, Info, ArrowLeft,
} from 'lucide-react'
import { useProjectContext } from '@/context/ProjectContext'

// ── Types ─────────────────────────────────────────────────────────────────────
type ChatType = 'group' | 'project' | 'direct'

interface ChatMember {
  id: string
  name: string
  role: string
  online: boolean
}

interface Message {
  id: string
  senderId: string
  senderName: string
  text: string
  time: string
  date: string
  isOwn: boolean
}

interface Conversation {
  id: string
  type: ChatType
  name: string
  projectName?: string
  members: ChatMember[]
  messages: Message[]
  unread: number
  lastMessage: string
  lastTime: string
  online?: boolean
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_MEMBERS: ChatMember[] = [
  { id: 'm1', name: 'Sarah Johnson',   role: 'QA Engineer',      online: true  },
  { id: 'm2', name: 'Mike Chen',       role: 'Developer',        online: true  },
  { id: 'm3', name: 'Emma Davis',      role: 'Project Manager',  online: false },
  { id: 'm4', name: 'Alex Rodriguez',  role: 'Business Analyst', online: true  },
  { id: 'm5', name: 'Priya Sharma',    role: 'Designer',         online: false },
  { id: 'm6', name: 'James Wilson',    role: 'Developer',        online: true  },
]

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1', type: 'group', name: 'QA Team',
    members: [MOCK_MEMBERS[0], MOCK_MEMBERS[1], MOCK_MEMBERS[3]],
    unread: 3, lastMessage: 'Can everyone review the test cases by EOD?', lastTime: '2m ago',
    messages: [
      { id: 'msg1', senderId: 'm1', senderName: 'Sarah Johnson', text: 'Hey team, just pushed the latest test cases for the login flow.', time: '10:02 AM', date: 'Today', isOwn: false },
      { id: 'msg2', senderId: 'me', senderName: 'You', text: 'Looks good Sarah! I will start reviewing them now.', time: '10:05 AM', date: 'Today', isOwn: true },
      { id: 'msg3', senderId: 'm2', senderName: 'Mike Chen', text: 'I have a question about TC-004 — should we cover the edge case for expired tokens?', time: '10:08 AM', date: 'Today', isOwn: false },
      { id: 'msg4', senderId: 'm1', senderName: 'Sarah Johnson', text: 'Yes, definitely. I will add that as a separate scenario.', time: '10:10 AM', date: 'Today', isOwn: false },
      { id: 'msg5', senderId: 'm4', senderName: 'Alex Rodriguez', text: 'Can everyone review the test cases by EOD?', time: '10:14 AM', date: 'Today', isOwn: false },
    ],
  },
  {
    id: 'c2', type: 'project', name: 'E-commerce Platform', projectName: 'E-commerce Platform',
    members: [MOCK_MEMBERS[0], MOCK_MEMBERS[1], MOCK_MEMBERS[2], MOCK_MEMBERS[3]],
    unread: 0, lastMessage: 'Sprint planning is tomorrow at 10 AM.', lastTime: '1h ago',
    messages: [
      { id: 'msg1', senderId: 'm3', senderName: 'Emma Davis', text: 'Welcome to the E-commerce Platform project chat! Use this to coordinate on all project-related updates.', time: '9:00 AM', date: 'Yesterday', isOwn: false },
      { id: 'msg2', senderId: 'me', senderName: 'You', text: 'Thanks Emma! Great to have a dedicated space for this.', time: '9:05 AM', date: 'Yesterday', isOwn: true },
      { id: 'msg3', senderId: 'm1', senderName: 'Sarah Johnson', text: 'I have completed the smoke test suite for the checkout flow.', time: '3:30 PM', date: 'Yesterday', isOwn: false },
      { id: 'msg4', senderId: 'm3', senderName: 'Emma Davis', text: 'Sprint planning is tomorrow at 10 AM.', time: '4:00 PM', date: 'Yesterday', isOwn: false },
    ],
  },
  {
    id: 'c3', type: 'direct', name: 'Sarah Johnson', online: true,
    members: [MOCK_MEMBERS[0]],
    unread: 1, lastMessage: 'Did you check the RTM updates?', lastTime: '30m ago',
    messages: [
      { id: 'msg1', senderId: 'm1', senderName: 'Sarah Johnson', text: 'Hey! Do you have a minute to go over the test plan?', time: '11:00 AM', date: 'Today', isOwn: false },
      { id: 'msg2', senderId: 'me', senderName: 'You', text: 'Sure, give me 5 minutes.', time: '11:02 AM', date: 'Today', isOwn: true },
      { id: 'msg3', senderId: 'm1', senderName: 'Sarah Johnson', text: 'Did you check the RTM updates?', time: '11:30 AM', date: 'Today', isOwn: false },
    ],
  },
  {
    id: 'c4', type: 'direct', name: 'Mike Chen', online: true,
    members: [MOCK_MEMBERS[1]],
    unread: 0, lastMessage: 'The build is ready for testing.', lastTime: '2h ago',
    messages: [
      { id: 'msg1', senderId: 'me', senderName: 'You', text: 'Mike, is the API endpoint for user auth ready?', time: '9:00 AM', date: 'Today', isOwn: true },
      { id: 'msg2', senderId: 'm2', senderName: 'Mike Chen', text: 'Yes, just deployed it. Endpoint is /api/auth/login', time: '9:15 AM', date: 'Today', isOwn: false },
      { id: 'msg3', senderId: 'm2', senderName: 'Mike Chen', text: 'The build is ready for testing.', time: '9:45 AM', date: 'Today', isOwn: false },
    ],
  },
  {
    id: 'c5', type: 'group', name: 'Design & Dev Sync',
    members: [MOCK_MEMBERS[1], MOCK_MEMBERS[4], MOCK_MEMBERS[5]],
    unread: 0, lastMessage: 'Updated the Figma components.', lastTime: 'Yesterday',
    messages: [
      { id: 'msg1', senderId: 'm5', senderName: 'Priya Sharma', text: 'Updated the Figma components for the dashboard redesign.', time: '2:00 PM', date: 'Yesterday', isOwn: false },
      { id: 'msg2', senderId: 'm2', senderName: 'Mike Chen', text: 'Looks clean! I will start implementing.', time: '2:30 PM', date: 'Yesterday', isOwn: false },
      { id: 'msg3', senderId: 'me', senderName: 'You', text: 'Great work Priya!', time: '3:00 PM', date: 'Yesterday', isOwn: true },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

const avatarColor = (name: string) => {
  const colors = [
    'bg-blue-600', 'bg-emerald-600', 'bg-purple-600',
    'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-indigo-600',
  ]
  const i = name.charCodeAt(0) % colors.length
  return colors[i]
}

function Avatar({ name, size = 'md', online }: { name: string; size?: 'sm' | 'md' | 'lg'; online?: boolean }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  return (
    <div className="relative shrink-0">
      <div className={`${sz} ${avatarColor(name)} rounded-full flex items-center justify-center font-semibold text-white`}>
        {initials(name)}
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${online ? 'bg-emerald-500' : 'bg-slate-500'}`} />
      )}
    </div>
  )
}

// ── New Group Chat Modal ───────────────────────────────────────────────────────
interface NewGroupModalProps {
  onClose: () => void
  onCreated: (conv: Conversation) => void
}

function NewGroupModal({ onClose, onCreated }: NewGroupModalProps) {
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const filtered = MOCK_MEMBERS.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

  const handleCreate = () => {
    if (!groupName.trim()) { setError('Group name is required'); return }
    if (selected.length < 2) { setError('Select at least 2 members'); return }
    const members = MOCK_MEMBERS.filter((m) => selected.includes(m.id))
    const conv: Conversation = {
      id: `grp-${Date.now()}`, type: 'group',
      name: groupName.trim(), members,
      unread: 0, lastMessage: 'Group created', lastTime: 'now',
      messages: [{ id: 'sys', senderId: 'system', senderName: 'System', text: `Group "${groupName.trim()}" was created.`, time: 'now', date: 'Today', isOwn: false }],
    }
    onCreated(conv)
  }

  return (
    <ModalShell title="New Group Chat" icon={<Users className="w-4 h-4 text-primary-400" />} onClose={onClose}>
      {error && <p className="text-xs text-rose-400 bg-rose-900/20 border border-rose-700/40 rounded-lg px-3 py-2">{error}</p>}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Group Name</label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Backend Team"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Add Members <span className="ml-2 text-slate-600 normal-case font-normal">{selected.length} selected</span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
          {filtered.map((m) => {
            const checked = selected.includes(m.id)
            return (
              <button key={m.id} type="button" onClick={() => toggle(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${checked ? 'bg-primary-600/15 border-primary-600/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                <Avatar name={m.name} size="sm" online={m.online} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.name}</p>
                  <p className="text-xs text-slate-400 truncate">{m.role}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-primary-600 border-primary-600' : 'border-slate-600'}`}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors hover:border-slate-600">Cancel</button>
        <button onClick={handleCreate} className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors">Create Group</button>
      </div>
    </ModalShell>
  )
}

// ── New Project Chat Modal ────────────────────────────────────────────────────
interface NewProjectChatModalProps {
  onClose: () => void
  onCreated: (conv: Conversation) => void
}

function NewProjectChatModal({ onClose, onCreated }: NewProjectChatModalProps) {
  const { projects } = useProjectContext()
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [error, setError] = useState('')

  const toggleMember = (id: string) =>
    setSelectedMembers((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

  const handleCreate = () => {
    if (!selectedProject) { setError('Please select a project'); return }
    if (selectedMembers.length === 0) { setError('Select at least 1 member'); return }
    const members = MOCK_MEMBERS.filter((m) => selectedMembers.includes(m.id))
    const conv: Conversation = {
      id: `proj-${Date.now()}`, type: 'project',
      name: selectedProject, projectName: selectedProject, members,
      unread: 0, lastMessage: 'Project chat created', lastTime: 'now',
      messages: [{ id: 'sys', senderId: 'system', senderName: 'System', text: `Project chat for "${selectedProject}" was created.`, time: 'now', date: 'Today', isOwn: false }],
    }
    onCreated(conv)
  }

  return (
    <ModalShell title="New Project Chat" icon={<FolderOpen className="w-4 h-4 text-primary-400" />} onClose={onClose}>
      {error && <p className="text-xs text-rose-400 bg-rose-900/20 border border-rose-700/40 rounded-lg px-3 py-2">{error}</p>}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</label>
        <div className="relative">
          <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500">
            <option value="">— Select a project —</option>
            {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            {projects.length === 0 && <option value="E-commerce Platform">E-commerce Platform (demo)</option>}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Add Members <span className="ml-2 text-slate-600 normal-case font-normal">{selectedMembers.length} selected</span>
        </label>
        <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
          {MOCK_MEMBERS.map((m) => {
            const checked = selectedMembers.includes(m.id)
            return (
              <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${checked ? 'bg-primary-600/15 border-primary-600/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                <Avatar name={m.name} size="sm" online={m.online} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.name}</p>
                  <p className="text-xs text-slate-400 truncate">{m.role}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-primary-600 border-primary-600' : 'border-slate-600'}`}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors hover:border-slate-600">Cancel</button>
        <button onClick={handleCreate} className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors">Create Chat</button>
      </div>
    </ModalShell>
  )
}

// ── New DM Modal ───────────────────────────────────────────────────────────────
interface NewDMModalProps {
  onClose: () => void
  onCreated: (conv: Conversation) => void
  existingDMs: string[]
}

function NewDMModal({ onClose, onCreated, existingDMs }: NewDMModalProps) {
  const [search, setSearch] = useState('')
  const available = MOCK_MEMBERS.filter(
    (m) => !existingDMs.includes(m.name) && m.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (member: ChatMember) => {
    const conv: Conversation = {
      id: `dm-${Date.now()}`, type: 'direct',
      name: member.name, online: member.online,
      members: [member],
      unread: 0, lastMessage: 'No messages yet', lastTime: 'now',
      messages: [],
    }
    onCreated(conv)
  }

  return (
    <ModalShell title="New Direct Message" icon={<User className="w-4 h-4 text-primary-400" />} onClose={onClose}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search team members..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
        />
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
        {available.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No members found</p>
        ) : available.map((m) => (
          <button key={m.id} type="button" onClick={() => handleSelect(m)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-primary-600/40 hover:bg-primary-900/10 transition-colors text-left">
            <Avatar name={m.name} size="md" online={m.online} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{m.name}</p>
              <p className="text-xs text-slate-400">{m.role}</p>
            </div>
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${m.online ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              {m.online ? 'Online' : 'Offline'}
            </span>
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

// ── Modal Shell ───────────────────────────────────────────────────────────────
function ModalShell({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600/15 flex items-center justify-center">{icon}</div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── Conversation Item ─────────────────────────────────────────────────────────
function ConvItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  const isGroup = conv.type !== 'direct'
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${active ? 'bg-primary-600/15 border border-primary-600/30' : 'border border-transparent hover:bg-slate-800/60'}`}>
      <div className="relative shrink-0">
        {isGroup ? (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white ${conv.type === 'project' ? 'bg-indigo-700' : 'bg-emerald-700'}`}>
            {conv.type === 'project' ? <FolderOpen className="w-4 h-4" /> : <Users className="w-4 h-4" />}
          </div>
        ) : (
          <Avatar name={conv.name} size="md" online={conv.online} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm font-semibold truncate ${active ? 'text-primary-200' : 'text-white'}`}>{conv.name}</p>
          <span className="text-[10px] text-slate-500 shrink-0">{conv.lastTime}</span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs text-slate-400 truncate">{conv.lastMessage}</p>
          {conv.unread > 0 && (
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Chat Window ───────────────────────────────────────────────────────────────
function ChatWindow({ conv, onSend, onBack }: { conv: Conversation; onSend: (text: string) => void; onBack: () => void }) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv.messages])

  const handleSend = () => {
    const t = text.trim()
    if (!t) return
    onSend(t)
    setText('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const onlineCount = conv.members.filter((m) => m.online).length
  const isGroup = conv.type !== 'direct'

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = []
  for (const msg of conv.messages) {
    const last = grouped[grouped.length - 1]
    if (last && last.date === msg.date) { last.messages.push(msg) }
    else { grouped.push({ date: msg.date, messages: [msg] }) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
        <button onClick={onBack} className="lg:hidden text-slate-400 hover:text-white transition-colors mr-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {isGroup ? (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${conv.type === 'project' ? 'bg-indigo-700' : 'bg-emerald-700'}`}>
            {conv.type === 'project' ? <FolderOpen className="w-4 h-4 text-white" /> : <Users className="w-4 h-4 text-white" />}
          </div>
        ) : (
          <Avatar name={conv.name} size="md" online={conv.online} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{conv.name}</p>
          {isGroup ? (
            <p className="text-xs text-slate-400">
              {conv.members.length} members &middot; <span className="text-emerald-400">{onlineCount} online</span>
            </p>
          ) : (
            <p className={`text-xs ${conv.online ? 'text-emerald-400' : 'text-slate-500'}`}>
              {conv.online ? 'Active now' : 'Offline'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Voice call">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Video call">
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Info">
            <Info className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {conv.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-primary-600/15 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Start the conversation</p>
              <p className="text-sm text-slate-400 mt-1">Send a message to {conv.name}</p>
            </div>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.date} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[11px] text-slate-500 font-medium px-2">{group.date}</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              {group.messages.map((msg, idx) => {
                const prevMsg = group.messages[idx - 1]
                const showAvatar = !msg.isOwn && (idx === 0 || prevMsg?.senderId !== msg.senderId || prevMsg?.isOwn)
                const showName = !msg.isOwn && showAvatar
                if (msg.senderId === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <p className="text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-full px-4 py-1">{msg.text}</p>
                    </div>
                  )
                }
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!msg.isOwn && (
                      <div className="w-7 shrink-0 mb-0.5">
                        {showAvatar && <Avatar name={msg.senderName} size="sm" />}
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 max-w-[68%] ${msg.isOwn ? 'items-end' : 'items-start'}`}>
                      {showName && (
                        <p className="text-xs font-semibold text-slate-400 ml-1">{msg.senderName}</p>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.isOwn
                          ? 'bg-primary-600 text-white rounded-br-sm'
                          : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-500 px-1">{msg.time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-5 py-4 border-t border-slate-800 bg-slate-950">
        <div className="flex items-end gap-3">
          <button className="p-2 text-slate-400 hover:text-white transition-colors shrink-0 mb-0.5">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              placeholder={`Message ${conv.name}…`}
              className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none leading-relaxed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button className="absolute right-3 bottom-3 text-slate-400 hover:text-white transition-colors">
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white transition-colors shrink-0 mb-0.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2 ml-11">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type ModalType = 'group' | 'project' | 'dm' | null
type FilterTab = 'all' | 'groups' | 'direct'

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)
  const [activeId, setActiveId] = useState<string | null>('c1')
  const [modal, setModal] = useState<ModalType>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(true)

  const activeConv = conversations.find((c) => c.id === activeId) ?? null

  const filtered = conversations.filter((c) => {
    const matchTab = filter === 'all' || (filter === 'groups' && c.type !== 'direct') || (filter === 'direct' && c.type === 'direct')
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const handleSelect = (id: string) => {
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, unread: 0 } : c))
    setActiveId(id)
    setShowList(false)
  }

  const handleCreated = (conv: Conversation) => {
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
    setModal(null)
    setShowList(false)
  }

  const handleSend = (text: string) => {
    if (!activeId) return
    const msg: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me', senderName: 'You',
      text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today', isOwn: true,
    }
    setConversations((prev) =>
      prev.map((c) => c.id === activeId
        ? { ...c, messages: [...c.messages, msg], lastMessage: text, lastTime: 'now' }
        : c
      )
    )
  }

  const existingDMs = conversations.filter((c) => c.type === 'direct').map((c) => c.name)
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return (
    <Layout>
      <div className="h-[calc(100vh-9rem)] flex flex-col">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Workspace</p>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Chat
              {totalUnread > 0 && (
                <span className="text-sm font-semibold bg-primary-600 text-white rounded-full px-2 py-0.5">{totalUnread}</span>
              )}
            </h1>
          </div>
          {/* Create buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal('dm')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:border-primary-600/50 hover:text-white transition-colors"
            >
              <User className="w-4 h-4 text-primary-400" /> DM
            </button>
            <button
              onClick={() => setModal('project')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:border-primary-600/50 hover:text-white transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-indigo-400" /> Project Chat
            </button>
            <button
              onClick={() => setModal('group')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> New Group
            </button>
          </div>
        </div>

        {/* Chat Layout */}
        <div className="flex-1 min-h-0 flex rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
          {/* ── Sidebar ── */}
          <div className={`w-full lg:w-80 xl:w-96 shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 ${!showList ? 'hidden lg:flex' : 'flex'}`}>
            {/* Search */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 px-1">
              {(['all', 'groups', 'direct'] as const).map((tab) => (
                <button key={tab} onClick={() => setFilter(tab)}
                  className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${filter === tab ? 'text-primary-400 border-b-2 border-primary-500' : 'text-slate-500 hover:text-slate-300'}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <MessageSquare className="w-8 h-8 text-slate-700" />
                  <p className="text-sm text-slate-500">No conversations found</p>
                </div>
              ) : filtered.map((conv) => (
                <ConvItem key={conv.id} conv={conv} active={activeId === conv.id} onClick={() => handleSelect(conv.id)} />
              ))}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {MOCK_MEMBERS.filter((m) => m.online).length} team members online
              </div>
            </div>
          </div>

          {/* ── Chat Window ── */}
          <div className={`flex-1 min-w-0 ${showList && !activeConv ? 'hidden lg:flex' : 'flex'} flex-col`}>
            {activeConv ? (
              <ChatWindow
                conv={activeConv}
                onSend={handleSend}
                onBack={() => setShowList(true)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-primary-600/10 border border-primary-600/20 flex items-center justify-center">
                  <MessageSquare className="w-9 h-9 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Your messages</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-xs">
                    Select a conversation from the sidebar or create a new one to start chatting.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => setModal('dm')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-300 bg-primary-900/20 border border-primary-700/30 rounded-lg hover:bg-primary-900/40 transition-colors">
                    <User className="w-4 h-4" /> Send a DM
                  </button>
                  <button onClick={() => setModal('group')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" /> New Group
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'group'   && <NewGroupModal      onClose={() => setModal(null)} onCreated={handleCreated} />}
      {modal === 'project' && <NewProjectChatModal onClose={() => setModal(null)} onCreated={handleCreated} />}
      {modal === 'dm'      && <NewDMModal          onClose={() => setModal(null)} onCreated={handleCreated} existingDMs={existingDMs} />}
    </Layout>
  )
}
