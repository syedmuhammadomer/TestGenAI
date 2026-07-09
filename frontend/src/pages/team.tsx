'use client'

import React from 'react'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import { Shield, Activity } from 'lucide-react'

type TeamMember = {
  id: number
  name: string
  email: string
  role: string
  testCases: number
  lastActive: string
  status: 'online' | 'offline'
}

const members: TeamMember[] = [
  { id: 1, name: 'Dana Holloway', email: 'dana@project.ai', role: 'QA Lead', testCases: 312, lastActive: '2 mins ago', status: 'online' },
  { id: 2, name: 'Marcus Li', email: 'marcus@project.ai', role: 'QA Engineer', testCases: 198, lastActive: '12 mins ago', status: 'online' },
  { id: 3, name: 'Priya Singh', email: 'priya@project.ai', role: 'Automation Engineer', testCases: 176, lastActive: '1 hour ago', status: 'offline' },
  { id: 4, name: 'Jamal Ortiz', email: 'jamal@project.ai', role: 'Product Specialist', testCases: 89, lastActive: '3 hours ago', status: 'offline' },
  { id: 5, name: 'Ayla Bennett', email: 'ayla@project.ai', role: 'QA Reviewer', testCases: 143, lastActive: 'Last night', status: 'offline' },
]

const activity = [
  { id: 1, actor: 'Dana Holloway', action: 'pushed 12 regression tests to Banking App', time: '2 minutes ago' },
  { id: 2, actor: 'Marcus Li', action: 'validated automation pipeline for Healthcare', time: '40 minutes ago' },
  { id: 3, actor: 'Priya Singh', action: 'shared coverage report for Inventory portal', time: '2 hours ago' },
  { id: 4, actor: 'Jamal Ortiz', action: 'added new stakeholder to project Slack channel', time: '4 hours ago' },
]

const roles = [
  { name: 'Admin', desc: 'Full visibility, billing control, and project configuration rights.' },
  { name: 'QA Lead', desc: 'Organize sprints, approve requirements, and oversee quality metrics.' },
  { name: 'QA Engineer', desc: 'Create/edit user stories, author test plans, and execute suites.' },
  { name: 'Automation', desc: 'Ship scripts, schedule jobs, and monitor pipeline health.' },
]

export default function TeamPage() {
  const totalMembers = members.length
  const activeNow = members.filter((member) => member.status === 'online').length
  const avgTestCases = Math.round(members.reduce((total, member) => total + member.testCases, 0) / totalMembers)

  return (
    <Layout>
      <div className="p-6 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Team Operations</p>
            <h1 className="text-3xl font-semibold text-slate-900">Team Management</h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Keep a pulse on your QA unit—who is online, what they are working on, and the role-level permissions that define coverage.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="md">Export CSV</Button>
            <Button size="md">Invite Member</Button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Total Members</p>
            <p className="text-3xl font-semibold text-slate-900">{totalMembers}</p>
            <p className="text-sm text-slate-500">Currently in the workspace</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Active Now</p>
            <p className="text-3xl font-semibold text-emerald-600">{activeNow}</p>
            <p className="text-sm text-slate-500">Responding to requests</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Avg. Test Cases</p>
            <p className="text-3xl font-semibold text-primary-600">{avgTestCases}</p>
            <p className="text-sm text-slate-500">Per team member weekly average</p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Members</h2>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                Active {activeNow}
              </div>
            </div>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-soft">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] uppercase tracking-[0.4em] text-slate-600">
                      {member.role}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{member.testCases}</p>
                      <p className="text-xs text-slate-400">{member.lastActive}</p>
                    </div>
                    <span
                      className={`h-3 w-3 rounded-full ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Recent Activity</p>
                  <h3 className="text-lg font-semibold text-slate-900">What the team is doing</h3>
                </div>
                <Activity className="h-5 w-5 text-primary-600" />
              </header>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {activity.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 bg-white/70 p-3">
                    <p className="text-slate-900">
                      <span className="font-semibold">{item.actor}</span> {item.action}
                    </p>
                    <p className="text-xs text-slate-400">{item.time}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <header className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-900">Role permissions</h3>
              </header>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {roles.map((role) => (
                  <div key={role.name} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{role.name}</p>
                    <p className="text-xs text-slate-500">{role.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
