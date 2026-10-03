import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useDepartments } from '../../academics/hooks'
import { useCreateFaculty } from '../hooks'

import type {
  EmploymentStatus,
  FacultyCreateData,
} from '../types'

const employmentTypes = [
  {
    value: 'PERMANENT',
    label: 'Permanent',
  },
  {
    value: 'CONTRACT',
    label: 'Contract',
  },
  {
    value: 'GUEST',
    label: 'Guest',
  },
  {
    value: 'VISITING',
    label: 'Visiting',
  },
] as const

const employmentStatuses: {
  value: EmploymentStatus
  label: string
}[] = [
  {
    value: 'ACTIVE',
    label: 'Active',
  },
  {
    value: 'INACTIVE',
    label: 'Inactive',
  },
  {
    value: 'ON_LEAVE',
    label: 'On Leave',
  },
  {
    value: 'RETIRED',
    label: 'Retired',
  },
  {
    value: 'RESIGNED',
    label: 'Resigned',
  },
]

export default function FacultyCreatePage() {
  const navigate = useNavigate()

  const createFaculty = useCreateFaculty()

  const {
    data: departmentResponse,
    isLoading: departmentsLoading,
    isError: departmentsError,
  } = useDepartments({
    is_active: true,
  })

  const departments = departmentResponse?.results ?? []

  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    department: '',
    designation: '',
    joiningDate: '',
    employmentType:
      'PERMANENT' as
        | 'PERMANENT'
        | 'CONTRACT'
        | 'GUEST'
        | 'VISITING',
    employmentStatus: 'ACTIVE' as EmploymentStatus,
  })

  const [errorMessage, setErrorMessage] = useState('')

  const updateField = (
    field: keyof typeof form,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setErrorMessage('')

    if (!form.username.trim()) {
      setErrorMessage('Please enter a username.')
      return
    }

    if (!form.firstName.trim()) {
      setErrorMessage('Please enter the faculty first name.')
      return
    }

    if (!form.password) {
      setErrorMessage('Please enter a password.')
      return
    }

    if (form.password.length < 8) {
      setErrorMessage(
        'Password must contain at least 8 characters.',
      )
      return
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage(
        'Password and confirm password do not match.',
      )
      return
    }

    if (!form.employeeId.trim()) {
      setErrorMessage('Please enter the employee ID.')
      return
    }

    if (!form.department) {
      setErrorMessage('Please select a department.')
      return
    }

    if (!form.designation.trim()) {
      setErrorMessage('Please enter the designation.')
      return
    }

    if (!form.joiningDate) {
      setErrorMessage('Please select the joining date.')
      return
    }

    const payload: FacultyCreateData = {
      create_username: form.username.trim(),
      create_password: form.password,
      create_first_name: form.firstName.trim(),
      create_last_name: form.lastName.trim(),
      create_email: form.email.trim(),

      employee_id: form.employeeId.trim().toUpperCase(),
      department: Number(form.department),
      designation: form.designation.trim(),
      joining_date: form.joiningDate,

      employment_type: form.employmentType,
      status: form.employmentStatus,
    }

    try {
      const faculty =
        await createFaculty.mutateAsync(payload)

      navigate(`/faculty/${faculty.id}`)
    } catch (error: unknown) {
      console.error(
        'Faculty creation failed:',
        error,
      )

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const response = (
          error as {
            response?: {
              data?: unknown
              status?: number
            }
          }
        ).response

        const responseData = response?.data

        if (
          typeof responseData === 'object' &&
          responseData !== null
        ) {
          const data =
            responseData as Record<
              string,
              unknown
            >

          const detail = data.detail

          if (typeof detail === 'string') {
            setErrorMessage(detail)
            return
          }

          const fieldErrors = Object.entries(data)
            .map(([field, value]) => {
              if (Array.isArray(value)) {
                return `${field}: ${value.join(', ')}`
              }

              if (typeof value === 'string') {
                return `${field}: ${value}`
              }

              return null
            })
            .filter(
              (
                message,
              ): message is string =>
                Boolean(message),
            )

          if (fieldErrors.length > 0) {
            setErrorMessage(
              fieldErrors.join(' | '),
            )
            return
          }
        }
      }

      setErrorMessage(
        'Unable to create faculty. Please check the information and try again.',
      )
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ============================================================
          HEADER
      ============================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Faculty Management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Create Faculty
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create a faculty account and associate it
            with the appropriate department.
          </p>
        </div>

        <Link
          to="/faculty"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← Back to Faculty
        </Link>
      </div>

      {/* ============================================================
          ERROR MESSAGE
      ============================================================ */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <p className="font-semibold text-red-800">
            Faculty creation failed
          </p>

          <p className="mt-1 text-sm text-red-700">
            {errorMessage}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* ==========================================================
            ACCOUNT INFORMATION
        ========================================================== */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Account Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These credentials will be used by the faculty
              member to sign in to the University Portal.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Username *
              </label>

              <input
                id="username"
                type="text"
                required
                autoComplete="username"
                value={form.username}
                onChange={(event) =>
                  updateField(
                    'username',
                    event.target.value,
                  )
                }
                placeholder="e.g. faculty.john"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    'email',
                    event.target.value,
                  )
                }
                placeholder="faculty@university.edu"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password *
              </label>

              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  updateField(
                    'password',
                    event.target.value,
                  )
                }
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm Password *
              </label>

              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) =>
                  updateField(
                    'confirmPassword',
                    event.target.value,
                  )
                }
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                First Name *
              </label>

              <input
                id="firstName"
                type="text"
                required
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) =>
                  updateField(
                    'firstName',
                    event.target.value,
                  )
                }
                placeholder="John"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Last Name
              </label>

              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(event) =>
                  updateField(
                    'lastName',
                    event.target.value,
                  )
                }
                placeholder="Doe"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        {/* ==========================================================
            EMPLOYMENT INFORMATION
        ========================================================== */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Employment Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Define the faculty member's institutional
              role and department.
            </p>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            {/* Employee ID */}
            <div>
              <label
                htmlFor="employeeId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Employee ID *
              </label>

              <input
                id="employeeId"
                type="text"
                required
                value={form.employeeId}
                onChange={(event) =>
                  updateField(
                    'employeeId',
                    event.target.value,
                  )
                }
                placeholder="e.g. EMP003"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Department */}
            <div>
              <label
                htmlFor="department"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Department *
              </label>

              <select
                id="department"
                required
                value={form.department}
                onChange={(event) =>
                  updateField(
                    'department',
                    event.target.value,
                  )
                }
                disabled={
                  departmentsLoading ||
                  departmentsError
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {departmentsLoading
                    ? 'Loading departments...'
                    : 'Select department'}
                </option>

                {departments.map(
                  (department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.code} —{' '}
                      {department.name}
                    </option>
                  ),
                )}
              </select>

              {departmentsError && (
                <p className="mt-2 text-xs text-red-600">
                  Unable to load departments.
                  Please try again.
                </p>
              )}
            </div>

            {/* Designation */}
            <div>
              <label
                htmlFor="designation"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Designation *
              </label>

              <input
                id="designation"
                type="text"
                required
                value={form.designation}
                onChange={(event) =>
                  updateField(
                    'designation',
                    event.target.value,
                  )
                }
                placeholder="Assistant Professor"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Joining Date */}
            <div>
              <label
                htmlFor="joiningDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Joining Date *
              </label>

              <input
                id="joiningDate"
                type="date"
                required
                value={form.joiningDate}
                onChange={(event) =>
                  updateField(
                    'joiningDate',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Employment Type */}
            <div>
              <label
                htmlFor="employmentType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Employment Type *
              </label>

              <select
                id="employmentType"
                required
                value={form.employmentType}
                onChange={(event) =>
                  updateField(
                    'employmentType',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {employmentTypes.map(
                  (type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Employment Status */}
            <div>
              <label
                htmlFor="employmentStatus"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Employment Status *
              </label>

              <select
                id="employmentStatus"
                required
                value={form.employmentStatus}
                onChange={(event) =>
                  updateField(
                    'employmentStatus',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {employmentStatuses.map(
                  (status) => (
                    <option
                      key={status.value}
                      value={status.value}
                    >
                      {status.label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </section>

        {/* ==========================================================
            ACTIONS
        ========================================================== */}
        <section className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/faculty"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              createFaculty.isPending ||
              departmentsLoading ||
              departmentsError
            }
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createFaculty.isPending
              ? 'Creating Faculty...'
              : 'Create Faculty'}
          </button>
        </section>
      </form>
    </div>
  )
}