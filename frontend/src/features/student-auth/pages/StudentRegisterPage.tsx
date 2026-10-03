import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  useRegistrationOptions,
  useVerifyStudentRegistration,
} from '../hooks/useStudentAuth'

import type {
  RegistrationOptions,
  StudentRegistrationFormData,
} from '../types'

import { validateStudentRegistration } from '../validation'

export default function StudentRegisterPage() {
  const navigate = useNavigate()

  const { data: options, isLoading: optionsLoading } =
    useRegistrationOptions()

  const verifyMutation = useVerifyStudentRegistration()

  const [form, setForm] =
    useState<StudentRegistrationFormData>({
      username:'', 
      student_id: '',
       
        mobile_number: '',
        email: '',
        study_year: 1,
        program_id: 0,
        academic_year_id: 0,
    })

  const [errors, setErrors] = useState<
    ReturnType<typeof validateStudentRegistration>
  >({})

  const [serverError, setServerError] = useState('')

  const [termsAccepted, setTermsAccepted] = useState(false)

  const updateField = (
    field: keyof StudentRegistrationFormData,
    value: string | number,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setErrors(
      (
        current: ReturnType<typeof validateStudentRegistration>,
      ) => ({
        ...current,
        [field]: undefined,
      }),
    )

    setServerError('')
  }

  const getServerErrorMessage = (error: unknown): string => {
    const axiosError = error as {
      response?: {
        data?: unknown
      }
      message?: string
    }

    const data = axiosError.response?.data

    if (typeof data === 'string') {
      return data
    }

    if (data && typeof data === 'object') {
      const responseData = data as Record<string, unknown>

      if (typeof responseData.detail === 'string') {
        return responseData.detail
      }

      if (typeof responseData.message === 'string') {
        return responseData.message
      }

      if (typeof responseData.error === 'string') {
        return responseData.error
      }

      const fieldMessages: string[] = []

      Object.entries(responseData).forEach(
        ([field, value]) => {
          if (Array.isArray(value)) {
            value.forEach((message) => {
              if (typeof message === 'string') {
                fieldMessages.push(`${field}: ${message}`)
              }
            })
          } else if (typeof value === 'string') {
            fieldMessages.push(`${field}: ${value}`)
          }
        },
      )

      if (fieldMessages.length > 0) {
        return fieldMessages.join(' ')
      }
    }

    if (axiosError.message) {
      return axiosError.message
    }

    return 'Registration could not be completed. Please check your details and try again.'
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setServerError('')

    if (!termsAccepted) {
      setServerError(
        'Please accept the terms and conditions before continuing.',
      )
      return
    }

    const validationErrors =
      validateStudentRegistration(form)

    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setServerError(
        'Please correct the highlighted fields before continuing.',
      )
      return
    }

    try {
      const result =
        await verifyMutation.mutateAsync(form)

      sessionStorage.setItem(
        'student-registration',
        JSON.stringify({
          registration_token:
            result.registration_token,
          student_id: form.student_id,
          otp_expires_at:
            result.otp_expires_at,
          expires_at:
            result.expires_at,
        }),
      )

      navigate('/student/register/otp')
    } catch (error) {
      setServerError(getServerErrorMessage(error))
    }
  }

  const programs =
    options?.programs ?? []

  const academicYears =
    options?.academic_years ?? []

  const isSubmitting =
    verifyMutation.isPending

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Student Portal
            </p>

            <h1 className="text-2xl font-bold text-slate-900">
              Create your student account
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the details registered with the university.
              Your information will be verified before your
              account is created.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Username */}
<div>
  <label
    htmlFor="username"
    className="mb-2 block text-sm font-medium text-slate-700"
  >
    Username
  </label>

  <input
    id="username"
    type="text"
    value={form.username}
    onChange={(event) =>
      updateField(
        'username',
        event.target.value
          .toLowerCase()
          .replace(/\s/g, ''),
      )
    }
    placeholder="Choose your username"
    autoComplete="username"
    maxLength={30}
    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  />

  <p className="mt-1 text-xs text-slate-500">
    Use 4–30 characters: letters, numbers, dot, underscore or hyphen.
  </p>

  {errors.username && (
    <p className="mt-1 text-sm text-red-600">
      {errors.username}
    </p>
  )}
</div>
            {/* Student ID */}
            <div>
              <label
                htmlFor="student_id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Roll Number / Student ID
              </label>

              <input
                id="student_id"
                type="text"
                value={form.student_id}
                onChange={(event) =>
                  updateField(
                    'student_id',
                    event.target.value,
                  )
                }
                placeholder="Enter your roll number"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {errors.student_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.student_id}
                </p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label
                htmlFor="mobile_number"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Registered Mobile Number
              </label>

              <input
                id="mobile_number"
                type="tel"
                value={form.mobile_number}
                onChange={(event) =>
                  updateField(
                    'mobile_number',
                    event.target.value,
                  )
                }
                placeholder="Enter your registered mobile number"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {errors.mobile_number && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.mobile_number}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Registered Email
              </label>

              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    'email',
                    event.target.value,
                  )
                }
                placeholder="Enter your registered email"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Study Year */}
            <div>
              <label
                htmlFor="study_year"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Study Year
              </label>

              <select
                id="study_year"
                value={form.study_year}
                onChange={(event) =>
                  updateField(
                    'study_year',
                    Number(event.target.value),
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>

              {errors.study_year && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.study_year}
                </p>
              )}
            </div>

            {/* Program */}
            <div>
              <label
                htmlFor="program_id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Programme / Branch
              </label>

              <select
                id="program_id"
                value={form.program_id}
                disabled={optionsLoading}
                onChange={(event) =>
                  updateField(
                    'program_id',
                    Number(event.target.value),
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value={0}>
                  {optionsLoading
                    ? 'Loading programmes...'
                    : 'Select your programme'}
                </option>

                {programs.map(
                  (program: RegistrationOptions['programs'][number]) => (
                    <option
                      key={program.id}
                      value={program.id}
                    >
                      {program.name}
                    </option>
                  ),
                )}
              </select>

              {errors.program_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.program_id}
                </p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label
                htmlFor="academic_year_id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Academic Year
              </label>

              <select
                id="academic_year_id"
                value={form.academic_year_id}
                disabled={optionsLoading}
                onChange={(event) =>
                  updateField(
                    'academic_year_id',
                    Number(event.target.value),
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value={0}>
                  {optionsLoading
                    ? 'Loading academic years...'
                    : 'Select academic year'}
                </option>

                {academicYears.map(
                  (
                    academicYear: RegistrationOptions['academic_years'][number],
                  ) => (
                    <option
                      key={academicYear.id}
                      value={academicYear.id}
                    >
                      {academicYear.name}
                    </option>
                  ),
                )}
              </select>

              {errors.academic_year_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.academic_year_id}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
              <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => {
                  setTermsAccepted(
                    event.target.checked,
                  )
                  setServerError('')
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />

              <label
                htmlFor="terms"
                className="text-sm leading-6 text-slate-600"
              >
                I confirm that the information provided
                above matches my official university records.
              </label>
            </div>

            {/* Continue */}
            <button
              type="submit"
              disabled={isSubmitting || optionsLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Verifying...'
                : 'Continue'}
            </button>

            {/* Server Error */}
            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <p className="font-semibold text-red-800">
                  Registration could not be completed
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {serverError}
                </p>
              </div>
            )}

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/student/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}