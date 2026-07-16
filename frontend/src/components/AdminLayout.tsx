'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Shield, LayoutDashboard, Building2, CreditCard, Cpu, Activity,
  Users, FileText, Megaphone, LogOut, Menu, X, ChevronRight
} from 'lucide-react'

const navItems = [
  { label: 'Overview',      href: '/admin',               icon: LayoutDashboard },
  { label: 'Companies',     href: '/admin/companies',      icon: Building2 },
  { label: 'Plans',         href: '/admin/plans',          icon: CreditCard },
  { label: 'AI Usage',      href: '/admin/ai-usage',       icon: Cpu },
  { label: 'Job Queue',     href: '/admin/jobs',           icon: Activity },
  { label: 'Platform Users',href: '/admin/users',          icon: Users },
  { label: 'Audit Log',     href: '/admin/audit',          icon: FileText },
  { label: 'Announcements', href: '/admin/announcements',  icon: Megaphone },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [adminName, setAdminName] = useState('Super Admin')

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken')
    if (!token) { router.push('/admin/login'); return }
    const stored = localStorage.getItem('adminUser')
    if (stored) {
      try { const u = JSON.parse(stored); setAdminName(`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Super Admin') } catch { /* ignore */ }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#0d0d16] border-r border-white/5 flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">TestGen AI</p>
            <p className="text-red-400 text-[10px] uppercase tracking-widest font-semibold">Super Admin</p>
          </div>
          <button className="ml-auto text-slate-500 hover:text-white lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = router.pathname === href || (href !== '/admin' && router.pathname.startsWith(href))
            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-red-600/15 text-red-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-red-500" />}
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-900/40 border border-red-800/40 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <p className="text-[10px] text-red-400 uppercase tracking-wider">Super Admin</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition" title="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur border-b border-white/5 px-6 h-14 flex items-center gap-4">
          <button className="text-slate-400 hover:text-white lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <nav className="text-xs text-slate-500 flex items-center gap-1">
            <span className="text-red-400">Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-300 capitalize">{router.pathname.replace('/admin/', '').replace('/admin', 'Overview') || 'Overview'}</span>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> System Online
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
