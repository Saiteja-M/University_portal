import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useAuthStore } from '../../app/store/authStore'
import { login } from './auth.service'
import { getCurrentUser } from './user.service'

type PortalType =
  | 'ADMIN'
  | 'HOD'
  | 'FACULTY'
  | 'STUDENT'

interface PortalLoginPageProps {
  portal: PortalType
}

interface LoginLocationState {
  message?: string
  studentId?: string
}

const PORTAL_CONFIG = {
  ADMIN: {
    title: 'Administration Login',
    subtitle:
      'University administration portal',
    button: 'Sign in as Administrator',
    dashboard: '/admin/dashboard',
    allowedRoles: ['ADMIN'],
  },

  HOD: {
    title: 'HOD Login',
    subtitle: 'Academic management portal',
    button: 'Sign in as HOD',
    dashboard: '/academics',
    allowedRoles: ['HOD'],
  },

  FACULTY: {
    title: 'Faculty Login',
    subtitle:
      'Faculty and teaching portal',
    button: 'Sign in as Faculty',
    dashboard: '/faculty/dashboard',
    allowedRoles: ['FACULTY'],
  },

  STUDENT: {
    title: 'Student Login',
    subtitle:
      'Student academic portal',
    button: 'Sign in as Student',
    dashboard: '/student/dashboard',
    allowedRoles: ['STUDENT'],
  },
} as const

export function PortalLoginPage({
  portal,
}: PortalLoginPageProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const setAuth = useAuthStore(
    (state) => state.setAuth,
  )

  const logout = useAuthStore(
    (state) => state.logout,
  )

  const config = PORTAL_CONFIG[portal]

  const locationState =
    location.state as LoginLocationState | null

  const [username, setUsername] = useState(
    locationState?.studentId ?? '',
  )

  const [password, setPassword] =
    useState('')

  const [isLoading, setIsLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const successMessage =
    locationState?.message ?? ''

  useEffect(() => {
    if (
      locationState?.message ||
      locationState?.studentId
    ) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname,
      )
    }
  }, [
    locationState?.message,
    locationState?.studentId,
  ])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const identifier =
      username.trim()

    if (!identifier || !password) {
      setError(
        portal === 'STUDENT'
          ? 'Please enter your Student ID and password.'
          : 'Please enter your username and password.',
      )
      return
    }

    setIsLoading(true)

    try {
      /*
       * 1. Authenticate credentials
       */
      let response

      try {
        response = await login({
          username: identifier,
          password,
        })
      } catch (error: any) {
        console.error(
          'LOGIN REQUEST FAILED:',
          error,
        )

        console.error(
          'LOGIN RESPONSE:',
          error?.response?.data,
        )

        const status =
          error?.response?.status

        const detail =
          error?.response?.data?.detail

        if (status === 400) {
          setError(
            portal === 'STUDENT'
              ? 'Invalid Student ID or password.'
              : 'Invalid username or password.',
          )
        } else if (status === 403) {
          setError(
            detail ||
              'Your account is not authorized to sign in.',
          )
        } else if (!status) {
          setError(
            'Cannot connect to the university server. Please make sure the backend is running.',
          )
        } else {
          setError(
            detail ||
              'Login could not be completed.',
          )
        }

        return
      }

      console.log(
        'LOGIN SUCCESS:',
        response,
      )

      /*
       * 2. Save authentication token
       */
      setAuth(
        response.token,
        response.username,
        response.user_id,
      )

      /*
       * 3. Verify current user
       */
      let user

      try {
        user = await getCurrentUser()

        console.log(
          'CURRENT USER:',
          user,
        )
      } catch (error: any) {
        console.error(
          'AUTH/ME FAILED:',
          error,
        )

        console.error(
          'AUTH/ME RESPONSE:',
          error?.response?.data,
        )

        logout()

        const status =
          error?.response?.status

        if (status === 401) {
          setError(
            'Login succeeded, but the authentication session could not be verified.',
          )
        } else if (status === 403) {
          setError(
            'Your account is not authorized to access the student portal.',
          )
        } else {
          setError(
            'Login succeeded, but the student account could not be verified.',
          )
        }

        return
      }

      /*
       * 4. Check role
       */
      const isAdmin =
        portal === 'ADMIN' &&
        (user.is_superuser ||
          user.roles.includes('ADMIN'))

      const hasRequiredRole =
        user.roles.some((role) =>
          config.allowedRoles.includes(
            role as never,
          ),
        )

      if (
        !isAdmin &&
        !hasRequiredRole
      ) {
        logout()

        setError(
          `Your account is not authorized for the ${portal.toLowerCase()} portal.`,
        )

        return
      }

      /*
       * 5. Successful login
       */
      console.log(
        'PORTAL LOGIN VERIFIED:',
        portal,
      )

      navigate(config.dashboard, {
        replace: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isStudent =
    portal === 'STUDENT'

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full">

          <div className="mb-10 text-center">
            <Link
              to="/"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              ← University Portal
            </Link>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold">
              {config.title}
            </h1>

            <p className="mt-3 text-slate-400">
              {config.subtitle}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-9 shadow-2xl">

            {successMessage && (
              <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
                {successMessage}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-6"
            >

              <div>
                <label
                  htmlFor="portal-identifier"
                  className="block text-sm font-semibold text-slate-200"
                >
                  {isStudent
                    ? 'Student ID'
                    : 'Username'}
                </label>

                <input
                  id="portal-identifier"
                  name={
                    isStudent
                      ? 'student-id'
                      : 'username'
                  }
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value,
                    )
                  }
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  placeholder={
                    isStudent
                      ? 'Enter your Student ID'
                      : 'Enter your username'
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />

                {isStudent && (
                  <p className="mt-2 text-xs text-slate-500">
                    Use the Student ID provided by
                    the university.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="portal-password"
                    className="text-sm font-semibold text-slate-200"
                  >
                    Password
                  </label>
                </div>

                <input
                  id="portal-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-white px-4 py-4 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'Signing in...'
                  : config.button}
              </button>
            </form>
          </div>

          {isStudent && (
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                New student?{' '}
                <Link
                  to="/student/register"
                  className="font-semibold text-blue-400 hover:text-blue-300"
                >
                  Create an account
                </Link>
              </p>
            </div>
          )}

          <p className="mt-10 text-center text-xs text-slate-600">
            Secure university authentication
          </p>
        </div>
      </div>
    </main>
  )
}