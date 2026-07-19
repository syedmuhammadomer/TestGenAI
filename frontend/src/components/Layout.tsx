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
  { name: 'Dashboard',        icon: Home,     href: '/dashboard',    module: 'dashboard'    },
  { name: 'Projects',         icon: FolderOpen, href: '/projects',   module: 'projects'     },
  { name: 'Backlogs',         icon: Kanban,   href: '/backlogs',     module: 'backlogs'     },
  { name: 'User Stories',     icon: Sparkles, href: '/user-stories', module: 'user_stories' },
  { name: 'Test Case Manager',icon: TestTube, href: '/test-manager', module: 'test_manager' },
  { name: 'RTM',              icon: Link,     href: '/rtm',          module: 'rtm'          },
  { name: 'Documents',        icon: File,     href: '/documents',    module: 'documents'    },
  { name: 'Analytics',        icon: BarChart, href: '/analytics',    module: 'analytics'    },
  { name: 'Team',             icon: Users,          href: '/team',     module: 'team'         },
  { name: 'Chat',             icon: MessageSquare,  href: '/chat',     module: 'team'         },
  { name: 'Settings',         icon: Settings,       href: '/settings', module: 'settings'     },
  { name: 'Billing',          icon: CreditCard, href: '/billing',    module: 'billing'      },
]

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { projects, selectedProjectId, setSelectedProjectId, loading: projectsLoading } = useProjectContext()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      setUser({ id: 'demo', firstName: 'Demo', lastName: 'User', email: 'user@example.com', role: 'company_admin' })
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          <div className="border-b border-slate-800 px-4 py-5">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white">TestGen AI</h1>
              </div>
            </div>
          </div>
          <div className="px-4 pt-4">
            <select
              value={selectedProjectId ?? ''}
              onChange={(event) => setSelectedProjectId(Number(event.target.value))}
              disabled={projectsLoading || projects.length === 0}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {projects.length === 0 ? (
                <option value="">{projectsLoading ? 'Loading projects...' : 'No projects yet'}</option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigationItems.filter((item) => canSeeModule(user, item.module)).map((item) => {
              const Icon = item.icon
              const current = router.pathname === item.href
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${current
                    ? 'bg-primary-600/15 text-primary-100'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] mr-3 shrink-0" />
                  {item.name}
                </a>
              )
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:ml-0 min-w-0">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-slate-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  className="text-slate-300 hover:text-white lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-semibold text-white ml-4 lg:ml-0 capitalize">{router.pathname.replace('/', '') || 'Dashboard'}</h2>
              </div>
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-300 hover:bg-slate-900 hover:text-white transition"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
