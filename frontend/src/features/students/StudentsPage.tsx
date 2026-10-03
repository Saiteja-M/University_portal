import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useStudents } from './hooks/useStudents'
import type { StudentStatus } from './types/students'

const statusOptions: Array<{ value: '' | StudentStatus; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'GRADUATED', label: 'Graduated' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'DROPPED', label: 'Dropped' },
]

function statusClasses(status: StudentStatus) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-700'
    case 'INACTIVE': return 'bg-slate-100 text-slate-700'
    case 'GRADUATED': return 'bg-blue-100 text-blue-700'
    case 'SUSPENDED': return 'bg-yellow-100 text-yellow-700'
    case 'DROPPED': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function formatDate(date: string) {
  if (!date) return 'Not provided'
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? 'Not provided' : parsed.toLocaleDateString()
}

export function StudentsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | StudentStatus>('')

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useStudents({
    search: search || undefined,
    status: status || undefined,
    ordering: 'student_id',
  })

  const students = data?.results ?? []

  const clearFilters = () => {
    setSearch('')
    setStatus('')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Student Management</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Students</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              View, search, and manage student records registered in the University Digital Portal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              ← Dashboard
            </Link>
            <Link to="/students/new" className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
              + Add Student
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <div>
              <label htmlFor="student-search" className="mb-2 block text-sm font-semibold text-slate-700">Search Students</label>
              <input
                id="student-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Student ID, admission number, name, email..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="student-status" className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
              <select
                id="student-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as '' | StudentStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="w-full rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                {isFetching ? 'Refreshing...' : 'Refresh'}
              </button>
              {(search || status) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:w-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Students</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{data?.count ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">Matching current filters</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Current Page</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{students.length}</p>
            <p className="mt-1 text-xs text-slate-500">Records displayed</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">API Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isError ? 'bg-red-500' : 'bg-green-500'}`} />
              <p className={`text-lg font-semibold ${isError ? 'text-red-600' : 'text-green-600'}`}>
                {isError ? 'Unavailable' : 'Connected'}
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-500">University Portal API</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Student Records</h2>
              <p className="mt-1 text-sm text-slate-500">Official student records returned by the University Portal API.</p>
            </div>
            {isFetching && !isLoading && <span className="text-xs font-medium text-blue-600">Updating records...</span>}
          </div>

          {isLoading && (
            <div className="p-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-slate-600">Loading student records...</p>
            </div>
          )}

          {isError && (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <span className="text-xl font-bold text-red-600">!</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Unable to load students</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {error instanceof Error ? error.message : 'An unexpected error occurred while loading student records.'}
              </p>
              <button type="button" onClick={() => refetch()} className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !isError && students.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <span className="text-2xl text-slate-400">—</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No students found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                No student records match the current search and status filters.
              </p>
              {(search || status) && (
                <button type="button" onClick={clearFilters} className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-800">
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {!isLoading && !isError && students.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {['Student ID', 'Student', 'Admission No.', 'Programme', 'Year / Semester', 'Admission Date', 'Status', 'Actions'].map((heading) => (
                      <th key={heading} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {students.map((student) => (
                    <tr key={student.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold">
                        <Link to={`/students/${student.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                          {student.student_id}
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {`${student.first_name} ${student.last_name}`.trim() || `User #${student.user}`}
                        </div>
                        {student.email && <div className="mt-1 text-xs text-slate-500">{student.email}</div>}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{student.admission_number}</td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-slate-900">{student.program_name}</div>
                        {student.department_name && <div className="mt-1 text-xs text-slate-500">{student.department_name}</div>}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                        {student.year_of_study ? `Year ${student.year_of_study}` : '—'}
                        {student.semester ? ` / Sem ${student.semester}` : ''}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{formatDate(student.admission_date)}</td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(student.status)}`}>
                          {student.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/students/${student.id}`} className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                            View
                          </Link>
                          <Link to={`/students/${student.id}/edit`} className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && !isError && data && (
            <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing <span className="font-semibold text-slate-700">{students.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{data.count}</span>{' '}
                student{data.count === 1 ? '' : 's'}.
              </p>
              <p className="text-xs text-slate-400">Results are managed through the University Portal API.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentsPage
