import React from 'react'
import { Play, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from './Button'

export default function Hero() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  }
  const child = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.45 } }
  }
  return (
    <section className="py-24 px-6 lg:px-12 bg-surface relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] opacity-40"
        style={{ background: 'radial-gradient(600px circle at 50% 0%, rgba(124,58,237,0.12), transparent 70%)' }}
      />
      <div className="container mx-auto relative">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-block mb-6 px-4 py-1.5 bg-primary-50 border border-primary-100 rounded-full">
            <span className="text-primary-700 text-sm font-semibold">● AI-POWERED QA</span>
          </div>

          <motion.h1
            className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-slate-900"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
          >
            <motion.span variants={child} className="inline-block mr-2">Generate</motion.span>
            <motion.span variants={child} className="inline-block mr-2">Comprehensive</motion.span>
            <motion.span variants={child} className="gradient-text inline-block">Test Cases in Seconds</motion.span>
          </motion.h1>

          <p className="text-slate-500 max-w-2xl mb-8 text-lg">
            Turn requirements, user stories, and API specs into production-ready test scenarios, edge cases, and regression checklists automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button variant="primary" size="lg" className="gap-2">
              Start Generating Free <ArrowRight size={20} />
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Play size={20} /> Watch Demo
            </Button>
          </div>
        </div>

        {/* Demo Box */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-elevated">
            {/* Browser Chrome */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <span className="ml-4 text-slate-400 text-xs">📄 input_requirements.pdf</span>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-2 p-8 gap-8">
              {/* Left Side - Input */}
              <div>
                <div className="text-slate-400 text-xs mb-4 font-mono">{'// User Story: Authentication'}</div>
                <div className="text-slate-400 text-sm leading-relaxed font-mono">
                  <div className="mb-2">As a user, I want to be able to</div>
                  <div className="mb-2">log in with my email and</div>
                  <div className="mb-4">password so that I can access my</div>
                  <div className="mb-2">dashboard.</div>
                  <div className="mt-6 text-slate-400">{'// Acceptance Criteria'}</div>
                  <div className="mt-4">
                    <div>1. User enters valid email/password.</div>
                    <div>2. System validates credentials.</div>
                    <div>3. If valid, redirect to dashboard.</div>
                    <div>4. If invalid, show error message.</div>
                  </div>
                </div>
              </div>

              {/* Right Side - Output */}
              <div>
                <div className="text-primary-600 text-xs font-semibold mb-4">GENERATED OUTPUT</div>
                <div className="text-slate-600 text-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                      <span className="text-emerald-500 text-xs">✓</span>
                    </div>
                    <span className="font-semibold text-slate-900">TC_001: Valid Login</span>
                  </div>
                  <div className="text-slate-500 text-xs ml-7 mb-4">
                    Verify user can login with valid credentials and redirect to dashboard.
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                      <span className="text-amber-500 text-xs">⚠</span>
                    </div>
                    <span className="font-semibold text-white">TC_002: Invalid Password</span>
                  </div>
                  <div className="text-slate-500 text-xs ml-7 mb-4">
                    Verify error message &quot;Invalid credentials&quot; appears on wrong password.
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      <span className="text-blue-500 text-xs">📋</span>
                    </div>
                    <span className="font-semibold text-white">TC_003: SQL Injection Attempt</span>
                  </div>
                  <div className="text-slate-500 text-xs ml-7 mb-4">
                    Verify input fields sanitize special characters and prevent injection.
                  </div>

                  <div className="text-primary-600 text-xs mt-6 font-medium">+ View 12 more generated cases</div>
                </div>

                <div className="text-slate-400 text-xs mt-6 text-right">Processing complete (0.4s)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
