import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useCurrentUser } from '../../features/auth/useCurrentUser'
import { ProtectedRoute } from '../../app/router/ProtectedRoute'
interface RoleRouteProps {
  children: ReactNode
  allowedRoles: string[]
}

export function RoleRoute({
  children,
  allowedRoles,
}: RoleRouteProps) {
  const {
    data: user,
    isLoading,
    isError,
  } = useCurrentUser()

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-slate-500">
            Loading your account...
          </p>
        </div>
      ) : isError || !user ? (
        <Navigate
          to="/login"
          replace
        />
      ) : user.roles.some((role) =>
          allowedRoles.includes(role),
        ) ? (
        children
      ) : (
        <Navigate
          to="/dashboard"
          replace
        />
      )}
    </ProtectedRoute>
  )
}