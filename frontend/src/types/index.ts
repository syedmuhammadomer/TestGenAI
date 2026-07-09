// User types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  role?: string
  team?: string
  assignedProject?: string | null
  accessPreset?: string
  permissions?: string[]
  createdAt?: string
  firstName?: string
  lastName?: string
  role?: 'admin' | 'member'
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
