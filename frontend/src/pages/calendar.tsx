'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { config } from '@/utils/config'
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, List,
  MapPin, Plus, Search, Trash2, Users, Video, X, Edit2, Grid3x3,
  AlertCircle, Check, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────
type EventType =
  | 'sprint_planning' | 'daily_standup' | 'sprint_review'
  | 'sprint_retrospective' | 'client_meeting' | 'qa_review'
  | 'release_planning' | 'custom'

type Priority = 'urgent' | 'high' | 'medium' | 'low'
type MeetingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled' | 'missed'
type CalView = 'month' | 'week' | 'day' | 'agenda'
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
  sprint_planning:     { label: 'Sprint Planning',     color: '#3b82f6', bg: 'bg-blue-600',    light: 'bg-blue-500/15 text-blue-300 border-blue-700/40' },
  daily_standup:       { label: 'Daily Standup',       color: '#10b981', bg: 'bg-emerald-600', light: 'bg-emerald-500/15 text-emerald-300 border-emerald-700/40' },
  sprint_review:       { label: 'Sprint Review',       color: '#8b5cf6', bg: 'bg-violet-600',  light: 'bg-violet-500/15 text-violet-300 border-violet-700/40' },
  sprint_retrospective:{ label: 'Retrospective',       color: '#7c3aed', bg: 'bg-purple-700',  light: 'bg-purple-500/15 text-purple-300 border-purple-700/40' },
  client_meeting:      { label: 'Client Meeting',      color: '#f97316', bg: 'bg-orange-600',  light: 'bg-orange-500/15 text-orange-300 border-orange-700/40' },
  qa_review:           { label: 'QA Review',           color: '#06b6d4', bg: 'bg-cyan-600',    light: 'bg-cyan-500/15 text-cyan-300 border-cyan-700/40' },
  release_planning:    { label: 'Release Planning',    color: '#f59e0b', bg: 'bg-amber-600',   light: 'bg-amber-500/15 text-amber-300 border-amber-700/40' },
  custom:              { label: 'Custom Event',        color: '#14b8a6', bg: 'bg-teal-600',    light: 'bg-teal-500/15 text-teal-300 border-teal-700/40' },
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
  urgent: { label: 'Urgent',  style: 'bg-rose-500/15 text-rose-300 border-rose-700/40' },
  high:   { label: 'High',    style: 'bg-orange-500/15 text-orange-300 border-orange-700/40' },
  medium: { label: 'Medium',  style: 'bg-amber-500/15 text-amber-300 border-amber-700/40' },
  low:    { label: 'Low',     style: 'bg-slate-700/40 text-slate-400 border-slate-600' },
}

const STATUS_CONFIG: Record<MeetingStatus, { label: string; style: string }> = {
  upcoming:    { label: 'Upcoming',    style: 'bg-blue-500/15 text-blue-300 border-blue-700/40' },
  in_progress: { label: 'In Progress', style: 'bg-emerald-500/15 text-emerald-300 border-emerald-700/40' },
  completed:   { label: 'Completed',   style: 'bg-slate-700/40 text-slate-400 border-slate-600' },
  cancelled:   { label: 'Cancelled',   style: 'bg-rose-500/15 text-rose-300 border-rose-700/40' },
  missed:      { label: 'Missed',      style: 'bg-orange-500/15 text-orange-300 border-orange-700/40' },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ─── Date helpers ─────────────────────────────────────────────────────────────
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function fmtTime(dt: string) {
  const d = new Date(dt)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function fmtDateShort(d: Date) {
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
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
  for (let i = 0; i < first.getDay(); i++) {
    days.push(new Date(year, month, 1 - first.getDay() + i))
  }
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) {
    days.push(new Date(year, month + 1, days.length - last.getDate() - first.getDay() + 1))
  }
  return days
}

function getWeekDays(anchor: Date): Date[] {
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - anchor.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d
  })
}

function meetingsForDay(meetings: Meeting[], day: Date) {
  return meetings.filter((m) => sameDay(new Date(m.startDatetime), day))
}

// ─── Meeting chip ─────────────────────────────────────────────────────────────
function MeetingChip({ meeting, compact = false, onClick }: {
  meeting: Meeting; compact?: boolean; onClick: () => void
}) {
  const cfg = EVENT_TYPES[meeting.type] ?? EVENT_TYPES.custom
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded truncate transition-all hover:brightness-110 active:scale-95 ${
        meeting.status === 'cancelled' ? 'opacity-40 line-through' : ''
      }`}
      style={{ backgroundColor: cfg.color + '28', color: cfg.color, borderLeft: `2px solid ${cfg.color}` }}
      title={`${meeting.title} · ${fmtTime(meeting.startDatetime)}`}
    >
      {!compact && <span className="mr-1 opacity-70">{fmtTime(meeting.startDatetime)}</span>}
      {meeting.title}
    </button>
  )
}

// ─── Month view ───────────────────────────────────────────────────────────────
function MonthView({ meetings, year, month, today, onDayClick, onMeetingClick }: {
  meetings: Meeting[]
  year: number; month: number; today: Date
  onDayClick: (d: Date) => void
  onMeetingClick: (m: Meeting) => void
}) {
  const grid = getMonthGrid(year, month)
  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-800">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7 flex-1">
        {grid.map((day, i) => {
          const isThisMonth = day.getMonth() === month
          const isToday = sameDay(day, today)
          const dayMeetings = meetingsForDay(meetings, day)
          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={`min-h-[110px] p-1.5 border-b border-r border-slate-800/60 cursor-pointer transition-colors hover:bg-slate-900/50 ${
                !isThisMonth ? 'opacity-35' : ''
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-colors ${
                isToday
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayMeetings.slice(0, 3).map((m) => (
                  <MeetingChip key={m.id} meeting={m} onClick={() => onMeetingClick(m)} />
                ))}
                {dayMeetings.length > 3 && (
                  <p className="text-[10px] text-slate-500 pl-1.5">+{dayMeetings.length - 3} more</p>
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
  onSlotClick: (d: Date, hour: number) => void
  onMeetingClick: (m: Meeting) => void
}) {
  const days = getWeekDays(anchor)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return (
    <div className="flex-1 overflow-auto">
      {/* Header row */}
      <div className="sticky top-0 z-10 grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-800 bg-slate-950">
        <div className="py-3" />
        {days.map((day, i) => {
          const isToday = sameDay(day, today)
          return (
            <div key={i} className="py-3 text-center border-l border-slate-800/60">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{DAYS[day.getDay()]}</p>
              <p className={`text-lg font-bold mt-0.5 mx-auto w-9 h-9 rounded-full flex items-center justify-center ${
                isToday ? 'bg-primary-500 text-white' : 'text-slate-200'
              }`}>{day.getDate()}</p>
            </div>
          )
        })}
      </div>
      {/* Time slots */}
      {hours.map((h) => (
        <div key={h} className="grid grid-cols-[56px_repeat(7,1fr)] min-h-[60px]">
          <div className="text-[10px] text-slate-600 px-2 pt-1 text-right tabular-nums select-none">
            {h === 0 ? '' : `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`}
          </div>
          {days.map((day, di) => {
            const slotMeetings = meetings.filter((m) => {
              const s = new Date(m.startDatetime)
              return sameDay(s, day) && s.getHours() === h
            })
            return (
              <div
                key={di}
                onClick={() => onSlotClick(day, h)}
                className="border-l border-t border-slate-800/40 hover:bg-slate-900/30 transition-colors cursor-pointer relative p-0.5 space-y-0.5"
              >
                {slotMeetings.map((m) => (
                  <MeetingChip key={m.id} meeting={m} onClick={() => onMeetingClick(m)} />
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Day view ─────────────────────────────────────────────────────────────────
function DayView({ meetings, anchor, today, onSlotClick, onMeetingClick }: {
  meetings: Meeting[]; anchor: Date; today: Date
  onSlotClick: (d: Date, hour: number) => void
  onMeetingClick: (m: Meeting) => void
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const isToday = sameDay(anchor, today)
  return (
    <div className="flex-1 overflow-auto">
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950 px-6 py-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{DAYS[anchor.getDay()]}</p>
        <p className={`text-2xl font-bold ${isToday ? 'text-primary-400' : 'text-white'}`}>
          {MONTHS[anchor.getMonth()]} {anchor.getDate()}, {anchor.getFullYear()}
          {isToday && <span className="ml-3 text-sm font-normal text-primary-400">Today</span>}
        </p>
      </div>
      <div>
        {hours.map((h) => {
          const slotMeetings = meetings.filter((m) => {
            const s = new Date(m.startDatetime)
            return sameDay(s, anchor) && s.getHours() === h
          })
          return (
            <div
              key={h}
              onClick={() => onSlotClick(anchor, h)}
              className="flex gap-4 border-t border-slate-800/40 min-h-[64px] hover:bg-slate-900/20 cursor-pointer transition-colors px-4 py-2"
            >
              <div className="w-14 text-right text-xs text-slate-600 pt-0.5 shrink-0 tabular-nums select-none">
                {h === 0 ? '' : `${h % 12 || 12}:00 ${h < 12 ? 'am' : 'pm'}`}
              </div>
              <div className="flex-1 space-y-1">
                {slotMeetings.map((m) => {
                  const cfg = EVENT_TYPES[m.type] ?? EVENT_TYPES.custom
                  const duration = Math.round((new Date(m.endDatetime).getTime() - new Date(m.startDatetime).getTime()) / 60000)
                  return (
                    <button
                      key={m.id}
                      onClick={(e) => { e.stopPropagation(); onMeetingClick(m) }}
                      className="w-full text-left rounded-xl px-3 py-2 transition-all hover:brightness-110"
                      style={{ backgroundColor: cfg.color + '22', borderLeft: `3px solid ${cfg.color}` }}
                    >
                      <p className="text-sm font-semibold" style={{ color: cfg.color }}>{m.title}</p>
                      <p className="text-xs text-slate-400">{fmtTime(m.startDatetime)} · {duration}m{m.location ? ` · ${m.location}` : ''}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Agenda view ──────────────────────────────────────────────────────────────
function AgendaView({ meetings, onMeetingClick }: {
  meetings: Meeting[]; onMeetingClick: (m: Meeting) => void
}) {
  const upcoming = [...meetings]
    .filter((m) => m.status !== 'cancelled')
    .sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())

  // Group by date
  const groups: Record<string, Meeting[]> = {}
  for (const m of upcoming) {
    const key = new Date(m.startDatetime).toDateString()
    ;(groups[key] = groups[key] ?? []).push(m)
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        <CalendarDays className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-slate-400 font-medium">No upcoming meetings</p>
        <p className="text-slate-600 text-sm mt-1">Click &ldquo;New Meeting&rdquo; to schedule one</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      {Object.entries(groups).map(([dateStr, dayMeetings]) => {
        const d = new Date(dateStr)
        const isToday = sameDay(d, new Date())
        return (
          <div key={dateStr}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                isToday ? 'bg-primary-500/20 border border-primary-500/40' : 'bg-slate-900 border border-slate-800'
              }`}>
                <span className={`text-[10px] font-semibold uppercase ${isToday ? 'text-primary-400' : 'text-slate-500'}`}>
                  {DAYS[d.getDay()]}
                </span>
                <span className={`text-lg font-bold leading-none ${isToday ? 'text-primary-300' : 'text-slate-200'}`}>
                  {d.getDate()}
                </span>
              </div>
              <div>
                <p className={`text-sm font-semibold ${isToday ? 'text-primary-300' : 'text-slate-300'}`}>
                  {isToday ? 'Today' : MONTHS[d.getMonth()] + ' ' + d.getDate()}
                </p>
                <p className="text-xs text-slate-500">{dayMeetings.length} meeting{dayMeetings.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="ml-15 pl-4 space-y-2 border-l border-slate-800">
              {dayMeetings.map((m) => {
                const cfg = EVENT_TYPES[m.type] ?? EVENT_TYPES.custom
                const duration = Math.round((new Date(m.endDatetime).getTime() - new Date(m.startDatetime).getTime()) / 60000)
                return (
                  <button
                    key={m.id}
                    onClick={() => onMeetingClick(m)}
                    className="w-full text-left bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 hover:bg-slate-900/60 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: cfg.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white group-hover:text-primary-300 transition-colors">{m.title}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.light}`}>{cfg.label}</span>
                          {m.status !== 'upcoming' && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_CONFIG[m.status]?.style}`}>
                              {STATUS_CONFIG[m.status]?.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(m.startDatetime)} – {fmtTime(m.endDatetime)} ({duration}m)</span>
                          {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                          {m.participants.length > 0 && (
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{m.participants.length}</span>
                          )}
                        </div>
                      </div>
                      {m.meetingLink && (
                        <a
                          href={m.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-primary-600/20 text-primary-300 border border-primary-600/30 hover:bg-primary-600/30 transition-colors"
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
function MeetingDetailModal({ meeting, onClose, onEdit, onDelete, canManage }: {
  meeting: Meeting; onClose: () => void
  onEdit: () => void; onDelete: () => void
  canManage: boolean
}) {
  const cfg = EVENT_TYPES[meeting.type] ?? EVENT_TYPES.custom
  const duration = Math.round((new Date(meeting.endDatetime).getTime() - new Date(meeting.startDatetime).getTime()) / 60000)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Colour header bar */}
        <div className="h-1 w-full" style={{ backgroundColor: cfg.color }} />

        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-slate-800">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.light}`}>{cfg.label}</span>
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CONFIG[meeting.status]?.style}`}>
                {STATUS_CONFIG[meeting.status]?.label}
              </span>
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${PRIORITY_CONFIG[meeting.priority]?.style}`}>
                {PRIORITY_CONFIG[meeting.priority]?.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">{meeting.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <>
                <button onClick={onEdit} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={onDelete} className="p-2 rounded-lg text-slate-400 hover:bg-rose-900/40 hover:text-rose-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[60vh] overflow-y-auto">
          <div className="px-6 py-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Date & Time</p>
              <p className="text-sm text-slate-200">{fmtDate(meeting.startDatetime)}</p>
              <p className="text-sm text-slate-400">{fmtTime(meeting.startDatetime)} – {fmtTime(meeting.endDatetime)} <span className="text-slate-600">({duration}m)</span></p>
            </div>
            {meeting.location && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Location</p>
                <p className="text-sm text-slate-200 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" />{meeting.location}</p>
              </div>
            )}
          </div>

          {meeting.description && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{meeting.description}</p>
            </div>
          )}

          {meeting.meetingLink && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Meeting Link</p>
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary-300 hover:text-primary-200 transition-colors"
              >
                <Video className="w-4 h-4" /> Join meeting <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {meeting.participants.length > 0 && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Participants ({meeting.participants.length})</p>
              <div className="space-y-2">
                {meeting.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-600/20 text-primary-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {(p.userName ?? p.userEmail ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{p.userName ?? p.userEmail ?? `User #${p.userId}`}</p>
                      {p.userEmail && p.userName && <p className="text-xs text-slate-500 truncate">{p.userEmail}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      p.attendanceStatus === 'present' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-700/40'
                      : p.attendanceStatus === 'late' ? 'bg-amber-500/15 text-amber-300 border-amber-700/40'
                      : p.attendanceStatus === 'absent' ? 'bg-rose-500/15 text-rose-300 border-rose-700/40'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>{p.attendanceStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meeting.notes && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Notes</p>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{meeting.notes}</p>
            </div>
          )}
        </div>

        {meeting.meetingLink && (
          <div className="px-6 py-4 border-t border-slate-800">
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-600/30 transition-all text-sm font-semibold"
            >
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
  startDatetime: '', endDatetime: '',
  timezone: 'UTC', meetingLink: '', location: '',
  priority: 'medium' as Priority, repeatType: 'none' as RepeatType,
  reminderMinutes: 15, notes: '',
  projectId: '' as string | number, sprintId: '',
  participantIds: [] as number[],
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

  const set = (field: keyof typeof EMPTY_FORM, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const toggleParticipant = (id: number) => {
    setForm((prev) => ({
      ...prev,
      participantIds: prev.participantIds.includes(id)
        ? prev.participantIds.filter((x) => x !== id)
        : [...prev.participantIds, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Meeting title is required'); return }
    if (!form.startDatetime) { setError('Start date/time is required'); return }
    if (!form.endDatetime) { setError('End date/time is required'); return }
    if (new Date(form.endDatetime) <= new Date(form.startDatetime)) {
      setError('End time must be after start time'); return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ ...form, id: initial?.id })
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Failed to save meeting')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/40 transition-all'
  const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-white">{initial?.id ? 'Edit Meeting' : 'New Meeting'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className={labelCls}>Meeting Title *</label>
            <input className={inputCls} placeholder="e.g. Sprint 12 Planning" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Meeting Type</label>
              <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value as EventType)}>
                {(Object.entries(EVENT_TYPES) as [EventType, { label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select className={inputCls} value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
                {(Object.entries(PRIORITY_CONFIG) as [Priority, { label: string }][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Start + End */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date & Time *</label>
              <input type="datetime-local" className={inputCls} value={form.startDatetime} onChange={(e) => set('startDatetime', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>End Date & Time *</label>
              <input type="datetime-local" className={inputCls} value={form.endDatetime} onChange={(e) => set('endDatetime', e.target.value)} />
            </div>
          </div>

          {/* Location + Link */}
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

          {/* Sprint + Repeat */}
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

          {/* Reminder */}
          <div>
            <label className={labelCls}>Reminder</label>
            <select className={inputCls} value={form.reminderMinutes} onChange={(e) => set('reminderMinutes', Number(e.target.value))}>
              {REMINDER_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              placeholder="Meeting agenda, goals, etc."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Invite members */}
          {teamMembers.length > 0 && (
            <div>
              <label className={labelCls}>Invite Members</label>
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-slate-700 bg-slate-900 p-2">
                {teamMembers.map((m) => {
                  const selected = form.participantIds.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleParticipant(m.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                        selected ? 'bg-primary-600/20 text-primary-300' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                        selected ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {selected ? <Check className="w-3 h-3" /> : m.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{m.email}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className={`${inputCls} min-h-[60px] resize-y`}
              placeholder="Additional notes..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-300 text-sm bg-rose-900/20 border border-rose-800/40 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
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

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<CalView>('month')
  const [anchor, setAnchor] = useState(new Date())
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<EventType | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitial, setModalInitial] = useState<Partial<typeof EMPTY_FORM> & { id?: number }>({})
  const [detailMeeting, setDetailMeeting] = useState<Meeting | null>(null)
  const [userRole, setUserRole] = useState<string>('viewer')
  const userId = useRef<number>(0)

  const canManage = ['company_admin', 'pm'].includes(userRole)

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  const loadMeetings = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await axios.get<Meeting[]>(`${config.apiBaseUrl}/api/calendar/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMeetings(data)
    } catch {
      // noop — graceful degradation
    }
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

    // Load team members for invite selector
    axios.get(`${config.apiBaseUrl}/api/team`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        const members: TeamMember[] = (data.members ?? []).map((m: { id: number; fullName: string; email: string; role: string }) => ({
          id: m.id, fullName: m.fullName, email: m.email, role: m.role,
        }))
        setTeamMembers(members)
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
      return `${fmtDateShort(days[0])} – ${fmtDateShort(days[6])}, ${days[0].getFullYear()}`
    }
    if (view === 'day') return `${MONTHS[anchor.getMonth()]} ${anchor.getDate()}, ${anchor.getFullYear()}`
    return 'Upcoming'
  }

  // Filtered meetings
  const visibleMeetings = meetings.filter((m) => {
    if (typeFilter && m.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
    }
    return true
  })

  const openCreate = (day?: Date, hour?: number) => {
    if (!canManage) return
    const start = day ? new Date(day) : new Date()
    if (hour !== undefined) { start.setHours(hour, 0, 0, 0) } else { start.setMinutes(0, 0, 0) }
    const end = new Date(start)
    end.setHours(start.getHours() + 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setModalInitial({ startDatetime: fmt(start), endDatetime: fmt(end) })
    setModalOpen(true)
  }

  const openEdit = (meeting: Meeting) => {
    const members = meeting.participants.map((p) => p.userId)
    setModalInitial({
      id: meeting.id,
      title: meeting.title,
      description: meeting.description ?? '',
      type: meeting.type as EventType,
      startDatetime: toLocalDatetimeInput(meeting.startDatetime),
      endDatetime: toLocalDatetimeInput(meeting.endDatetime),
      timezone: meeting.timezone,
      meetingLink: meeting.meetingLink ?? '',
      location: meeting.location ?? '',
      priority: meeting.priority as Priority,
      repeatType: (meeting.repeatType ?? 'none') as RepeatType,
      reminderMinutes: meeting.reminderMinutes ?? 15,
      notes: meeting.notes ?? '',
      sprintId: meeting.sprintId ?? '',
      participantIds: members,
    })
    setDetailMeeting(null)
    setModalOpen(true)
  }

  const handleSave = async (data: typeof EMPTY_FORM & { id?: number }) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      startDatetime: new Date(data.startDatetime).toISOString(),
      endDatetime: new Date(data.endDatetime).toISOString(),
      timezone: data.timezone,
      meetingLink: data.meetingLink || undefined,
      location: data.location || undefined,
      priority: data.priority,
      repeatType: data.repeatType !== 'none' ? data.repeatType : undefined,
      reminderMinutes: data.reminderMinutes,
      notes: data.notes || undefined,
      sprintId: data.sprintId || undefined,
      participants: data.participantIds.map((uid) => {
        const member = teamMembers.find((m) => m.id === uid)
        return { userId: uid, userEmail: member?.email, userName: member?.fullName }
      }),
    }

    if (data.id) {
      await axios.patch(`${config.apiBaseUrl}/api/calendar/meetings/${data.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('Meeting updated')
    } else {
      await axios.post(`${config.apiBaseUrl}/api/calendar/meetings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('Meeting created')
    }
    setModalOpen(false)
    await loadMeetings()
  }

  const handleDelete = async (meeting: Meeting) => {
    if (!window.confirm(`Delete "${meeting.title}"?`)) return
    await axios.delete(`${config.apiBaseUrl}/api/calendar/meetings/${meeting.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    toast.success('Meeting deleted')
    setDetailMeeting(null)
    await loadMeetings()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-primary-400">Loading calendar…</div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-2rem)] -mt-4 -mx-4 sm:-mx-6 bg-slate-950">
        {/* ── Top bar ── */}
        <div className="shrink-0 flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={goBack} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setAnchor(new Date())} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors border border-slate-700">Today</button>
            <button onClick={goForward} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>

          <h2 className="text-base font-semibold text-white flex-1 truncate">{headerLabel()}</h2>

          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-primary-500 w-40 focus:w-56 transition-all"
              placeholder="Search meetings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type filter */}
          <select
            className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-primary-500 hidden sm:block"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EventType | '')}
          >
            <option value="">All types</option>
            {(Object.entries(EVENT_TYPES) as [EventType, { label: string }][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          {/* View switcher */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {([['month', Grid3x3], ['week', CalendarDays], ['day', Clock], ['agenda', List]] as [CalView, React.ComponentType<{ className?: string }>][]).map(([v, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                title={v.charAt(0).toUpperCase() + v.slice(1)}
                className={`p-1.5 rounded-md transition-all ${view === v ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* New meeting */}
          {canManage && (
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Meeting
            </button>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-2 border-b border-slate-800/50 overflow-x-auto">
          {(Object.entries(EVENT_TYPES) as [EventType, { label: string; color: string }][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setTypeFilter(typeFilter === k ? '' : k)}
              className={`flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap transition-opacity ${typeFilter && typeFilter !== k ? 'opacity-30' : ''}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
              {v.label}
            </button>
          ))}
        </div>

        {/* ── Calendar body ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {view === 'month' && (
            <MonthView
              meetings={visibleMeetings}
              year={anchor.getFullYear()}
              month={anchor.getMonth()}
              today={today}
              onDayClick={(d) => openCreate(d)}
              onMeetingClick={setDetailMeeting}
            />
          )}
          {view === 'week' && (
            <WeekView
              meetings={visibleMeetings}
              anchor={anchor}
              today={today}
              onSlotClick={(d, h) => openCreate(d, h)}
              onMeetingClick={setDetailMeeting}
            />
          )}
          {view === 'day' && (
            <DayView
              meetings={visibleMeetings}
              anchor={anchor}
              today={today}
              onSlotClick={(d, h) => openCreate(d, h)}
              onMeetingClick={setDetailMeeting}
            />
          )}
          {view === 'agenda' && (
            <AgendaView meetings={visibleMeetings} onMeetingClick={setDetailMeeting} />
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {modalOpen && (
        <MeetingModal
          initial={modalInitial}
          teamMembers={teamMembers}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {detailMeeting && (
        <MeetingDetailModal
          meeting={detailMeeting}
          canManage={canManage}
          onClose={() => setDetailMeeting(null)}
          onEdit={() => openEdit(detailMeeting)}
          onDelete={() => handleDelete(detailMeeting)}
        />
      )}
    </Layout>
  )
}
