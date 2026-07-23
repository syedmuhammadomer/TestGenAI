// Role types — mirrors backend MemberRole enum
export type MemberRole =
  | 'company_admin'
  | 'pm'
  | 'qa_engineer'
  | 'developer'
  | 'designer'
  | 'ba'
  | 'viewer'

export type ModuleKey =
  | 'dashboard'
  | 'projects'
  | 'backlogs'
  | 'user_stories'
  | 'test_manager'
  | 'rtm'
  | 'documents'
  | 'analytics'
  | 'team'
  | 'settings'
  | 'billing'

// User types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  role?: MemberRole
  modules?: ModuleKey[]
  team?: string
  assignedProject?: string | null
  createdAt?: string
  companyName?: string
  jobTitle?: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export interface VerifyOtpRequest {
  email: string
  otp: string
}

export interface LoginResponse {
  user: User
  token: string
  message: string
}

export interface AuthError {
  message: string
  code?: string
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined
}

export interface FormTouched {
  [key: string]: boolean | undefined
}
