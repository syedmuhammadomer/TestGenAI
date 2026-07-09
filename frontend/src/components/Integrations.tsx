import React from 'react'
import { Zap, File, FileJson } from 'lucide-react'

export default function Integrations() {
  const integrations = [
    {
      icon: Zap,
      name: 'Jira Tickets',
      description: 'Pull requirements directly from Jira issues'
    },
    {
      icon: FileJson,
      name: 'Swagger API',
      description: 'Import OpenAPI specifications automatically'
    },
    {
      icon: File,
      name: 'User Stories',
      description: 'Upload markdown or PDF documentation'
    },
    {
      icon: Zap,
      name: 'PDF Specs',
      description: 'Extract requirements from PDF files'
    }
  ]

  const steps = [
    { num: '01', color: 'text-primary-600', title: 'Import Requirements', desc: 'Paste text, upload PDFs, or connect your Jira/Swagger documentation directly.' },
    { num: '02', color: 'text-accent', title: 'AI Analysis', desc: 'Our engine parses logic, identifies edge cases, and maps user flows instantly.' },
    { num: '03', color: 'text-emerald-500', title: 'Export & Sync', desc: 'Download as CSV/Excel or sync created test cases back to your management tool.' },
  ]

  return (
    <section className="py-24 px-6 lg:px-12 bg-surface">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-slate-900">Works with your existing docs</h2>
          <p className="text-slate-500 text-lg">Upload or connect your source of truth.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-20">
          {integrations.map((integration, idx) => {
            const Icon = integration.icon
            return (
              <div key={idx} className="px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-soft hover:shadow-card hover:border-slate-300 transition flex items-center gap-2">
                <Icon size={18} className="text-primary-600" />
                <span className="font-semibold text-sm text-slate-700">{integration.name}</span>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-16 text-slate-900">How it works</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-left">
                <div className="text-6xl font-extrabold text-slate-200 mb-4">{step.num}</div>
                <div className={`mb-4 ${step.color}`}>
                  <Zap size={32} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-bold mb-2 text-slate-900">{step.title}</h4>
                <p className="text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
