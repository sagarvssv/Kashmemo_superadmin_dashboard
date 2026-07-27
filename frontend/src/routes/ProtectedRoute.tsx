import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth()

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader2 className="size-6 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}
