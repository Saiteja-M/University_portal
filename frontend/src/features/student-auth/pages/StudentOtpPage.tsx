import {
  useEffect,
  useState,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { useCompleteStudentRegistration } from '../hooks/useStudentAuth'

import type {
  RegistrationVerificationResult,
} from '../types'

interface RegistrationRouteState {
  registrationData?: RegistrationVerificationResult
}

export default function StudentOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const completeMutation =
    useCompleteStudentRegistration()

  const [registrationData, setRegistrationData] =
    useState<RegistrationVerificationResult | null>(null)

  const [loadingSession, setLoadingSession] =
    useState(true)

  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] =
    useState('')

  const [error, setError] = useState('')

  /*
   * Load the registration session.
   *
   * Priority:
   * 1. React Router state from the registration page
   * 2. sessionStorage fallback
   */
  useEffect(() => {
    try {
      const routeState =
        location.state as RegistrationRouteState | null

      const routeRegistrationData =
        routeState?.registrationData

      if (
        routeRegistrationData?.registration_token
      ) {
        setRegistrationData(
          routeRegistrationData,
        )

        /*
         * Also persist it so that refreshing the
         * OTP page does not lose the registration session.
         */
        sessionStorage.setItem(
          'student-registration',
          JSON.stringify(
            routeRegistrationData,
          ),
        )

        setLoadingSession(false)
        return
      }

      const stored =
        sessionStorage.getItem(
          'student-registration',
        )

      if (!stored) {
        setRegistrationData(null)
        setLoadingSession(false)
        return
      }

      const parsed =
        JSON.parse(stored) as RegistrationVerificationResult

      if (!parsed?.registration_token) {
        sessionStorage.removeItem(
          'student-registration',
        )

        setRegistrationData(null)
        setLoadingSession(false)
        return
      }

      setRegistrationData(parsed)
      setLoadingSession(false)
    } catch (sessionError) {
      console.error(
        'Failed to load student registration session:',
        sessionError,
      )

      sessionStorage.removeItem(
        'student-registration',
      )

      setRegistrationData(null)
      setLoadingSession(false)
    }
  }, [location.state])

  /*
   * Show loading while the registration session
   * is being loaded.
   *
   * This prevents the page from incorrectly showing
   * "Registration session expired" during the first render.
   */
  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Loading registration
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Preparing your OTP verification session...
          </p>
        </div>
      </div>
    )
  }

  /*
   * Only show the expired/session-missing screen
   * AFTER sessionStorage has actually been checked.
   */
  if (!registrationData?.registration_token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Registration session expired
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Your registration information is no longer
            available. Please start the registration
            process again.
          </p>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(
                'student-registration',
              )

              navigate('/student/register', {
                replace: true,
              })
            }}
            className="mt-7 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Start Registration Again
          </button>
        </div>
      </div>
    )
  }

  /*
   * Check the actual registration-token expiry.
   *
   * OTP expiry and registration-token expiry are
   * different things.
   */
  const registrationExpired =
    new Date(registrationData.expires_at).getTime() <=
    Date.now()

  const otpExpired =
    new Date(
      registrationData.otp_expires_at,
    ).getTime() <= Date.now()

  if (registrationExpired || otpExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            OTP session expired
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Your OTP verification window has expired.
            Please start the registration process again
            to receive a new verification code.
          </p>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(
                'student-registration',
              )

              navigate('/student/register', {
                replace: true,
              })
            }}
            className="mt-7 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Get New OTP
          </button>
        </div>
      </div>
    )
  }

 async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault()

  setError('')

  if (!registrationData?.registration_token) {
    setError(
      'Registration session has expired. Please start registration again.',
    )
    return
  }

  if (!/^\d{6}$/.test(otp)) {
    setError('Enter the 6-digit OTP.')
    return
  }

  if (password.length === 0) {
    setError('Please enter a password.')
    return
  }

  if (password !== passwordConfirm) {
    setError('Passwords do not match.')
    return
  }

  const registrationToken =
    registrationData.registration_token

  try {
    await completeMutation.mutateAsync({
      registration_token: registrationToken,
      otp,
      password,
      password_confirm: passwordConfirm,
    })

    sessionStorage.removeItem(
      'student-registration',
    )

   navigate('/student/login', {
  replace: true,
  state: {
    message:
      'Registration completed successfully. Please sign in.',
    studentId: registrationData.student_id,
  },
})
  } catch (error: any) {
    console.error(
      'Student registration completion failed:',
      error,
    )

    console.error(
      'Backend response:',
      error?.response?.data,
    )

    const response = error?.response?.data

    if (
      response &&
      typeof response === 'object' &&
      typeof response.detail === 'string'
    ) {
      setError(response.detail)
    } else {
      setError(
        'Registration could not be completed. Please check the OTP and try again.',
      )
    }
  }
}
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <p className="text-sm font-medium text-blue-600">
              University Portal
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Verify OTP
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Enter the 6-digit verification code sent
              to your registered email.
            </p>

            <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Student ID:{' '}
              <span className="font-semibold">
                {registrationData.student_id}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                OTP
              </label>

              <input
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 6),
                  )
                }
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                placeholder="Create your password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Confirm Password
              </label>

              <input
                type="password"
                value={passwordConfirm}
                onChange={(event) =>
                  setPasswordConfirm(
                    event.target.value,
                  )
                }
                autoComplete="new-password"
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                completeMutation.isPending
              }
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {completeMutation.isPending
                ? 'Creating account...'
                : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}