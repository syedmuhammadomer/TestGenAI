import axios from 'axios'
import { config } from '@/utils/config'
import { MemberRole, ModuleKey } from '@/types'

export type TeamMemberStatus = 'online' | 'offline' | 'invited'

export type TeamMemberRecord = {
  id: number
  fullName: string
  email: string
  role: MemberRole
  team?: string
  project?: string
  testCases: number
  modules: ModuleKey[]
  sendCopy: boolean
  addWelcomeNote: boolean
  status: TeamMemberStatus
  lastActive?: string
}

export type TeamActivityRecord = {
  id: number
  actor: string
  action: string
  timeLabel: string
}

export type TeamDashboardResponse = {
  stats: {
    totalMembers: number
    activeNow: number
    avgTestCases: number
  }
  members: TeamMemberRecord[]
  activity: TeamActivityRecord[]
}

export type InviteTeamMemberPayload = {
  fullName: string
  email: string
  role: MemberRole
  team?: string
  project?: string
  modules?: ModuleKey[]
  sendCopy?: boolean
  addWelcomeNote?: boolean
}

const authHeader = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const teamService = {
  async getDashboard(): Promise<TeamDashboardResponse> {
    const { data } = await axios.get<TeamDashboardResponse>(`${config.apiBaseUrl}/api/team`, {
      headers: authHeader(),
    })
    return data
  },

  async inviteMember(payload: InviteTeamMemberPayload): Promise<TeamMemberRecord> {
    const { data } = await axios.post<TeamMemberRecord>(`${config.apiBaseUrl}/api/team/invite`, payload, {
      headers: authHeader(),
    })
    return data
  },

  async updateMember(memberId: number, payload: Partial<InviteTeamMemberPayload>): Promise<TeamMemberRecord> {
    const { data } = await axios.patch<TeamMemberRecord>(`${config.apiBaseUrl}/api/team/members/${memberId}`, payload, {
      headers: authHeader(),
    })
    return data
  },

  async deleteMember(memberId: number): Promise<void> {
    await axios.delete(`${config.apiBaseUrl}/api/team/members/${memberId}`, {
      headers: authHeader(),
    })
  },
}
