import axios from 'axios'
import { config, handleApiError } from '@/utils/config'

export type UserStoryInput = {
  actor?: string
  goal: string
  benefit?: string
  acceptanceCriteria?: string
}

export const userStoryService = {
  async create(projectId: number, input: UserStoryInput) {
    try {
      const response = await axios.post(`${config.endpoints.projects}/${projectId}/user-stories`, input)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async update(projectId: number, storyId: number, input: Partial<UserStoryInput>) {
    try {
      const response = await axios.patch(`${config.endpoints.projects}/${projectId}/user-stories/${storyId}`, input)
      return response.data
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },

  async remove(projectId: number, storyId: number) {
    try {
      await axios.delete(`${config.endpoints.projects}/${projectId}/user-stories/${storyId}`)
    } catch (error) {
      throw new Error(handleApiError(error))
    }
  },
}
