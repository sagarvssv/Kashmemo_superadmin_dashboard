import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IndustryType, Plan } from '../lib/constants'

export interface SessionUser {
  organizationId: string
  userId: string
  name: string
  email: string
  role: string
  status: string
  isEmailVerified: boolean
  companyName: string
  plan: Plan
  departmentId?: string | null
}

export interface OrgProfile {
  industryType: IndustryType
  country: string
}

interface AuthState {
  user: SessionUser | null
  orgProfile: OrgProfile | null
  setSession: (user: SessionUser) => void
  saveOrgProfile: (organizationId: string, profile: OrgProfile) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      orgProfile: null,
      setSession: (user) => set({ user }),
      saveOrgProfile: (_organizationId, profile) => set({ orgProfile: profile }),
      clearAuth: () => set({ user: null, orgProfile: null }),
    }),
    { name: 'kashmemo-auth' },
  ),
)
