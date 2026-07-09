import axios from 'axios'
import { config, storage, handleApiError } from '@/utils/config'

export type ManagedUser = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'member'
  verified: boolean
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
