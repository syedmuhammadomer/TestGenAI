import React from 'react'
import { FileText, Shield, GitBranch, RotateCw } from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: FileText,
      title: 'Test Case Generation',
      description: 'Automatically convert requirements into detailed step-by-step test cases with expected results.'
    },
    {
      icon: Shield,
      title: 'Edge Case Discovery',
      description: 'AI identifies boundary values and negative scenarios you might miss.'
    },
    {
      icon: GitBranch,
      title: 'Test Scenarios',
      description: 'High-level end-to-end user flows mapped directly from user stories.'
    },
    {
      icon: RotateCw,
      title: 'Regression Checklists',
      description: 'Smart impact analysis creates focused regression suites for code changes.'
    }
  ]

  return (
    <section className="py-24 px-6 lg:px-12 bg-surface-alt">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Everything you need for <span className="gradient-text">Quality Assurance</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Stop writing manual test cases. Let our AI analyze your documentation and generate comprehensive coverage in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-primary-700/20 text-primary-200 flex items-center justify-center mb-5">
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
