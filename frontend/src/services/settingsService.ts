import axios from 'axios'
import { config, storage, handleApiError } from '@/utils/config'

export type ManagedUser = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'member'
  verified: boolean
  companyName?: string
  jobTitle?: string
}

export type UpdateProfilePayload = {
  firstName?: string
  lastName?: string
  companyName?: string
  jobTitle?: string
}

const authHeaders = () => {
  const token = storage.getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const settingsService = {
  async getMe(): Promise<ManagedUser> {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/auth/me`, { headers: authHeaders() })
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async listUsers(): Promise<ManagedUser[]> {
    try {
      const response = await axios.get(`${config.apiBaseUrl}/auth/users`, { headers: authHeaders() })
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<ManagedUser> {
    try {
      const response = await axios.patch(`${config.apiBaseUrl}/auth/profile`, payload, { headers: authHeaders() })
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await axios.patch(
        `${config.apiBaseUrl}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: authHeaders() }
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async updateUserRole(id: number, role: 'admin' | 'member'): Promise<ManagedUser> {
    try {
      const response = await axios.patch(
        `${config.apiBaseUrl}/auth/users/${id}/role`,
        { role },
        { headers: authHeaders() }
      )
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
}
