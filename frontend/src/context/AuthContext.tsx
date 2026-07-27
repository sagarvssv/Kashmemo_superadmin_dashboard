import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { IndustryType, Plan } from '../lib/constants'

export interface SessionUser {
  organizationId: string
  userId: string
  name: string
  email: string
  role: string
  status: string
  isEmailVerified: boolean
}

export interface OrgProfile {
  companyName: string
  industryType: IndustryType
  country: string
  plan: Plan
}

const SESSION_KEY = 'kashmemo.session'
const PROFILE_KEY_PREFIX = 'kashmemo.orgProfile.'

interface AuthContextValue {
  user: SessionUser | null
  orgProfile: OrgProfile | null
  isReady: boolean
  setSession: (user: SessionUser) => void
  saveOrgProfile: (organizationId: string, profile: OrgProfile) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [orgProfile, setOrgProfile] = useState<OrgProfile | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) {
        const parsed: SessionUser = JSON.parse(raw)
        setUser(parsed)
        const profileRaw = localStorage.getItem(PROFILE_KEY_PREFIX + parsed.organizationId)
        if (profileRaw) setOrgProfile(JSON.parse(profileRaw))
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    } finally {
      setIsReady(true)
    }
  }, [])

  const setSession = (nextUser: SessionUser) => {
    setUser(nextUser)
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser))
    const profileRaw = localStorage.getItem(PROFILE_KEY_PREFIX + nextUser.organizationId)
    setOrgProfile(profileRaw ? JSON.parse(profileRaw) : null)
  }

  const saveOrgProfile = (organizationId: string, profile: OrgProfile) => {
    localStorage.setItem(PROFILE_KEY_PREFIX + organizationId, JSON.stringify(profile))
    setOrgProfile(profile)
  }

  const logout = () => {
    setUser(null)
    setOrgProfile(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const value = useMemo(
    () => ({ user, orgProfile, isReady, setSession, saveOrgProfile, logout }),
    [user, orgProfile, isReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
