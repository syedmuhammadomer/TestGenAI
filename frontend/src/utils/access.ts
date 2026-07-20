import { MemberRole, ModuleKey, User } from '@/types'

export const ALL_MODULES: ModuleKey[] = [
  'dashboard', 'projects', 'backlogs', 'user_stories',
  'test_manager', 'rtm', 'documents', 'analytics',
  'team', 'settings', 'billing',
]

export const DEFAULT_MODULES_BY_ROLE: Record<MemberRole, ModuleKey[]> = {
  company_admin: [...ALL_MODULES],
  pm:          ['dashboard', 'projects', 'backlogs', 'user_stories', 'test_manager', 'rtm', 'documents', 'analytics', 'team', 'settings'],
  qa_engineer: ['dashboard', 'projects', 'backlogs', 'test_manager', 'rtm', 'analytics', 'settings'],
  developer:   ['dashboard', 'projects', 'backlogs', 'user_stories', 'settings'],
  designer:    ['dashboard', 'projects', 'documents', 'settings'],
  ba:          ['dashboard', 'projects', 'user_stories', 'rtm', 'documents', 'analytics', 'settings'],
  viewer:      ['dashboard', 'projects', 'settings'],
}

export const ROLE_LABELS: Record<MemberRole, string> = {
  company_admin: 'Company Admin',
  pm:            'Project Manager',
  qa_engineer:   'QA Engineer',
  developer:     'Developer',
  designer:      'Designer',
  ba:            'Business Analyst',
  viewer:        'Viewer',
}

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard:    'Dashboard',
  projects:     'Projects',
  backlogs:     'Backlogs',
  user_stories: 'User Stories',
  test_manager: 'Test Case Manager',
  rtm:          'RTM',
  documents:    'Documents',
  analytics:    'Analytics',
  team:         'Team',
  settings:     'Settings',
  billing:      'Billing',
}

/** Returns which modules the user can see based on their modules array or role fallback */
export function getUserModules(user: User | null): ModuleKey[] {
  if (!user) return ['dashboard']
  if (user.modules && user.modules.length > 0) return user.modules
  if (user.role) return DEFAULT_MODULES_BY_ROLE[user.role] ?? ALL_MODULES
  // Authenticated user with unknown role — show everything (backend enforces real access)
  return ALL_MODULES
}

/** True if the user can see a specific module in the nav */
export function canSeeModule(user: User | null, module: ModuleKey): boolean {
  return getUserModules(user).includes(module)
}

/** Map a nav href to its module key */
export const ROUTE_MODULE_MAP: Record<string, ModuleKey> = {
  '/dashboard':    'dashboard',
  '/projects':     'projects',
  '/backlogs':     'backlogs',
  '/user-stories': 'user_stories',
  '/test-manager': 'test_manager',
  '/rtm':          'rtm',
  '/documents':    'documents',
  '/analytics':    'analytics',
  '/team':         'team',
  '/settings':     'settings',
  '/billing':      'billing',
}
