import React, { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  User, Settings, Zap,
  Home, FolderOpen, Sparkles, TestTube, Link, File, BarChart, Users, CreditCard,
  Menu, Kanban, LogOut, Sun, Moon, MessageSquare
} from 'lucide-react'
import { useProjectContext } from '@/context/ProjectContext'
import { useTheme } from '@/context/ThemeContext'
import { canSeeModule } from '@/utils/access'
import { ModuleKey, User as UserType } from '@/types'

interface NavigationItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  module: ModuleKey
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard',        icon: Home,          href: '/dashboard',    module: 'dashboard'    },
  { name: 'Projects',         icon: FolderOpen,    href: '/projects',     module: 'projects'     },
  { name: 'Backlogs',         icon: Kanban,        href: '/backlogs',     module: 'backlogs'     },
  { name: 'User Stories',     icon: Sparkles,      href: '/user-stories', module: 'user_stories' },
  { name: 'Test Case Manager',icon: TestTube,      href: '/test-manager', module: 'test_manager' },
  { name: 'RTM',              icon: Link,          href: '/rtm',          module: 'rtm'          },
  { name: 'Documents',        icon: File,          href: '/documents',    module: 'documents'    },
  { name: 'Analytics',        icon: BarChart,      href: '/analytics',    module: 'analytics'    },
  { name: 'Team',             icon: Users,         href: '/team',         module: 'team'         },
  { name: 'Chat',             icon: MessageSquare, href: '/chat',         module: 'team'         },
  { name: 'Settings',         icon: Settings,      href: '/settings',     module: 'settings'     },
  { name: 'Billing',          icon: CreditCard,    href: '/billing',      module: 'billing'      },
]

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(() => {
    if (typeof window === 'undefined') return null
    const userData = localStorage.getItem('userData')
    if (userData) {
      try { return JSON.parse(userData) } catch { /* ignore */ }
    }
    return { id: 'demo', firstName: 'Demo', lastName: 'User', email: 'user@example.com', role: 'company_admin' as const }
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { projects, selectedProjectId, setSelectedProjectId, loading: projectsLoading } = useProjectContext()
  const { theme, toggleTheme } = useTheme()

  // Keep user in sync with localStorage across page navigations
  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      try { setUser(JSON.parse(userData)) } catch { /* ignore */ }
    }
  }, [router.pathname])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    router.push('/')
  }

  const isDark = theme === 'dark'

  return (
    <div className="min-h-screen bg-surface flex relative overflow-hidden">

      {/* ── Decorative atmospheric blurs (buyer-bridge style) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="blur-spot blur-spot-teal w-[500px] h-[500px] -top-40 -left-40" />
        <div className="blur-spot blur-spot-teal-dim w-[700px] h-[700px] top-1/2 -right-60" />
        <div className="blur-spot blur-spot-teal w-[300px] h-[300px] bottom-10 left-1/3 opacity-10" />
      </div>

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        border-r transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDark
          ? 'bg-zinc-950/95 border-zinc-800 backdrop-blur-xl'
          : 'bg-white/95 border-zinc-200 backdrop-blur-xl shadow-lg'}
      `}>

        {/* Logo */}
        <div className={`border-b px-4 py-5 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center shrink-0 shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white dark:text-white" style={{ color: isDark ? '#fafafa' : '#09090b' }}>TestGen AI</h1>
            </div>
          </div>
        </div>

        {/* Project selector */}
        <div className="px-4 pt-4">
          <select
            value={selectedProjectId ?? ''}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            disabled={projectsLoading || projects.length === 0}
            className={`
              w-full rounded-xl border px-3 py-2 text-xs font-medium shadow-sm
              focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
              disabled:cursor-not-allowed disabled:opacity-60
              transition-all duration-200
              ${isDark
                ? 'border-zinc-700 bg-zinc-900 text-zinc-100'
                : 'border-zinc-300 bg-zinc-50 text-zinc-900'}
            `}
          >
            {projects.length === 0 ? (
              <option value="">{projectsLoading ? 'Loading projects…' : 'No projects yet'}</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navigationItems.filter((item) => canSeeModule(user, item.module)).map((item) => {
            const Icon = item.icon
            const current = router.pathname === item.href
            return (
              <a
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl
                  transition-all duration-200 ease-out
                  ${current
                    ? isDark
                      ? 'bg-primary-500/15 text-primary-300 border border-primary-500/25 shadow-sm'
                      : 'bg-primary-50 text-primary-700 border border-primary-200'
                    : isDark
                      ? 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white border border-transparent hover:border-zinc-700/50'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'}
                `}
              >
                <Icon className={`
                  w-[18px] h-[18px] mr-3 shrink-0 transition-all duration-200
                  ${current
                    ? 'text-primary-400'
                    : isDark
                      ? 'text-zinc-500 group-hover:text-primary-400'
                      : 'text-zinc-400 group-hover:text-primary-500'}
                `} />
                {item.name}
                {current && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                )}
              </a>
            )
          })}
        </nav>

        {/* User profile */}
        <div className={`p-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-950/80' : 'border-zinc-200 bg-white/80'}`}>
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-2 ring-primary-500/30 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <User className={`w-4 h-4 ${isDark ? 'text-zinc-300' : 'text-zinc-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className={`rounded-lg p-2 transition-all duration-200 ${isDark ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900'}`}
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-0 min-w-0 flex flex-col relative z-10">

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Top bar */}
        <header className={`
          sticky top-0 z-40 border-b backdrop-blur-xl
          transition-colors duration-300
          ${isDark
            ? 'bg-zinc-950/80 border-zinc-800'
            : 'bg-white/80 border-zinc-200 shadow-sm'}
        `}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button
                  className={`lg:hidden transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className={`text-base font-semibold capitalize ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  {router.pathname.replace('/', '') || 'Dashboard'}
                </h2>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`
                  relative rounded-xl p-2.5 transition-all duration-300
                  ${isDark
                    ? 'text-zinc-400 hover:bg-zinc-800 hover:text-primary-400'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-primary-600'}
                `}
                aria-label="Toggle theme"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <div className={`transition-all duration-300 ${isDark ? 'rotate-0' : 'rotate-180'}`}>
                  {isDark
                    ? <Sun className="w-5 h-5" />
                    : <Moon className="w-5 h-5" />
                  }
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-page-in">
          {children}
        </main>
      </div>
    </div>
  )
}
