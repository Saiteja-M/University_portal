import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useCurrentUser } from '../../features/auth/useCurrentUser'
import { ProtectedRoute } from '../../app/router/ProtectedRoute'

interface RoleRouteProps {
  children: ReactNode
  allowedRoles: string[]
  fallbackPath?: string
}

export function RoleRoute({
  children,
  allowedRoles,
  fallbackPath = '/',
}: RoleRouteProps) {
  const {
    data: user,
    isLoading,
    isError,
  } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading your account...
        </p>
      </div>
    )
  }

  if (isError || !user) {
    return <Navigate to="/" replace />
  }

  const isSuperuserAdmin =
    user.is_superuser &&
    allowedRoles.includes('ADMIN')

  const hasAllowedRole =
    user.roles.some((role) =>
      allowedRoles.includes(role),
    )

  if (!isSuperuserAdmin && !hasAllowedRole) {
    return (
      <Navigate
        to={fallbackPath}
        replace
      />
    )
  }

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}