import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Plus, RefreshCw, Search } from 'lucide-react'

import { useCourses, usePrograms, useSemesters } from './hooks'

export default function CoursesPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('')
  const [semester, setSemester] = useState('')
  const [status, setStatus] = useState('true')

  const coursesQuery = useCourses({
    ...(search ? { search } : {}),
    ...(program ? { 'semester__program': Number(program) } : {}),
    ...(semester ? { semester: Number(semester) } : {}),
    ...(status ? { is_active: status === 'true' } : {}),
  })

  const programsQuery = usePrograms({
    is_active: true,
  })

  const semestersQuery = useSemesters({
    is_active: true,
    ...(program ? { program: Number(program) } : {}),
  })

  const courses = coursesQuery.data?.results ?? []
  const programs = programsQuery.data?.results ?? []
  const semesters = semestersQuery.data?.results ?? []

  const isLoading =
    coursesQuery.isLoading ||
    programsQuery.isLoading ||
    semestersQuery.isLoading

  function handleRefresh() {
    void coursesQuery.refetch()
    void programsQuery.refetch()
    void semestersQuery.refetch()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <BookOpen size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Courses
              </h1>

              <p className="text-sm text-slate-500">
                Manage academic courses and subjects
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate('/courses/new')}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Add Course
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Courses Found
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {coursesQuery.data?.count ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Programs
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {programs.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Courses
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {courses.filter((course) => course.is_active).length}
            </p>
          </div>

        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* Search */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search course..."
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Program */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Program
              </label>

              <select
                value={program}
                onChange={(event) => {
                  setProgram(event.target.value)
                  setSemester('')
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Programs
                </option>

                {programs.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.code} — {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Semester
              </label>

              <select
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Semesters
                </option>

                {semesters.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    Semester {item.number}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="true">
                  Active
                </option>

                <option value="false">
                  Inactive
                </option>

                <option value="">
                  All
                </option>
              </select>
            </div>

          </div>
        </div>

        {/* Error */}
        {coursesQuery.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">
              Unable to load courses.
            </p>

            <p className="mt-1">
              Please check that the backend is running and
              that you are logged in.
            </p>
          </div>
        )}

        {/* Courses Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px] text-left text-sm">

              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Code
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Course Name
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Program
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Semester
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Credits
                  </th>

                  <th className="px-6 py-4 font-semibold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Loading courses...
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No courses found.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr
                      key={course.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {course.code}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {course.name}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {course.program_name}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        Semester {course.semester_number}
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {course.credits}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={
                            course.is_active
                              ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700'
                              : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600'
                          }
                        >
                          {course.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}

              </tbody>

            </table>
          </div>
        </div>

      </div>
    </div>
  )
}