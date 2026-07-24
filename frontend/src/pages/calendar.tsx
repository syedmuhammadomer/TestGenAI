'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { config } from '@/utils/config'
import {
  ChevronLeft, ChevronRight, Clock, ExternalLink,
  MapPin, Plus, Trash2, Users, Video, X, Edit2, Star,
  AlertCircle, Check, RefreshCw, PanelLeft, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
type EventType =
  | 'sprint_planning' | 'daily_standup' | 'sprint_review'
  | 'sprint_retrospective' | 'client_meeting' | 'qa_review'
  | 'release_planning' | 'custom'

type Priority = 'urgent' | 'high' | 'medium' | 'low'
type MeetingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled' | 'missed'
type CalView = 'month' | 'week' | 'day' | 'schedule'
type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly'

interface Participant {
  id?: number
  userId: number
  userEmail?: string
  userName?: string
  attendanceStatus: string
}

interface Meeting {
  id: number
  title: string
  description?: string
  projectId?: number
  sprintId?: string
  type: EventType
  startDatetime: string
  endDatetime: string
  timezone: string
  meetingLink?: string
  location?: string
  priority: Priority
  status: MeetingStatus
  repeatType?: string
  reminderMinutes?: number
  notes?: string
  createdBy: number
  participants: Participant[]
  createdAt: string
  updatedAt: string
}

interface TeamMember {
  id: number
  fullName: string
  email: string
  role: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const EVENT_TYPES: Record<EventType, { label: string; color: string; bg: string; light: string }> = {
  sprint_planning:      { label: 'Sprint Planning',  color: '#3b82f6', bg: 'bg-blue-600',    light: 'bg-blue-500/15 text-blue-300 border-blue-700/40' },
  daily_standup:        { label: 'Daily Standup',    color: '#10b981', bg: 'bg-emerald-600', light: 'bg-emerald-500/15 text-emerald-300 border-emerald-700/40' },
  sprint_review:        { label: 'Sprint Review',    color: '#8b5cf6', bg: 'bg-violet-600',  light: 'bg-violet-500/15 text-violet-300 border-violet-700/40' },
  sprint_retrospective: { label: 'Retrospective',    color: '#7c3aed', bg: 'bg-purple-700',  light: 'bg-purple-500/15 text-purple-300 border-purple-700/40' },
  client_meeting:       { label: 'Client Meeting',   color: '#f97316', bg: 'bg-orange-600',  light: 'bg-orange-500/15 text-orange-300 border-orange-700/40' },
  qa_review:            { label: 'QA Review',        color: '#06b6d4', bg: 'bg-cyan-600',    light: 'bg-cyan-500/15 text-cyan-300 border-cyan-700/40' },
  release_planning:     { label: 'Release Planning', color: '#f59e0b', bg: 'bg-amber-600',   light: 'bg-amber-500/15 text-amber-300 border-amber-700/40' },
  custom:               { label: 'Custom Event',     color: '#14b8a6', bg: 'bg-teal-600',    light: 'bg-teal-500/15 text-teal-300 border-teal-700/40' },
}

const REMINDER_OPTIONS = [
  { value: 0,    label: 'At time of meeting' },
  { value: 5,    label: '5 minutes before' },
  { value: 10,   label: '10 minutes before' },
  { value: 15,   label: '15 minutes before' },
  { value: 30,   label: '30 minutes before' },
  { value: 60,   label: '1 hour before' },
  { value: 1440, label: '1 day before' },
]

const PRIORITY_CONFIG: Record<Priority, { label: string; style: string }> = {
  urgent: { label: 'Urgent', style: 'bg-rose-500/15 text-rose-300 border-rose-700/40' },
  high:   { label: 'High',   style: 'bg-orange-500/15 text-orange-300 border-orange-700/40' },
  medium: { label: 'Medium', style: 'bg-amber-500/15 text-amber-300 border-amber-700/40' },
  low:    { label: 'Low',    style: 'bg-zinc-700/40 text-zinc-400 border-zinc-600' },
}

const STATUS_CONFIG: Record<MeetingStatus, { label: string; style: string }> = {
  upcoming:    { label: 'Upcoming',    style: 'bg-blue-500/15 text-blue-300 border-blue-700/40' },
  in_progress: { label: 'In Progress', style: 'bg-emerald-500/15 text-emerald-300 border-emerald-700/40' },
  completed:   { label: 'Completed',   style: 'bg-zinc-700/40 text-zinc-400 border-zinc-600' },
  cancelled:   { label: 'Cancelled',   style: 'bg-rose-500/15 text-rose-300 border-rose-700/40' },
  missed:      { label: 'Missed',      style: 'bg-orange-500/15 text-orange-300 border-orange-700/40' },
}

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAYS_FULL  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Date helpers ─────────────────────────────────────────────────────────────
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
function fmtDateFull(dt: string) {
  return new Date(dt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}
function toLocalDatetimeInput(isoStr: string) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: Date[] = []
  for (let i = 0; i < first.getDay(); i++) days.push(new Date(year, month, 1 - first.getDay() + i))
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1))
  return days
}
function getWeekDays(anchor: Date): Date[] {
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - anchor.getDay())
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
}
function meetingsForDay(meetings: Meeting[], day: Date) {
  return meetings.filter((m) => sameDay(new Date(m.startDatetime), day))
}

// ─── Event chip ───────────────────────────────────────────────────────────────
function EventChip({ meeting, compact = false, onClick }: { meeting: Meeting; compact?: boolean; onClick: () => void }) {
  const cfg = EVENT_TYPES[meeting.type] ?? EVENT_TYPES.custom
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`w-full text-left text-[11px] font-medium px-1.5 py-[3px] rounded-[4px] truncate transition-all hover:brightness-110 ${
        meeting.status === 'cancelled' ? 'opacity-40 line-through' : ''
      }`}
      style={{ backgroundColor: cfg.color + '30', color: cfg.color, borderLeft: `2px solid ${cfg.color}` }}
      title={`${meeting.title} · ${fmtTime(meeting.startDatetime)}`}
    >
      {!compact && <span className="mr-1 opacity-60">{fmtTime(meeting.startDatetime)}</span>}
      {meeting.title}
    </button>
  )
}

// ─── Mini calendar (left sidebar) ─────────────────────────────────────────────
function MiniCalendar({ year, month, today, anchor, onDateClick, onPrev, onNext }: {
  year: number; month: number; today: Date; anchor: Date
  onDateClick: (d: Date) => void
  onPrev: () => void
  onNext: () => void
}) {
  const grid = getMonthGrid(year, month)
  return (
    <div className="px-4 pt-4 pb-2 select-none">
      {/* Mini header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">
          {MONTHS_SHORT[month]} {year}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={onPrev} className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={onNext} className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-medium text-zinc-500 pb-1">{d}</div>
        ))}
      </div>
      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {grid.map((day, i) => {
          const isThisMonth = day.getMonth() === month
          const isToday = sameDay(day, today)
          const isSelected = sameDay(day, anchor)
          return (
            <button
              key={i}
              onClick={() => onDateClick(day)}
              className={`
                h-7 w-7 mx-auto rounded-full flex items-center justify-center text-[12px] transition-all
                ${isToday ? 'bg-amber-400 text-black font-bold' :
                  isSelected ? 'bg-white/10 text-white font-medium' :
                  isThisMonth ? 'text-zinc-300 hover:bg-white/10' : 'text-zinc-700 hover:bg-white/5'}
              `}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Month view ───────────────────────────────────────────────────────────────
function MonthView({ meetings, year, month, today, onDayClick, onMeetingClick }: {
  meetings: Meeting[]; year: number; month: number; today: Date
  onDayClick: (d: Date) => void; onMeetingClick: (m: Meeting) => void
}) {
  const grid = getMonthGrid(year, month)
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#2a2a2a] shrink-0">
        {DAYS_FULL.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div className="flex-1 grid grid-cols-7" style={{ gridTemplateRows: `repeat(${grid.length / 7}, minmax(0, 1fr))` }}>
        {grid.map((day, i) => {
          const isThisMonth = day.getMonth() === month
          const isToday = sameDay(day, today)
          const dayMeetings = meetingsForDay(meetings, day)
          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={`border-b border-r border-[#2a2a2a] p-1.5 cursor-pointer group transition-colors hover:bg-white/[0.02] ${
                !isThisMonth ? 'opacity-30' : ''
              } ${i % 7 === 0 ? 'border-l-0' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 transition-colors ${
                isToday ? 'bg-amber-400 text-black font-bold' : 'text-zinc-300 group-hover:bg-white/10'
              }`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayMeetings.slice(0, 3).map((m) => (
                  <EventChip key={m.id} meeting={m} onClick={() => onMeetingClick(m)} />
                ))}
                {dayMeetings.length > 3 && (
                  <p className="text-[10px] text-zinc-500 pl-1.5">+{dayMeetings.length - 3} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week view ────────────────────────────────────────────────────────────────
function WeekView({ meetings, anchor, today, onSlotClick, onMeetingClick }: {
  meetings: Meeting[]; anchor: Date; today: Date
  onSlotClick: (d: Date, hour: number) => void; onMeetingClick: (m: Meeting) => void
}) {
  const days = getWeekDays(anchor)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (nowMin / 60 - 1)) * 60
    }
  }, [nowMin])

  return (
    <div className="flex-1 overflow-auto" ref={scrollRef}>
      {/* Header row */}
      <div className="sticky top-0 z-10 grid border-b border-[#2a2a2a] bg-[#0d0d0d]" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        <div className="py-3 border-r border-[#2a2a2a]" />
        {days.map((day, i) => {
          const isToday = sameDay(day, today)
          return (
            <div key={i} className="py-2 text-center border-r border-[#2a2a2a] last:border-r-0">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">{DAYS_FULL[day.getDay()]}</p>
              <div className={`text-xl font-bold mt-0.5 mx-auto w-9 h-9 rounded-full flex items-center justify-center ${
                isToday ? 'bg-amber-400 text-black' : 'text-zinc-200'
              }`}>{day.getDate()}</div>
            </div>
          )
        })}
      </div>
      {/* Time slots */}
      <div className="relative">
        {hours.map((h) => (
          <div key={h} className="grid border-b border-[#1e1e1e]" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', minHeight: '60px' }}>
            <div className="text-[10px] text-zinc-600 px-2 -translate-y-2.5 text-right tabular-nums select-none border-r border-[#2a2a2a] pt-2">
              {h === 0 ? '' : `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`}
            </div>
            {days.map((day, di) => {
              const slotMeetings = meetings.filter((m) => {
                const s = new Date(m.startDatetime)
                return sameDay(s, day) && s.getHours() === h
              })
              const isTodayCol = sameDay(day, today)
              return (
                <div
                  key={di}
                  onClick={() => onSlotClick(day, h)}
                  className={`border-r border-[#1e1e1e] last:border-r-0 hover:bg-white/[0.02] cursor-pointer relative p-0.5 space-y-0.5 ${
                    isTodayCol ? 'bg-amber-400/[0.02]' : ''
                  }`}
                >
                  {slotMeetings.map((m) => <EventChip key={m.id} meeting={m} onClick={() => onMeetingClick(m)} />)}
                </div>
              )
            })}
          </div>
        ))}
        {/* Current time indicator */}
        {days.some((d) => sameDay(d, today)) && (
          <div
            className="absolute left-14 right-0 z-20 flex items-center pointer-events-none"
            style={{ top: `${(nowMin / (24 * 60)) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shrink-0" />
            <div className="flex-1 h-[1.5px] bg-rose-500" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Day view ─────────────────────────────────────────────────────────────────
function DayView({ meetings, anchor, today, onSlotClick, onMeetingClick }: {
  meetings: Meeting[]; anchor: Date; today: Date
  onSlotClick: (d: Date, hour: number) => void; onMeetingClick: (m: Meeting) => void
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const isToday = sameDay(anchor, today)
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  return (
    <div className="flex-1 overflow-auto">
      <div className="sticky top-0 z-10 border-b border-[#2a2a2a] bg-[#0d0d0d] px-6 py-3 grid" style={{ gridTemplateColumns: '56px 1fr' }}>
        <div />
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{DAYS_FULL[anchor.getDay()]}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`text-2xl font-bold w-10 h-10 rounded-full flex items-center justify-center ${
              isToday ? 'bg-amber-400 text-black' : 'text-white'
            }`}>{anchor.getDate()}</div>
            {isToday && <span className="text-xs text-amber-400 font-medium">Today</span>}
          </div>
        </div>
      </div>
      <div className="relative">
        {hours.map((h) => {
          const slotMeetings = meetings.filter((m) => {
            const s = new Date(m.startDatetime)
            return sameDay(s, anchor) && s.getHours() === h
          })
          return (
            <div
              key={h}
              onClick={() => onSlotClick(anchor, h)}
              className="grid border-b border-[#1e1e1e] hover:bg-white/[0.015] cursor-pointer transition-colors"
              style={{ gridTemplateColumns: '56px 1fr', minHeight: '64px' }}
            >
              <div className="text-[10px] text-zinc-600 text-right pr-3 -translate-y-2.5 tabular-nums select-none pt-2">
                {h === 0 ? '' : `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`}
              </div>
              <div className="p-1 space-y-1 border-l border-[#2a2a2a]">
                {slotMeetings.map((m) => {
                  const cfg = EVENT_TYPES[m.type] ?? EVENT_TYPES.custom
                  const duration = Math.round((new Date(m.endDatetime).getTime() - new Date(m.startDatetime).getTime()) / 60000)
                  return (
                    <button
                      key={m.id}
                      onClick={(e) => { e.stopPropagation(); onMeetingClick(m) }}
                      className="w-full text-left rounded-lg px-3 py-2 transition-all hover:brightness-110"
                      style={{ backgroundColor: cfg.color + '22', borderLeft: `3px solid ${cfg.color}` }}
                    >
                      <p className="text-sm font-semibold" style={{ color: cfg.color }}>{m.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{fmtTime(m.startDatetime)} · {duration}m{m.location ? ` · ${m.location}` : ''}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        {/* Current time */}
        {isToday && (
          <div
            className="absolute left-14 right-0 z-20 flex items-center pointer-events-none"
            style={{ top: `${(nowMin / (24 * 60)) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shrink-0" />
            <div className="flex-1 h-[1.5px] bg-rose-500" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Schedule view ────────────────────────────────────────────────────────────
function ScheduleView({ meetings, onMeetingClick }: { meetings: Meeting[]; onMeetingClick: (m: Meeting) => void }) {
  const upcoming = [...meetings]
    .filter((m) => m.status !== 'cancelled')
    .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())

  const groups: Record<string, Meeting[]> = {}
  for (const m of upcoming) {
    const key = new Date(m.startDatetime).toDateString()
    ;(groups[key] = groups[key] ?? []).push(m)
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Clock className="w-7 h-7 text-zinc-600" />
        </div>
        <p className="text-zinc-400 font-medium">No upcoming meetings</p>
        <p className="text-zinc-600 text-sm mt-1">Click &ldquo;+ Create&rdquo; to schedule one</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      {Object.entries(groups).map(([dateStr, dayMeetings]) => {
        const d = new Date(dateStr)
        const isToday = sameDay(d, new Date())
        return (
          <div key={dateStr} className="flex border-b border-[#2a2a2a]">
            {/* Date column */}
            <div className="w-24 shrink-0 px-4 py-4 text-right border-r border-[#2a2a2a]">
              <p className="text-xs text-zinc-500 uppercase">{DAYS_FULL[d.getDay()]}</p>
              <div className={`text-2xl font-bold mt-0.5 ${isToday ? 'text-amber-400' : 'text-zinc-200'}`}>
                {d.getDate()}
              </div>
              <p className="text-xs text-zinc-600">{MONTHS_SHORT[d.getMonth()]}</p>
            </div>
            {/* Events */}
            <div className="flex-1 px-4 py-3 space-y-2">
              {dayMeetings.map((m) => {
                const cfg = EVENT_TYPES[m.type] ?? EVENT_TYPES.custom
                const duration = Math.round((new Date(m.endDatetime).getTime() - new Date(m.startDatetime).getTime()) / 60000)
                return (
                  <button
                    key={m.id}
                    onClick={() => onMeetingClick(m)}
                    className="w-full text-left rounded-xl px-4 py-3 border transition-all hover:brightness-110 group"
                    style={{ backgroundColor: cfg.color + '12', borderColor: cfg.color + '30' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cfg.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white group-hover:text-zinc-100">{m.title}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${cfg.light}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 flex-wrap">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(m.startDatetime)} – {fmtTime(m.endDatetime)} ({duration}m)</span>
                          {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                          {m.participants.length > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{m.participants.length}</span>}
                        </div>
                      </div>
                      {m.meetingLink && (
                        <a
                          href={m.meetingLink} target="_blank" rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <Video className="w-3 h-3" /> Join
                        </a>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Meeting detail modal ─────────────────────────────────────────────────────
function MeetingDetailModal({ meeting, onClose, onEdit, onDelete, canManage, isStarred, onToggleStar }: {
  meeting: Meeting; onClose: () => void
  onEdit: () => void; onDelete: () => void; canManage: boolean
  isStarred: boolean; onToggleStar: () => void
}) {
  const cfg = EVENT_TYPES[meeting.type] ?? EVENT_TYPES.custom
  const duration = Math.round((new Date(meeting.endDatetime).getTime() - new Date(meeting.startDatetime).getTime()) / 60000)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="h-1 w-full" style={{ backgroundColor: cfg.color }} />
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3 border-b border-[#2a2a2a]">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.light}`}>{cfg.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[meeting.status]?.style}`}>{STATUS_CONFIG[meeting.status]?.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_CONFIG[meeting.priority]?.style}`}>{PRIORITY_CONFIG[meeting.priority]?.label}</span>
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">{meeting.title}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleStar}
              className={`p-2 rounded-lg transition-colors ${isStarred ? 'text-amber-400 hover:bg-amber-400/10' : 'text-zinc-500 hover:bg-white/10 hover:text-amber-400'}`}
              title={isStarred ? 'Remove from starred' : 'Star this meeting'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
            </button>
            {canManage && (
              <>
                <button onClick={onEdit} className="p-2 rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={onDelete} className="p-2 rounded-lg text-zinc-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="divide-y divide-[#2a2a2a] max-h-[60vh] overflow-y-auto">
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Date &amp; Time</p>
              <p className="text-sm text-zinc-200">{fmtDateFull(meeting.startDatetime)}</p>
              <p className="text-sm text-zinc-400">{fmtTime(meeting.startDatetime)} – {fmtTime(meeting.endDatetime)} <span className="text-zinc-600">({duration}m)</span></p>
            </div>
            {meeting.location && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Location</p>
                <p className="text-sm text-zinc-200 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-500" />{meeting.location}</p>
              </div>
            )}
          </div>
          {meeting.description && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Description</p>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{meeting.description}</p>
            </div>
          )}
          {meeting.meetingLink && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Meeting Link</p>
              <a href={meeting.meetingLink} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300 transition-colors">
                <Video className="w-4 h-4" /> Join meeting <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          {meeting.participants.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Participants ({meeting.participants.length})</p>
              <div className="space-y-2">
                {meeting.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-teal-600/20 text-teal-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {(p.userName ?? p.userEmail ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{p.userName ?? p.userEmail ?? `User #${p.userId}`}</p>
                      {p.userEmail && p.userName && <p className="text-xs text-zinc-500 truncate">{p.userEmail}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      p.attendanceStatus === 'present' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-700/40'
                      : p.attendanceStatus === 'late' ? 'bg-amber-500/15 text-amber-300 border-amber-700/40'
                      : p.attendanceStatus === 'absent' ? 'bg-rose-500/15 text-rose-300 border-rose-700/40'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}>{p.attendanceStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {meeting.notes && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Notes</p>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{meeting.notes}</p>
            </div>
          )}
        </div>
        {meeting.meetingLink && (
          <div className="px-5 py-4 border-t border-[#2a2a2a]">
            <a href={meeting.meetingLink} target="_blank" rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-600/30 transition-all text-sm font-semibold">
              <Video className="w-4 h-4" /> Join Meeting
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Meeting modal (create / edit) ────────────────────────────────────────────
const EMPTY_FORM = {
  title: '', description: '', type: 'custom' as EventType,
  startDatetime: '', endDatetime: '', timezone: 'UTC',
  meetingLink: '', location: '', priority: 'medium' as Priority,
  repeatType: 'none' as RepeatType, reminderMinutes: 15, notes: '',
  projectId: '' as string | number, sprintId: '', participantIds: [] as number[],
}

function MeetingModal({ initial, teamMembers, onSave, onClose }: {
  initial?: Partial<typeof EMPTY_FORM> & { id?: number }
  teamMembers: TeamMember[]
  onSave: (data: typeof EMPTY_FORM & { id?: number }) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof typeof EMPTY_FORM, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }))
  const toggleParticipant = (id: number) => setForm((prev) => ({
    ...prev,
    participantIds: prev.participantIds.includes(id) ? prev.participantIds.filter((x) => x !== id) : [...prev.participantIds, id],
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Meeting title is required'); return }
    if (!form.startDatetime) { setError('Start date/time is required'); return }
    if (!form.endDatetime) { setError('End date/time is required'); return }
    if (new Date(form.endDatetime) <= new Date(form.startDatetime)) { setError('End time must be after start time'); return }
    setSaving(true); setError('')
    try { await onSave({ ...form, id: initial?.id }) } catch (e: unknown) { setError((e as { message?: string })?.message ?? 'Failed to save meeting') } finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all'
  const labelCls = 'block text-xs font-semibold text-zinc-500 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#111] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] shrink-0">
          <h2 className="text-base font-bold text-white">{initial?.id ? 'Edit Meeting' : 'New Meeting'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Meeting Title *</label>
            <input className={inputCls} placeholder="e.g. Sprint 12 Planning" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Meeting Type</label>
              <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value as EventType)}>
                {(Object.entries(EVENT_TYPES) as [EventType, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select className={inputCls} value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
                {(Object.entries(PRIORITY_CONFIG) as [Priority, { label: string }][]).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date &amp; Time *</label>
              <input type="datetime-local" className={inputCls} value={form.startDatetime} onChange={(e) => set('startDatetime', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>End Date &amp; Time *</label>
              <input type="datetime-local" className={inputCls} value={form.endDatetime} onChange={(e) => set('endDatetime', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Location</label>
              <input className={inputCls} placeholder="Room / Address" value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Meeting Link</label>
              <input className={inputCls} placeholder="https://meet.google.com/..." value={form.meetingLink} onChange={(e) => set('meetingLink', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sprint</label>
              <input className={inputCls} placeholder="Sprint 12" value={form.sprintId} onChange={(e) => set('sprintId', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Repeat</label>
              <select className={inputCls} value={form.repeatType} onChange={(e) => set('repeatType', e.target.value as RepeatType)}>
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Reminder</label>
            <select className={inputCls} value={form.reminderMinutes} onChange={(e) => set('reminderMinutes', Number(e.target.value))}>
              {REMINDER_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} min-h-[72px] resize-y`} placeholder="Meeting agenda, goals…" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          {teamMembers.length > 0 && (
            <div>
              <label className={labelCls}>Invite Members</label>
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-2">
                {teamMembers.map((m) => {
                  const selected = form.participantIds.includes(m.id)
                  return (
                    <button key={m.id} type="button" onClick={() => toggleParticipant(m.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${selected ? 'bg-teal-600/15 text-teal-300' : 'hover:bg-white/5 text-zinc-300'}`}>
                      <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${selected ? 'bg-teal-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                        {selected ? <Check className="w-3 h-3" /> : m.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.fullName}</p>
                        <p className="text-xs text-zinc-500 truncate">{m.email}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} min-h-[56px] resize-y`} placeholder="Additional notes…" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-rose-300 text-sm bg-rose-900/20 border border-rose-800/40 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </form>
        <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[#2a2a2a] text-zinc-300 hover:bg-white/5 transition-colors text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={saving}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {initial?.id ? 'Save Changes' : 'Create Meeting'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter()
  const today = new Date()

  const [meetings, setMeetings]         = useState<Meeting[]>([])
  const [teamMembers, setTeamMembers]   = useState<TeamMember[]>([])
  const [loading, setLoading]           = useState(true)
  const [view, setView]                 = useState<CalView>('month')
  const [anchor, setAnchor]             = useState(new Date())
  const [modalOpen, setModalOpen]       = useState(false)
  const [modalInitial, setModalInitial] = useState<Partial<typeof EMPTY_FORM> & { id?: number }>({})
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null)
  const [userRole, setUserRole]         = useState<string>('viewer')
  const [leftOpen, setLeftOpen]         = useState(true)
  const [myCalOpen, setMyCalOpen]       = useState(true)
  const [starredOpen, setStarredOpen]   = useState(true)
  const [starredMeetingIds, setStarredMeetingIds] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem('cal_starred') ?? '[]') as number[]) } catch { return new Set() }
  })
  const userId = useRef<number>(0)

  const toggleStar = (id: number) => {
    setStarredMeetingIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      localStorage.setItem('cal_starred', JSON.stringify([...next]))
      return next
    })
  }

  const canManage = ['company_admin', 'pm'].includes(userRole)
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  const loadMeetings = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await axios.get<Meeting[]>(`${config.apiBaseUrl}/api/calendar/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMeetings(data)
    } catch { /* noop */ }
  }, [token])

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        const u = JSON.parse(userData)
        setUserRole(u.role ?? 'viewer')
        userId.current = u.id ? Number(u.id) : 0
      } catch { /* noop */ }
    }
    setLoading(false)
    void loadMeetings()
    axios.get(`${config.apiBaseUrl}/api/team`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setTeamMembers((data.members ?? []).map((m: { id: number; fullName: string; email: string; role: string }) => ({
          id: m.id, fullName: m.fullName, email: m.email, role: m.role,
        })))
      })
      .catch(() => { /* noop */ })
  }, [router, token, loadMeetings])

  // Navigation
  const goBack = () => {
    const d = new Date(anchor)
    if (view === 'month') d.setMonth(d.getMonth() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 1)
    setAnchor(d)
  }
  const goForward = () => {
    const d = new Date(anchor)
    if (view === 'month') d.setMonth(d.getMonth() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 1)
    setAnchor(d)
  }

  const headerLabel = () => {
    if (view === 'month') return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
    if (view === 'week') {
      const days = getWeekDays(anchor)
      return `${MONTHS_SHORT[days[0].getMonth()]} ${days[0].getDate()} – ${days[6].getDate()}, ${days[0].getFullYear()}`
    }
    if (view === 'day') return `${MONTHS[anchor.getMonth()]} ${anchor.getDate()}, ${anchor.getFullYear()}`
    return 'Schedule'
  }

  const openCreate = (day?: Date, hour?: number) => {
    if (!canManage) return
    const start = day ? new Date(day) : new Date()
    if (hour !== undefined) start.setHours(hour, 0, 0, 0)
    else start.setMinutes(0, 0, 0)
    const end = new Date(start)
    end.setHours(start.getHours() + 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setModalInitial({ startDatetime: fmt(start), endDatetime: fmt(end) })
    setModalOpen(true)
  }

  const openEdit = (meeting: Meeting) => {
    setModalInitial({
      id: meeting.id, title: meeting.title, description: meeting.description ?? '',
      type: meeting.type as EventType,
      startDatetime: toLocalDatetimeInput(meeting.startDatetime),
      endDatetime: toLocalDatetimeInput(meeting.endDatetime),
      timezone: meeting.timezone, meetingLink: meeting.meetingLink ?? '',
      location: meeting.location ?? '', priority: meeting.priority as Priority,
      repeatType: (meeting.repeatType ?? 'none') as RepeatType,
      reminderMinutes: meeting.reminderMinutes ?? 15, notes: meeting.notes ?? '',
      sprintId: meeting.sprintId ?? '', participantIds: meeting.participants.map((p) => p.userId),
    })
    setDetailMeeting(null)
    setModalOpen(true)
  }

  const handleSave = async (data: typeof EMPTY_FORM & { id?: number }) => {
    const payload = {
      title: data.title, description: data.description || undefined,
      type: data.type, startDatetime: new Date(data.startDatetime).toISOString(),
      endDatetime: new Date(data.endDatetime).toISOString(), timezone: data.timezone,
      meetingLink: data.meetingLink || undefined, location: data.location || undefined,
      priority: data.priority, repeatType: data.repeatType !== 'none' ? data.repeatType : undefined,
      reminderMinutes: data.reminderMinutes, notes: data.notes || undefined,
      sprintId: data.sprintId || undefined,
      participants: data.participantIds.map((uid) => {
        const member = teamMembers.find((m) => m.id === uid)
        return { userId: uid, userEmail: member?.email, userName: member?.fullName }
      }),
    }
    if (data.id) {
      await axios.patch(`${config.apiBaseUrl}/api/calendar/meetings/${data.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Meeting updated')
    } else {
      await axios.post(`${config.apiBaseUrl}/api/calendar/meetings`, payload, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Meeting created')
    }
    setModalOpen(false)
    await loadMeetings()
  }

  const handleDelete = async (meeting: Meeting) => {
    if (!window.confirm(`Delete "${meeting.title}"?`)) return
    await axios.delete(`${config.apiBaseUrl}/api/calendar/meetings/${meeting.id}`, { headers: { Authorization: `Bearer ${token}` } })
    toast.success('Meeting deleted')
    setDetailMeeting(null)
    await loadMeetings()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    )
  }

  const userData = typeof window !== 'undefined' ? (() => { try { return JSON.parse(localStorage.getItem('userData') ?? '{}') } catch { return {} } })() : {}
  const userInitial = ((userData.firstName?.[0] ?? '') + (userData.lastName?.[0] ?? '')).toUpperCase() || '?'

  return (
    <Layout>
      {/* Full-bleed wrapper that escapes Layout padding */}
      <div
        className="flex flex-col -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8"
        style={{ height: 'calc(100vh - 64px)', backgroundColor: '#0d0d0d' }}
      >
        {/* ── Top bar ── */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: '#2a2a2a' }}>
          {/* Sidebar toggle */}
          <button
            onClick={() => setLeftOpen((o) => !o)}
            className="p-2 rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Nav arrows + Today */}
          <div className="flex items-center gap-1">
            <button onClick={goBack} className="p-1.5 rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goForward} className="p-1.5 rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAnchor(new Date())}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-white/10 transition-colors border ml-1"
              style={{ borderColor: '#3a3a3a' }}
            >
              Today
            </button>
          </div>

          {/* Date label */}
          <h2 className="text-base font-semibold text-white truncate">{headerLabel()}</h2>

          {/* View switcher — centered */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center rounded-full border p-0.5" style={{ borderColor: '#3a3a3a', backgroundColor: '#111' }}>
              {(['day', 'week', 'month', 'schedule'] as CalView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all capitalize ${
                    view === v ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Create */}
          {canManage && (
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#14b8a6' }}
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Left sidebar ── */}
          {leftOpen && (
            <div className="w-60 shrink-0 flex flex-col overflow-y-auto border-r" style={{ borderColor: '#2a2a2a' }}>
              {/* Mini calendar */}
              <MiniCalendar
                year={anchor.getFullYear()}
                month={anchor.getMonth()}
                today={today}
                anchor={anchor}
                onDateClick={(d) => { setAnchor(d); if (view === 'month') setView('day') }}
                onPrev={() => { const d = new Date(anchor); d.setMonth(d.getMonth() - 1); setAnchor(d) }}
                onNext={() => { const d = new Date(anchor); d.setMonth(d.getMonth() + 1); setAnchor(d) }}
              />

              <div className="mx-4 my-2 border-t" style={{ borderColor: '#2a2a2a' }} />

              {/* User account */}
              <div className="px-4 py-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)', color: '#fff' }}>
                  {userInitial}
                </div>
                <p className="text-sm font-medium text-white truncate">{userData.firstName} {userData.lastName}</p>
              </div>

              <div className="mx-4 my-1 border-t" style={{ borderColor: '#2a2a2a' }} />

              {/* My Meetings */}
              <div className="px-3 py-2">
                <button
                  onClick={() => setMyCalOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-1 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  <span>My Meetings</span>
                  <div className="flex items-center gap-1">
                    {meetings.length > 0 && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: '#14b8a6' }}>
                        {meetings.length}
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${myCalOpen ? '' : '-rotate-90'}`} />
                  </div>
                </button>
                {myCalOpen && (
                  <div className="mt-1 px-1 py-2 text-xs text-zinc-600">
                    {meetings.length === 0 ? 'No meetings yet' : (
                      <div className="space-y-1">
                        {(Object.entries(EVENT_TYPES) as [EventType, { label: string; color: string }][])
                          .filter(([k]) => meetings.some((m) => m.type === k))
                          .map(([k, v]) => {
                            const count = meetings.filter((m) => m.type === k).length
                            return (
                              <div key={k} className="flex items-center gap-2 text-zinc-400">
                                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: v.color }} />
                                <span className="flex-1 truncate text-[11px]">{v.label}</span>
                                <span className="text-[10px] text-zinc-600">{count}</span>
                              </div>
                            )
                          })
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Starred Meetings */}
              <div className="px-3 py-1">
                <button
                  onClick={() => setStarredOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-1 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    Starred Meetings
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${starredOpen ? '' : '-rotate-90'}`} />
                </button>
                {starredOpen && (
                  <div className="px-1 py-2 space-y-1">
                    {starredMeetingIds.size === 0 ? (
                      <p className="text-[11px] text-zinc-600">Star a meeting to pin it here</p>
                    ) : (
                      meetings.filter((m) => starredMeetingIds.has(m.id)).map((m) => {
                        const cfg = EVENT_TYPES[m.type] ?? EVENT_TYPES.custom
                        return (
                          <button
                            key={m.id}
                            onClick={() => setDetailMeeting(m)}
                            className="w-full flex items-center gap-2 text-[11px] text-zinc-400 hover:text-white transition-colors text-left"
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                            <span className="truncate">{m.title}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Calendar grid ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {view === 'month' && (
              <MonthView
                meetings={meetings} year={anchor.getFullYear()} month={anchor.getMonth()}
                today={today} onDayClick={(d) => openCreate(d)} onMeetingClick={setDetailMeeting}
              />
            )}
            {view === 'week' && (
              <WeekView
                meetings={meetings} anchor={anchor} today={today}
                onSlotClick={(d, h) => openCreate(d, h)} onMeetingClick={setDetailMeeting}
              />
            )}
            {view === 'day' && (
              <DayView
                meetings={meetings} anchor={anchor} today={today}
                onSlotClick={(d, h) => openCreate(d, h)} onMeetingClick={setDetailMeeting}
              />
            )}
            {view === 'schedule' && (
              <ScheduleView meetings={meetings} onMeetingClick={setDetailMeeting} />
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modalOpen && (
        <MeetingModal initial={modalInitial} teamMembers={teamMembers} onSave={handleSave} onClose={() => setModalOpen(false)} />
      )}
      {detailMeeting && (
        <MeetingDetailModal
          meeting={detailMeeting} canManage={canManage}
          onClose={() => setDetailMeeting(null)} onEdit={() => openEdit(detailMeeting)}
          onDelete={() => handleDelete(detailMeeting)}
          isStarred={starredMeetingIds.has(detailMeeting.id)}
          onToggleStar={() => toggleStar(detailMeeting.id)}
        />
      )}
    </Layout>
  )
}
