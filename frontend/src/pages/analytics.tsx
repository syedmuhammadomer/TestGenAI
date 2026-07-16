'use client'

import React, { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { useProjectContext } from '@/context/ProjectContext'
import { BarChart2, AlertTriangle, CheckCircle2, Layers, TestTube, Users, ClipboardList, TrendingUp, ShieldAlert } from 'lucide-react'

type ProjectWithAI = ReturnType<typeof useProjectContext>['selectedProject'] & {
  aiResponse?: { analytics?: Record<string, unknown> }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { selectedProject, loading } = useProjectContext()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) router.push('/login')
  }, [router])

  const analytics = useMemo(() => {
    const ai = (selectedProject as ProjectWithAI)?.aiResponse
    return (ai?.analytics ?? null) as {
      totalFeatures?: number; totalUserStories?: number; totalTestCases?: number;
      totalRequirements?: number; coverageSummary?: string; riskAreas?: string | string[]
    } | null
  }, [selectedProject])

  const features = useMemo(() => selectedProject?.features ?? [], [selectedProject])
  const userStories = useMemo(() => selectedProject?.userStories ?? [], [selectedProject])
  const testCases = useMemo(() => selectedProject?.testCases ?? [], [selectedProject])
  const rtm = useMemo(() => selectedProject?.rtm ?? [], [selectedProject])

  const coveragePercent = useMemo(() => {
    const total = analytics?.totalRequirements || rtm.length || 1
    const covered = analytics?.totalTestCases || testCases.length
    return Math.min(100, Math.round((covered / total) * 100))
  }, [analytics, rtm, testCases])

  const riskAreas: string[] = useMemo(() => {
    const raw = analytics?.riskAreas
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    return [raw]
  }, [analytics])

  const kpis = [
    { label: 'Features', value: analytics?.totalFeatures ?? features.length, icon: Layers, color: 'bg-blue-500/20 text-blue-300', bar: 'bg-blue-500' },
    { label: 'User Stories', value: analytics?.totalUserStories ?? userStories.length, icon: Users, color: 'bg-purple-500/20 text-purple-300', bar: 'bg-purple-500' },
    { label: 'Test Cases', value: analytics?.totalTestCases ?? testCases.length, icon: TestTube, color: 'bg-emerald-500/20 text-emerald-300', bar: 'bg-emerald-500' },
    { label: 'Requirements', value: analytics?.totalRequirements ?? rtm.length, icon: ClipboardList, color: 'bg-orange-500/20 text-orange-300', bar: 'bg-orange-500' },
  ]

  const maxKpi = Math.max(...kpis.map(k => k.value), 1)

  return (
    <Layout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Analytics</p>
            <h1 className="text-2xl font-bold text-white mt-1">
              {selectedProject ? selectedProject.name : 'Project Analytics'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">AI-generated insights from your SRS document</p>
          </div>
          {selectedProject?.status === 'completed' && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/20 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Analysis Complete
            </span>
          )}
        </div>

        {/* No project selected */}
        {!loading && !selectedProject && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-12 text-center">
            <BarChart2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Select a completed project from the dropdown to view analytics.</p>
          </div>
        )}

        {selectedProject && selectedProject.status !== 'completed' && (
          <div className="rounded-xl border border-amber-700/40 bg-amber-900/20 p-4 text-amber-300 text-sm">
            Project is still {selectedProject.status}. Analytics will appear once AI processing completes.
          </div>
        )}

        {selectedProject?.status === 'completed' && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map(({ label, value, icon: Icon, color, bar }) => (
                <div key={label} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{label}</p>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`${bar} h-full rounded-full transition-all`} style={{ width: `${(value / maxKpi) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Coverage + Risk row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coverage */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-400" />
                  <h2 className="text-white font-semibold">Test Coverage</h2>
                </div>
                <div className="flex items-end gap-6">
                  <div>
                    <p className="text-5xl font-bold text-white">{coveragePercent}%</p>
                    <p className="text-slate-400 text-sm mt-1">Requirements covered by tests</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 via-emerald-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${coveragePercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0%</span><span>100%</span>
                    </div>
                  </div>
                </div>
                {analytics?.coverageSummary && (
                  <div className="mt-2 p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Summary</p>
                    <p className="text-sm text-slate-300">{analytics.coverageSummary}</p>
                  </div>
                )}
              </div>

              {/* Risk Areas */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h2 className="text-white font-semibold">Risk Areas</h2>
                </div>
                {riskAreas.length === 0 ? (
                  <p className="text-slate-500 text-sm">No risk areas identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {riskAreas.map((risk, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-900/20 border border-rose-800/40">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-rose-200">{risk}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Feature breakdown */}
            {features.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" /> Feature Breakdown
                </h2>
                <div className="space-y-3">
                  {features.map((f: { title: string; description?: string }, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-white font-medium">{f.title}</p>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${100 - i * (80 / Math.max(features.length, 1))}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User story vs test case table */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-400" /> Artifact Summary
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900">
                      <th className="text-left px-6 py-3 text-slate-400 font-semibold">Artifact</th>
                      <th className="text-right px-6 py-3 text-slate-400 font-semibold">Count</th>
                      <th className="text-right px-6 py-3 text-slate-400 font-semibold">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Features', count: features.length, color: 'text-blue-300' },
                      { label: 'User Stories', count: userStories.length, color: 'text-purple-300' },
                      { label: 'Test Cases', count: testCases.length, color: 'text-emerald-300' },
                      { label: 'RTM Entries', count: rtm.length, color: 'text-orange-300' },
                    ].map(({ label, count, color }, i) => {
                      const total = features.length + userStories.length + testCases.length + rtm.length || 1
                      return (
                        <tr key={label} className={i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/40'}>
                          <td className={`px-6 py-3 font-medium ${color}`}>{label}</td>
                          <td className="px-6 py-3 text-right text-white font-bold">{count}</td>
                          <td className="px-6 py-3 text-right text-slate-400">{Math.round((count / total) * 100)}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
