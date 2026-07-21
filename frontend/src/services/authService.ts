import axios, { AxiosInstance } from 'axios'
import { LoginRequest, LoginResponse, AuthError } from '@/types'
import { config, storage, handleApiError } from '@/utils/config'

class AuthService {
  private api: AxiosInstance
  private readonly useMockAuth = process.env.NEXT_PUBLIC_USE_AUTH_MOCK === 'true'

  constructor() {
    this.api = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = storage.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Handle response errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          storage.removeToken()
          storage.removeUser()
          // Optionally redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * Login user with email and password
   * @param credentials - Email and password
   * @returns Promise with user data and token
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.api.post<LoginResponse>(
        '/auth/login',
        credentials
      )
      
      // Store token in localStorage
      if (response.data.token) {
        storage.setToken(response.data.token)
      }

      // Fetch the enriched profile (includes role + modules) and store it
      try {
        const meResponse = await this.api.get('/auth/me')
        storage.setUser(meResponse.data)
      } catch {
        // fallback to login response user if /me fails
        if (response.data.user) {
          storage.setUser(response.data.user)
        }
      }

      return response.data
    } catch (error) {
      const message = handleApiError(error)
      throw {
        message,
        code: 'LOGIN_ERROR'
      } as AuthError
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      storage.removeToken()
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      const response = await this.api.get('/auth/me')
      return response.data
    } catch (error) {
      throw {
        message: handleApiError(error),
        code: 'FETCH_USER_ERROR'
      } as AuthError
    }
  }

  /**
   * Register user via backend.
   */
  async register({ firstName, lastName, email, password, confirmPassword }: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string }): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/auth/register', { firstName, lastName, email, password, confirmPassword })
      return response.data
    } catch (error) {
      if (!this.useMockAuth) {
        throw {
          message: handleApiError(error),
          code: 'REGISTER_ERROR'
        } as AuthError
      }
    }

    if (this.useMockAuth && typeof window !== 'undefined') {
      const otp = String(Math.floor(100000 + Math.random() * 900000))
      const pending = { firstName, lastName, email, password, otp, createdAt: Date.now() }
      localStorage.setItem('pendingRegistration', JSON.stringify(pending))
      // For dev convenience, also store lastSentOtp (do NOT do this in production)
      localStorage.setItem('lastSentOtp', otp)
      console.info('Mock registration OTP (dev):', otp)
    }

    // simulate network latency
    await new Promise((res) => setTimeout(res, 700))

    return { message: 'OTP sent to your email (mock)' }
  }

  /**
   * Register an invited member directly (no OTP step).
   * Called when the user arrives via a team invite link.
   */
  async registerInvited({ firstName, lastName, email, password }: { firstName: string; lastName: string; email: string; password: string }): Promise<{ token: string; message: string }> {
    const response = await this.api.post<{ token: string; message: string }>(
      '/auth/register-invited',
      { firstName, lastName, email, password, confirmPassword: password },
    )
    if (response.data.token) {
      storage.setToken(response.data.token)
      try {
        const meResponse = await this.api.get('/auth/me')
        storage.setUser(meResponse.data)
      } catch { /* ignore */ }
    }
    return response.data
  }

  /**
   * Verify OTP for a pending registration.
   */
  async verifyOtp({ email, otp }: { email: string; otp: string }): Promise<{ token: string }> {
    try {
      const response = await this.api.post('/auth/verify-otp', { email, otp })
      if (response.data?.token) {
        storage.setToken(response.data.token)
        // Fetch enriched profile (firstName, lastName, role, modules) and persist it
        try {
          const meResponse = await this.api.get('/auth/me')
          storage.setUser(meResponse.data)
        } catch {
          if (response.data?.user) {
            storage.setUser(response.data.user)
          }
        }
      }
      return response.data
    } catch (error) {
      if (!this.useMockAuth) {
        throw {
          message: handleApiError(error),
          code: 'VERIFY_OTP_ERROR'
        } as AuthError
      }
    }

    if (typeof window === 'undefined') {
      throw { message: 'OTP verification unavailable on server' } as AuthError
    }

    const pendingRaw = localStorage.getItem('pendingRegistration')
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null
    const allowedOtp = pending?.otp || localStorage.getItem('lastSentOtp') || '123456'

    if (!pending || pending.email !== email) {
      throw { message: 'No pending registration found' } as AuthError
    }

    if (otp !== allowedOtp) {
      throw { message: 'Invalid OTP' } as AuthError
    }

    // on success create a fake token and persist
    const token = `mock-token.${btoa(email)}`
    storage.setToken(token)
    localStorage.removeItem('pendingRegistration')
    localStorage.removeItem('lastSentOtp')

    return { token }
  }

  /**
   * Resend OTP.
   */
  async resendOtp(email: string): Promise<{ message: string }> {
    try {
      const response = await this.api.post('/auth/resend-otp', { email })
      return response.data
    } catch (error) {
      if (!this.useMockAuth) {
        throw {
          message: handleApiError(error),
          code: 'RESEND_OTP_ERROR'
        } as AuthError
      }
    }

    if (typeof window === 'undefined') {
      throw { message: 'Unavailable' } as AuthError
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const pendingRaw = localStorage.getItem('pendingRegistration')
    const pending = pendingRaw ? JSON.parse(pendingRaw) : { email }
    const updated = { ...pending, email, otp, createdAt: Date.now() }
    localStorage.setItem('pendingRegistration', JSON.stringify(updated))
    localStorage.setItem('lastSentOtp', otp)
    await new Promise((res) => setTimeout(res, 400))
    console.info('Mock resend OTP (dev):', otp)
    return { message: 'OTP resent (mock)' }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!storage.getToken()
  }
}

// Export singleton instance
export const authService = new AuthService()
