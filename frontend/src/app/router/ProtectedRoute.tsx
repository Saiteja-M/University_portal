import type { ReactNode } from 'react'
import {
  Navigate,
  useLocation,
} from 'react-router-dom'

import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const token = useAuthStore(
    (state) => state.token,
  )

  const location = useLocation()

  if (!token) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location.pathname,
        }}
      />
    )
  }

  return <>{children}</>
}