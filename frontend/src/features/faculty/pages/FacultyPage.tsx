import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  useDeleteFaculty,
  useFaculty,
} from '../hooks'

import type { EmploymentStatus } from '../types'


type FacultyRow = {
  id: number
  employee_id: string
  employee_name?: string
  username?: string
  email?: string
  department_name?: string
  designation?: string
  joining_date: string
  employment_status: EmploymentStatus
  is_active: boolean
}

const employmentStatusOptions: Array<{
  value: '' | EmploymentStatus
  label: string
}> = [
  { value: '', label: 'All Employment Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'RESIGNED', label: 'Resigned' },
  { value: 'RETIRED', label: 'Retired' },
]


function employmentStatusClasses(
  status: EmploymentStatus,
) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700'

    case 'ON_LEAVE':
      return 'bg-yellow-100 text-yellow-700'

    case 'RESIGNED':
      return 'bg-orange-100 text-orange-700'

    case 'RETIRED':
      return 'bg-blue-100 text-blue-700'

   
    default:
      return 'bg-slate-100 text-slate-700'
  }
}


function formatDate(date: string) {
  if (!date) {
    return 'Not provided'
  }

  const parsed = new Date(date)

  return Number.isNaN(parsed.getTime())
    ? 'Not provided'
    : parsed.toLocaleDateString()
}


function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: unknown
        }
      }
    ).response

    const data = response?.data

    if (
      typeof data === 'object' &&
      data !== null
    ) {
      const detail = (
        data as {
          detail?: unknown
        }
      ).detail

      if (typeof detail === 'string') {
        return detail
      }

      const messages = Object.values(
        data as Record<string, unknown>,
      ).flatMap((value) =>
        Array.isArray(value)
          ? value.filter(
              (item): item is string =>
                typeof item === 'string',
            )
          : typeof value === 'string'
            ? [value]
            : [],
      )

      if (messages.length > 0) {
        return messages.join(' ')
      }
    }
  }

  return fallback
}


export default function FacultyPage() {
  const [search, setSearch] = useState('')

  const [
    employmentStatus,
    setEmploymentStatus,
  ] = useState<
    '' | EmploymentStatus
  >('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL')

  const [actionError, setActionError] =
    useState('')

  const facultyQuery = useFaculty({
  search: search || undefined,
  employment_status:
    employmentStatus || undefined,
  ordering: 'employee_id',
})

  const deleteFaculty =
    useDeleteFaculty()

  const faculty = useMemo<FacultyRow[]>(
  () =>
    (facultyQuery.data?.results ??
      []) as unknown as FacultyRow[],
  [facultyQuery.data?.results],
)
  const filteredFaculty = useMemo(() => {
    return faculty.filter(
      (member: FacultyRow) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' &&
          member.is_active) ||
        (statusFilter === 'INACTIVE' &&
          !member.is_active)

      return matchesStatus
    })
  }, [faculty, statusFilter])

  const activeCount = faculty.filter(
    (member: FacultyRow) => member.is_active,
  ).length

  const inactiveCount =
    faculty.length - activeCount

  const clearFilters = () => {
    setSearch('')
    setEmploymentStatus('')
    setStatusFilter('ALL')
    setActionError('')
  }

  const handleDelete = (
    member: FacultyRow,
  ) => {
    const confirmed =
      window.confirm(
        `Delete faculty member "${member.employee_name}"?\n\nThis action cannot be undone.`,
      )

    if (!confirmed) {
      return
    }

    setActionError('')

    deleteFaculty.mutate(
      member.id,
      {
        onError: (error) => {
          setActionError(
            getApiErrorMessage(
              error,
              'Unable to delete faculty member.',
            ),
          )
        },
      },
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Faculty Management
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                Faculty
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                View, search, and manage faculty
                members across the university.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Dashboard
              </Link>

              <Link
                to="/faculty/new"
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + Add Faculty
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total Faculty"
            value={faculty.length}
          />

          <SummaryCard
            label="Active"
            value={activeCount}
          />

          <SummaryCard
            label="Inactive"
            value={inactiveCount}
          />
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_240px_220px]">

            <div>
              <label
                htmlFor="faculty-search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Search
              </label>

              <input
                id="faculty-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by employee ID, name, or email..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="faculty-employment-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Employment Status
              </label>

              <select
                id="faculty-employment-status"
                value={employmentStatus}
                onChange={(event) =>
                  setEmploymentStatus(
                    event.target.value as
                      | ''
                      | EmploymentStatus,
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {employmentStatusOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="faculty-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Portal Status
              </label>

              <select
                id="faculty-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | 'ALL'
                      | 'ACTIVE'
                      | 'INACTIVE',
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">
                  All Faculty
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>

          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </section>

        {/* Action error */}
        {actionError && (
          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-800">
              {actionError}
            </p>
          </section>
        )}

        {/* Loading */}
        {facultyQuery.isLoading && (
          <section className="mt-6 rounded-xl border bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-600">
              Loading faculty...
            </p>
          </section>
        )}

        {/* Error */}
        {facultyQuery.isError && (
          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-800">
              Unable to load faculty
            </h2>

            <p className="mt-1 text-sm text-red-700">
              Please check the backend connection
              and try again.
            </p>

            <button
              type="button"
              onClick={() =>
                void facultyQuery.refetch()
              }
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </section>
        )}

        {/* Faculty table */}
        {!facultyQuery.isLoading &&
          !facultyQuery.isError && (
            <section className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">

              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Faculty Directory
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Showing{' '}
                    {filteredFaculty.length}{' '}
                    of {faculty.length}{' '}
                    faculty members
                  </p>
                </div>
              </div>

              {filteredFaculty.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="font-medium text-gray-900">
                    No faculty members found
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Try changing your search or
                    filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">

                    <thead className="bg-gray-50">
                      <tr>
                        <TableHeader>
                          Employee ID
                        </TableHeader>

                        <TableHeader>
                          Faculty
                        </TableHeader>

                        <TableHeader>
                          Department
                        </TableHeader>

                        <TableHeader>
                          Designation
                        </TableHeader>

                        <TableHeader>
                          Joining Date
                        </TableHeader>

                        <TableHeader>
                          Status
                        </TableHeader>

                        <TableHeader align="right">
                          Actions
                        </TableHeader>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredFaculty.map(
                        (member: FacultyRow) => (
                          <tr
                            key={member.id}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                {member.employee_id}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900">
                                {member.employee_name ||
                                  member.username}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {member.email ||
                                  'No email'}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900">
                                {member.department_name}
                              </p>
                            </td>

                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-700">
                                {member.designation}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                              {formatDate(
                                member.joining_date,
                              )}
                            </td>

                            <td className="whitespace-nowrap px-6 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${employmentStatusClasses(
                                  member.employment_status,
                                )}`}
                              >
                                {member.employment_status
                                  .replaceAll(
                                    '_',
                                    ' ',
                                  )}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">

                                <Link
                                  to={`/faculty/${member.id}`}
                                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                  View
                                </Link>

                                <Link
                                  to={`/faculty/${member.id}/edit`}
                                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                  Edit
                                </Link>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      member,
                                    )
                                  }
                                  disabled={
                                    deleteFaculty.isPending
                                  }
                                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Delete
                                </button>

                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>

                  </table>
                </div>
              )}
            </section>
          )}

      </main>
    </div>
  )
}


function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  )
}


function TableHeader({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={`px-6 py-3 text-${align} text-xs font-semibold uppercase tracking-wide text-gray-500`}
    >
      {children}
    </th>
  )
}