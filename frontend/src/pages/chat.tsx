'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { io, Socket } from 'socket.io-client'
import Layout from '@/components/Layout'
import {
  MessageSquare, Plus, Search, X, Send, Users, Hash,
  ChevronDown, Check, FolderOpen, User, MoreVertical,
  Paperclip, Smile, Info, ArrowLeft, Loader2,
} from 'lucide-react'
import { useProjectContext } from '@/context/ProjectContext'
import { teamService, TeamMemberRecord } from '@/services/teamService'
import { ROLE_LABELS } from '@/utils/access'

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
  roomId: string
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

// ── Constants ─────────────────────────────────────────────────────────────────
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
const CONV_KEY = 'chat_conversations_v2'
const ACTIVE_KEY = 'chat_active_id_v1'
const UNREAD_KEY = 'chat_has_unread'
const GENERAL_ID = 'c-general'

// ── Persistence ───────────────────────────────────────────────────────────────
function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CONV_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveConversations(convs: Conversation[]) {
  try { localStorage.setItem(CONV_KEY, JSON.stringify(convs)) } catch { }
}

function getMyIdentity(): { id: string; name: string } {
  if (typeof window === 'undefined') return { id: 'me', name: 'You' }
  try {
    const raw = localStorage.getItem('userData')
    if (!raw) return { id: 'me', name: 'You' }
    const u = JSON.parse(raw)
    return {
      id: String(u.id ?? 'me'),
      name: u.firstName ? `${u.firstName} ${u.lastName ?? ''}`.trim() : (u.email ?? 'You'),
    }
  } catch { return { id: 'me', name: 'You' } }
}

// ── Converters ────────────────────────────────────────────────────────────────
function toMember(m: TeamMemberRecord): ChatMember {
  return {
    id: String(m.id),
    name: m.fullName,
    role: ROLE_LABELS[m.role] ?? m.role,
    online: m.status === 'online',
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

const avatarColor = (name: string) => {
  const colors = [
    'bg-blue-600', 'bg-emerald-600', 'bg-purple-600',
    'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-indigo-600',
  ]
  return colors[name.charCodeAt(0) % colors.length]
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

// ── Member Picker ─────────────────────────────────────────────────────────────
function MemberPicker({ members, selected, onToggle, loading, label }: {
  members: ChatMember[]; selected: string[]; onToggle: (id: string) => void; loading: boolean; label: string
}) {
  const [search, setSearch] = useState('')
  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {label} <span className="ml-2 text-slate-600 normal-case font-normal">{selected.length} selected</span>
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..."
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      </div>
      <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading members…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No members found</p>
        ) : filtered.map((m) => {
          const checked = selected.includes(m.id)
          return (
            <button key={m.id} type="button" onClick={() => onToggle(m.id)}
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
  )
}

// ── New Group Chat Modal ───────────────────────────────────────────────────────
function NewGroupModal({ members, loadingMembers, onClose, onCreated }: {
  members: ChatMember[]; loadingMembers: boolean; onClose: () => void; onCreated: (conv: Conversation) => void
}) {
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const toggle = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

  const handleCreate = () => {
    if (!groupName.trim()) { setError('Group name is required'); return }
    if (selected.length < 1) { setError('Select at least 1 member'); return }
    const chosenMembers = members.filter((m) => selected.includes(m.id))
    const conv: Conversation = {
      id: `grp-${Date.now()}`, type: 'group', name: groupName.trim(), members: chosenMembers,
      unread: 0, lastMessage: 'Group created', lastTime: 'now',
      messages: [{ id: 'sys', roomId: `grp-${Date.now()}`, senderId: 'system', senderName: 'System', text: `Group "${groupName.trim()}" was created.`, time: 'now', date: 'Today', isOwn: false }],
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
          <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Backend Team"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
        </div>
      </div>
      <MemberPicker members={members} selected={selected} onToggle={toggle} loading={loadingMembers} label="Add Members" />
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors hover:border-slate-600">Cancel</button>
        <button onClick={handleCreate} className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors">Create Group</button>
      </div>
    </ModalShell>
  )
}

// ── New Project Chat Modal ────────────────────────────────────────────────────
function NewProjectChatModal({ members, loadingMembers, onClose, onCreated }: {
  members: ChatMember[]; loadingMembers: boolean; onClose: () => void; onCreated: (conv: Conversation) => void
}) {
  const { projects } = useProjectContext()
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [error, setError] = useState('')
  const toggle = (id: string) => setSelectedMembers((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

  const handleCreate = () => {
    if (!selectedProject) { setError('Please select a project'); return }
    if (selectedMembers.length === 0) { setError('Select at least 1 member'); return }
    const chosenMembers = members.filter((m) => selectedMembers.includes(m.id))
    const conv: Conversation = {
      id: `proj-${Date.now()}`, type: 'project', name: selectedProject, projectName: selectedProject,
      members: chosenMembers, unread: 0, lastMessage: 'Project chat created', lastTime: 'now',
      messages: [{ id: 'sys', roomId: `proj-${Date.now()}`, senderId: 'system', senderName: 'System', text: `Project chat for "${selectedProject}" was created.`, time: 'now', date: 'Today', isOwn: false }],
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
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>
      <MemberPicker members={members} selected={selectedMembers} onToggle={toggle} loading={loadingMembers} label="Add Members" />
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors hover:border-slate-600">Cancel</button>
        <button onClick={handleCreate} className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors">Create Chat</button>
      </div>
    </ModalShell>
  )
}

// ── New DM Modal ───────────────────────────────────────────────────────────────
function NewDMModal({ members, loadingMembers, existingDMs, onClose, onCreated }: {
  members: ChatMember[]; loadingMembers: boolean; existingDMs: string[]; onClose: () => void; onCreated: (conv: Conversation) => void
}) {
  const [search, setSearch] = useState('')
  const available = members.filter(
    (m) => !existingDMs.includes(m.name) && m.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (member: ChatMember) => {
    const conv: Conversation = {
      id: `dm-${Date.now()}`, type: 'direct', name: member.name, online: member.online,
      members: [member], unread: 0, lastMessage: 'No messages yet', lastTime: 'now', messages: [],
    }
    onCreated(conv)
  }

  return (
    <ModalShell title="New Direct Message" icon={<User className="w-4 h-4 text-primary-400" />} onClose={onClose}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team members..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
        {loadingMembers ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading members…
          </div>
        ) : available.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No members available</p>
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

// ── Conversation List Item ────────────────────────────────────────────────────
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
        {/* Unread dot on avatar */}
        {conv.unread > 0 && !active && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-slate-950" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm font-semibold truncate ${active ? 'text-primary-200' : 'text-white'}`}>{conv.name}</p>
          <span className="text-[10px] text-slate-500 shrink-0">{conv.lastTime}</span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className={`text-xs truncate ${conv.unread > 0 && !active ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
            {conv.lastMessage}
          </p>
          {conv.unread > 0 && !active && (
            <span className="shrink-0 min-w-[20px] h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {conv.unread > 99 ? '99+' : conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Chat Window ───────────────────────────────────────────────────────────────
function ChatWindow({ conv, onSend, onBack, connected }: {
  conv: Conversation; onSend: (text: string) => void; onBack: () => void; connected: boolean
}) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conv.messages])

  const handleSend = () => {
    const t = text.trim()
    if (!t || !connected) return
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
              {conv.members.length} members · <span className="text-emerald-400">{onlineCount} online</span>
            </p>
          ) : (
            <p className={`text-xs ${conv.online ? 'text-emerald-400' : 'text-slate-500'}`}>
              {conv.online ? 'Active now' : 'Offline'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 mr-1">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
            <span className="text-[10px] text-slate-400">{connected ? 'Live' : 'Connecting…'}</span>
          </div>
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
              placeholder={connected ? `Message ${conv.name}…` : 'Connecting to chat…'}
              disabled={!connected}
              className="w-full px-4 py-3 pr-12 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button className="absolute right-3 bottom-3 text-slate-400 hover:text-white transition-colors">
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || !connected}
            className="p-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white transition-colors shrink-0 mb-0.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2 ml-11">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type ModalType = 'group' | 'project' | 'dm' | null
type FilterTab = 'all' | 'groups' | 'direct'

function ensureGeneral(convs: Conversation[], members: ChatMember[]): Conversation[] {
  if (convs.some((c) => c.id === GENERAL_ID)) {
    return convs.map((c) => c.id === GENERAL_ID ? { ...c, members } : c)
  }
  const general: Conversation = {
    id: GENERAL_ID, type: 'group', name: 'General', members,
    unread: 0, lastMessage: 'Welcome to the team chat!', lastTime: 'now',
    messages: [{
      id: 'sys-0', roomId: GENERAL_ID, senderId: 'system', senderName: 'System',
      text: 'Welcome to General — your team hub for all updates.', time: 'now', date: 'Today', isOwn: false,
    }],
  }
  return [general, ...convs]
}

export default function ChatPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations())
  const [activeId, setActiveId] = useState<string | null>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem(ACTIVE_KEY) ?? null) : null
  )
  const [modal, setModal] = useState<ModalType>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(true)

  const [teamMembers, setTeamMembers] = useState<ChatMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  // Socket state
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const activeIdRef = useRef<string | null>(activeId)

  // Keep activeIdRef in sync
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  // Redirect if not logged in
  useEffect(() => {
    if (!localStorage.getItem('authToken')) router.push('/login')
  }, [router])

  // Clear unread flag when on chat page
  useEffect(() => {
    localStorage.removeItem(UNREAD_KEY)
    window.dispatchEvent(new Event('chatUnreadChanged'))
  }, [])

  // Persist conversations
  useEffect(() => { saveConversations(conversations) }, [conversations])

  // Persist active id
  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId)
  }, [activeId])

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(`${SOCKET_URL}/chat`, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('authToken') },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      // Re-join current room after reconnect
      if (activeIdRef.current) socket.emit('join_room', { roomId: activeIdRef.current })
    })

    socket.on('disconnect', () => setConnected(false))

    // Load message history for a room
    socket.on('room_history', (history: Omit<Message, 'isOwn'>[]) => {
      const { id: myId } = getMyIdentity()
      const msgs: Message[] = history.map((m) => ({ ...m, isOwn: m.senderId === myId }))
      setConversations((prev) => prev.map((c) =>
        c.id === activeIdRef.current
          ? { ...c, messages: msgs, lastMessage: msgs[msgs.length - 1]?.text || c.lastMessage }
          : c
      ))
    })

    // New real-time message
    socket.on('new_message', (msg: Omit<Message, 'isOwn'>) => {
      const { id: myId } = getMyIdentity()
      const fullMsg: Message = { ...msg, isOwn: msg.senderId === myId }
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      setConversations((prev) => prev.map((c) => {
        if (c.id !== msg.roomId) return c
        const isActive = activeIdRef.current === msg.roomId
        return {
          ...c,
          messages: [...c.messages, fullMsg],
          lastMessage: msg.text,
          lastTime: now,
          unread: isActive ? 0 : c.unread + 1,
        }
      }))

      // Set sidebar unread flag if message is NOT in active conversation
      if (activeIdRef.current !== msg.roomId && msg.senderId !== myId) {
        localStorage.setItem(UNREAD_KEY, 'true')
        window.dispatchEvent(new Event('chatUnreadChanged'))
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Join room when active conversation changes ────────────────────────────
  useEffect(() => {
    if (!activeId || !socketRef.current) return
    socketRef.current.emit('join_room', { roomId: activeId })
  }, [activeId])

  // ── Load team members ─────────────────────────────────────────────────────
  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    try {
      const data = await teamService.getDashboard()
      const members = data.members.map(toMember)
      setTeamMembers(members)
      setConversations((prev) => {
        const updated = ensureGeneral(prev, members)
        saveConversations(updated)
        return updated
      })
      setActiveId((prev) => prev ?? GENERAL_ID)
    } catch {
      setConversations((prev) => {
        if (prev.some((c) => c.id === GENERAL_ID)) return prev
        const updated = ensureGeneral(prev, [])
        saveConversations(updated)
        return updated
      })
      setActiveId((prev) => prev ?? GENERAL_ID)
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  useEffect(() => { void loadMembers() }, [loadMembers])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const activeConv = conversations.find((c) => c.id === activeId) ?? null

  const filtered = conversations.filter((c) => {
    const matchTab = filter === 'all' || (filter === 'groups' && c.type !== 'direct') || (filter === 'direct' && c.type === 'direct')
    return matchTab && c.name.toLowerCase().includes(search.toLowerCase())
  })

  const handleSelect = (id: string) => {
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, unread: 0 } : c))
    setActiveId(id)
    setShowList(false)

    // Clear global unread flag if no more unreads
    setTimeout(() => {
      setConversations((prev) => {
        const totalUnread = prev.reduce((sum, c) => sum + (c.id !== id ? c.unread : 0), 0)
        if (totalUnread === 0) {
          localStorage.removeItem(UNREAD_KEY)
          window.dispatchEvent(new Event('chatUnreadChanged'))
        }
        return prev
      })
    }, 0)
  }

  const handleCreated = (conv: Conversation) => {
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
    setModal(null)
    setShowList(false)
  }

  const handleSend = (text: string) => {
    if (!activeId || !socketRef.current || !connected) return
    const { id: myId, name: myName } = getMyIdentity()
    socketRef.current.emit('send_message', {
      roomId: activeId,
      text,
      senderId: myId,
      senderName: myName,
    })
  }

  const existingDMs = conversations.filter((c) => c.type === 'direct').map((c) => c.name)
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)
  const onlineCount = teamMembers.filter((m) => m.online).length

  return (
    <Layout>
      <div className="h-[calc(100vh-9rem)] flex flex-col">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <p className="text-xs font-medium text-primary-400 mb-1">Workspace</p>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Chat
              {totalUnread > 0 && (
                <span className="text-sm font-semibold bg-rose-500 text-white rounded-full px-2 py-0.5">{totalUnread}</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModal('dm')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:border-primary-600/50 hover:text-white transition-colors">
              <User className="w-4 h-4 text-primary-400" /> DM
            </button>
            <button onClick={() => setModal('project')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:border-primary-600/50 hover:text-white transition-colors">
              <FolderOpen className="w-4 h-4 text-indigo-400" /> Project Chat
            </button>
            <button onClick={() => setModal('group')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Group
            </button>
          </div>
        </div>

        {/* Chat Layout */}
        <div className="flex-1 min-h-0 flex rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
          {/* Sidebar */}
          <div className={`w-full lg:w-80 xl:w-96 shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 ${!showList ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
              </div>
            </div>

            <div className="flex border-b border-slate-800 px-1">
              {(['all', 'groups', 'direct'] as const).map((tab) => (
                <button key={tab} onClick={() => setFilter(tab)}
                  className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${filter === tab ? 'text-primary-400 border-b-2 border-primary-500' : 'text-slate-500 hover:text-slate-300'}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {loadingMembers && conversations.length === 0 ? (
                <div className="flex items-center justify-center py-12 gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <MessageSquare className="w-8 h-8 text-slate-700" />
                  <p className="text-sm text-slate-500">
                    {conversations.length === 0 ? 'No conversations yet' : 'No results found'}
                  </p>
                  {conversations.length === 0 && (
                    <button onClick={() => setModal('group')} className="text-xs text-primary-400 hover:text-primary-300 underline">
                      Start a group chat
                    </button>
                  )}
                </div>
              ) : filtered.map((conv) => (
                <ConvItem key={conv.id} conv={conv} active={activeId === conv.id} onClick={() => handleSelect(conv.id)} />
              ))}
            </div>

            <div className="p-3 border-t border-slate-800">
              {loadingMembers ? (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching team status…
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {onlineCount} of {teamMembers.length} team members online
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`flex-1 min-w-0 ${showList && !activeConv ? 'hidden lg:flex' : 'flex'} flex-col`}>
            {activeConv ? (
              <ChatWindow conv={activeConv} onSend={handleSend} onBack={() => setShowList(true)} connected={connected} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-primary-600/10 border border-primary-600/20 flex items-center justify-center">
                  <MessageSquare className="w-9 h-9 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Your messages</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-xs">
                    Select a conversation or create a new one to start chatting with your team.
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

      {modal === 'group' && <NewGroupModal members={teamMembers} loadingMembers={loadingMembers} onClose={() => setModal(null)} onCreated={handleCreated} />}
      {modal === 'project' && <NewProjectChatModal members={teamMembers} loadingMembers={loadingMembers} onClose={() => setModal(null)} onCreated={handleCreated} />}
      {modal === 'dm' && <NewDMModal members={teamMembers} loadingMembers={loadingMembers} existingDMs={existingDMs} onClose={() => setModal(null)} onCreated={handleCreated} />}
    </Layout>
  )
}
