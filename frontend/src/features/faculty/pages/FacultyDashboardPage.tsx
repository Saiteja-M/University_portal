import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFacultyCourseAssignments } from '../hooks/useFaculty'
import type { FacultyCourseAssignment } from '../types/faculty.types'

interface PaginatedResponse<T> {
  count?: number
  next?: string | null
  previous?: string | null
  results: T[]
}

type AssignmentFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

function normalizeResults<T>(
  data: T[] | PaginatedResponse<T> | undefined,
): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data

  if (
    typeof data === 'object' &&
    'results' in data &&
    Array.isArray(data.results)
  ) {
    return data.results
  }

  return []
}

function StatCard({
  label,
  value,
  detail,
  icon,
  accent = 'blue',
}: {
  label: string
  value: string | number
  detail: string
  icon: string
  accent?: 'blue' | 'green' | 'amber' | 'violet'
}) {
  const accents = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <span
          aria-hidden="true"
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ring-1 ${accents[accent]}`}
        >
          {icon}
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {detail}
      </p>
    </article>
  )
}

function QuickAction({
  to,
  title,
  description,
  icon,
}: {
  to: string
  title: string
  description: string
  icon: string
}) {
  return (
    <Link
      to={to}
      className="group flex min-h-28 items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl transition group-hover:bg-blue-100"
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-900 group-hover:text-blue-700">
            {title}
          </span>
          <span
            aria-hidden="true"
            className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
          >
            →
          </span>
        </span>

        <span className="mt-1 block text-sm leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </Link>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function escapeCsv(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

export default function FacultyDashboardPage() {
  const assignmentsQuery = useFacultyCourseAssignments()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<AssignmentFilter>('ALL')

  const assignments = useMemo(
    () =>
      normalizeResults<FacultyCourseAssignment>(
        assignmentsQuery.data,
      ),
    [assignmentsQuery.data],
  )

  const activeAssignments = useMemo(
    () => assignments.filter((item) => item.is_active),
    [assignments],
  )

  const uniqueCourses = useMemo(() => {
    const ids = new Set(
      activeAssignments.map((item) => item.course_code || String(item.offering)),
    )
    return ids.size
  }, [activeAssignments])

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...assignments]
      .filter((item) => {
        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'ACTIVE' && item.is_active) ||
          (statusFilter === 'INACTIVE' && !item.is_active)

        const searchableText = [
          item.faculty_name,
          item.faculty_employee_id,
          item.course_name,
          item.course_code,
          item.section,
          item.semester_number,
        ]
          .map((value) => String(value ?? ''))
          .join(' ')
          .toLowerCase()

        return matchesStatus && searchableText.includes(query)
      })
      .sort((a, b) =>
        String(b.assigned_date ?? '').localeCompare(
          String(a.assigned_date ?? ''),
        ),
      )
  }, [assignments, search, statusFilter])

  const exportCsv = () => {
    const headers = [
      'Faculty',
      'Employee ID',
      'Course',
      'Course Code',
      'Semester',
      'Section',
      'Assigned Date',
      'Status',
    ]

    const rows = filteredAssignments.map((item) => [
      item.faculty_name || `Faculty #${item.faculty}`,
      item.faculty_employee_id,
      item.course_name || `Offering #${item.offering}`,
      item.course_code,
      item.semester,
      item.section,
      item.assigned_date,
      item.is_active ? 'Active' : 'Inactive',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\r\n')

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = 'faculty-course-assignments.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const isLoading = assignmentsQuery.isLoading
  const isError = assignmentsQuery.isError

  return (
    <div className="space-y-8 pb-8">
      {/* Page heading */}
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Faculty workspace
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Faculty Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Your academic workspace for course assignments,
              attendance, students and teaching activities.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void assignmentsQuery.refetch()}
              disabled={assignmentsQuery.isFetching}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
            >
              {assignmentsQuery.isFetching
                ? 'Refreshing…'
                : '↻ Refresh'}
            </button>

            <Link
              to="/faculty/assignments"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-blue-50"
            >
              View assignments →
            </Link>
          </div>
        </div>
      </header>

      {/* Error state */}
      {isError && (
        <section
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5"
        >
          <h2 className="font-semibold text-red-900">
            Could not load course assignments
          </h2>
          <p className="mt-1 text-sm text-red-800">
            Check that the backend is running and your account
            has permission to access this information.
          </p>
          <button
            type="button"
            onClick={() => void assignmentsQuery.refetch()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </section>
      )}

      {/* Statistics */}
      <section aria-label="Academic overview">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Academic overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Summary of available assignment data
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {isLoading ? 'Loading data…' : 'API-backed data'}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Courses"
            value={isLoading ? '—' : uniqueCourses}
            detail="Unique courses in active assignments"
            icon="▣"
            accent="blue"
          />

          <StatCard
            label="Total Assignments"
            value={isLoading ? '—' : assignments.length}
            detail="Records returned by the assignments API"
            icon="▤"
            accent="violet"
          />

          <StatCard
            label="Active Assignments"
            value={isLoading ? '—' : activeAssignments.length}
            detail="Assignments marked active"
            icon="✓"
            accent="green"
          />

          <StatCard
            label="Inactive Assignments"
            value={
              isLoading
                ? '—'
                : assignments.length - activeAssignments.length
            }
            detail="Assignments marked inactive"
            icon="◷"
            accent="amber"
          />
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Quick actions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Jump directly to commonly used portal sections.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickAction
            to="/faculty/assignments"
            title="Course Assignments"
            description="Review teaching assignments and allocation details."
            icon="▤"
          />
          <QuickAction
            to="/faculty/attendance"
            title="Attendance"
            description="Open the attendance module."
            icon="✓"
          />
          <QuickAction
            to="/academics/courses"
            title="Course Catalogue"
            description="Browse the academic course catalogue."
            icon="▣"
          />
          <QuickAction
            to="/students"
            title="Students"
            description="Open student records if your role permits access."
            icon="♙"
          />
        </div>
      </section>

      {/* Assignment activity */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Course assignment activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search, filter and export the assignment records
                available from the API.
              </p>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              disabled={isLoading || isError || filteredAssignments.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↓ Export CSV
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_auto]">
            <div>
              <label
                htmlFor="assignment-search"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Search assignments
              </label>
              <input
                id="assignment-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Course, faculty, code or section…"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="assignment-status"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>
              <select
                id="assignment-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as AssignmentFilter)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active only</option>
                <option value="INACTIVE">Inactive only</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('ALL')
                }}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 lg:w-auto"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-6">
          <p className="text-sm text-slate-600" aria-live="polite">
            Showing{' '}
            <strong className="text-slate-900">
              {isLoading ? '—' : filteredAssignments.length}
            </strong>{' '}
            assignment records
          </p>
          <p className="text-xs text-slate-400">
            Sorted by assignment date
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6" aria-label="Loading assignments">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Assignment records are unavailable until the API request succeeds.
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
              ⌕
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No matching assignments
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try another search term or clear the filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
              }}
              className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  {[
                    'Faculty',
                    'Course',
                    'Semester',
                    'Section',
                    'Assigned',
                    'Status',
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.slice(0, 10).map((item) => (
                  <tr
                    key={item.id}
                    className="transition hover:bg-blue-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.faculty_name || `Faculty #${item.faculty}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.faculty_employee_id || 'No employee ID'}
                      </p>
                    </td>

                    <td className="px-5 py-4 sm:px-6">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.course_name || `Offering #${item.offering}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.course_code || 'No course code'}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 sm:px-6">
                      {item.semester ?? '—'}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 sm:px-6">
                      {item.section || '—'}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 sm:px-6">
                      {formatDate(item.assigned_date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                      <span
                        className={
                          item.is_active
                            ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200'
                            : 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200'
                        }
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAssignments.length > 10 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm text-slate-500">
                  Showing 10 of {filteredAssignments.length} matching records.
                  Export CSV to get all filtered records.
                </p>
                <Link
                  to="/faculty/assignments"
                  className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  Open all assignments →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Data transparency */}
      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm"
          >
            i
          </span>
          <div>
            <h2 className="text-sm font-bold text-blue-950">
              Data and integration status
            </h2>
            <p className="mt-1 text-sm leading-6 text-blue-900/80">
              Assignment statistics and records come from the existing API.
              Student totals, attendance percentages, timetables and exam
              results are not calculated here because their data connections
              have not yet been verified.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
