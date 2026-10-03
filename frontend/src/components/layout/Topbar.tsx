import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../app/store/authStore'
import { useCurrentUser } from '../../features/auth/useCurrentUser'

export function Topbar() {
  const navigate = useNavigate()

  const logout = useAuthStore((state) => state.logout)

  const { data: user } = useCurrentUser()

  const fullName =
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .join(' ') ||
    user?.username ||
    'User'

  const handleLogout = () => {
    logout()

    navigate('/login', {
      replace: true,
    })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Page identity */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            University Portal
          </p>

          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            Welcome, {fullName}
          </h2>
        </div>

        {/* User controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 sm:flex"
            aria-label="Notifications"
          >
            🔔
          </button>

          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-slate-900">
              {fullName}
            </p>

            <p className="text-xs text-slate-500">
              {user?.roles?.join(' • ') || 'User'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}