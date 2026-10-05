const EMPTY_COURSES: never[] = []
const EMPTY_SEMESTERS: never[] = []
const EMPTY_REGULATIONS: never[] = []
const EMPTY_PROGRAMS: never[] = []

import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  useCourses,
  useCreateCourse,
  useDeleteCourse,
  usePrograms,
  useRegulations,
  useSemesters,
  useUpdateCourse,
} from '../hooks'
import type { Course } from '../types'

type CourseForm = {
  semester: string
  regulation: string
  code: string
  name: string
  credits: string
  is_active: boolean
}

const emptyForm: CourseForm = {
  semester: '',
  regulation: '',
  code: '',
  name: '',
  credits: '3',
  is_active: true,
}

export default function CoursesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [programFilter, setProgramFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [regulationFilter, setRegulationFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isFormOpen, setIsFormOpen] = useState(
    location.pathname === '/courses/new' ||
      location.pathname === '/academics/courses/new',
  )
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [form, setForm] = useState<CourseForm>(emptyForm)
  const [formError, setFormError] = useState('')

  const coursesQuery = useCourses()
  const semestersQuery = useSemesters()
  const regulationsQuery = useRegulations()
  const programsQuery = usePrograms()

  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()

  const courses = coursesQuery.data?.results ?? EMPTY_COURSES
  const semesters = semestersQuery.data?.results ?? EMPTY_SEMESTERS
  const regulations = regulationsQuery.data?.results ?? EMPTY_REGULATIONS
  const programs = programsQuery.data?.results ?? EMPTY_PROGRAMS

  /*
   * Build a program lookup from the existing semester data.
   *
   * Semester already contains program_name, but the numeric program
   * relationship is what we need for validation.
   */
  const semesterProgramMap = useMemo(() => {
    const map = new Map<number, number>()

    semesters.forEach((semester) => {
      map.set(semester.id, semester.program)
    })

    return map
  }, [semesters])

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return courses.filter((course) => {
      const semesterProgramId = semesterProgramMap.get(course.semester)

      const matchesSearch =
        !normalizedSearch ||
        course.code.toLowerCase().includes(normalizedSearch) ||
        course.name.toLowerCase().includes(normalizedSearch)

      const matchesProgram =
        !programFilter ||
        String(semesterProgramId) === programFilter

      const matchesSemester =
        !semesterFilter ||
        String(course.semester) === semesterFilter

      const matchesRegulation =
        !regulationFilter ||
        String(course.regulation) === regulationFilter

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && course.is_active) ||
        (statusFilter === 'inactive' && !course.is_active)

      return (
        matchesSearch &&
        matchesProgram &&
        matchesSemester &&
        matchesRegulation &&
        matchesStatus
      )
    })
  }, [
    courses,
    search,
    programFilter,
    semesterFilter,
    regulationFilter,
    statusFilter,
    semesterProgramMap,
  ])

  const activeCount = courses.filter((course) => course.is_active).length
  const inactiveCount = courses.filter((course) => !course.is_active).length

  const openEditForm = (course: Course) => {
    setEditingCourse(course)

    setForm({
      semester: String(course.semester),
      regulation: String(course.regulation),
      code: course.code,
      name: course.name,
      credits: String(course.credits),
      is_active: course.is_active,
    })

    setFormError('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingCourse(null)
    setForm(emptyForm)
    setFormError('')

    if (
      location.pathname === '/courses/new' ||
      location.pathname === '/academics/courses/new'
    ) {
      navigate('/academics/courses', { replace: true })
    }
  }

  const updateForm = <K extends keyof CourseForm>(
    field: K,
    value: CourseForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const semesterId = Number(form.semester)
    const regulationId = Number(form.regulation)
    const credits = Number(form.credits)

    if (!semesterId || !regulationId) {
      setFormError('Please select both Semester and Regulation.')
      return
    }

    if (!form.code.trim()) {
      setFormError('Course code is required.')
      return
    }

    if (!form.name.trim()) {
      setFormError('Course name is required.')
      return
    }

    if (!Number.isInteger(credits) || credits < 0) {
      setFormError('Credits must be a valid non-negative number.')
      return
    }

    /*
     * Critical domain validation:
     *
     * A Course's Semester and Regulation must belong to the same Program.
     */
    const selectedSemester = semesters.find(
      (semester) => semester.id === semesterId,
    )

    const selectedRegulation = regulations.find(
      (regulation) => regulation.id === regulationId,
    )

    if (!selectedSemester) {
      setFormError('Selected semester could not be found.')
      return
    }

    if (!selectedRegulation) {
      setFormError('Selected regulation could not be found.')
      return
    }

    if (selectedSemester.program !== selectedRegulation.program) {
      setFormError(
        'Invalid combination: Semester and Regulation must belong to the same Program.',
      )
      return
    }

    const payload = {
      semester: semesterId,
      regulation: regulationId,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      credits,
      is_active: form.is_active,
    }

    try {
      if (editingCourse) {
        await updateCourse.mutateAsync({
          id: editingCourse.id,
          data: payload,
        })
      } else {
        await createCourse.mutateAsync(payload)
      }

      closeForm()
    } catch (error) {
      console.error(error)
      setFormError(
        'Unable to save the course. Please check the entered values and try again.',
      )
    }
  }

  const handleDelete = async (course: Course) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.code} - ${course.name}"?`,
    )

    if (!confirmed) return

    try {
      await deleteCourse.mutateAsync(course.id)
    } catch (error) {
      console.error(error)
      window.alert('Unable to delete the course.')
    }
  }

  const resetFilters = () => {
    setSearch('')
    setProgramFilter('')
    setSemesterFilter('')
    setRegulationFilter('')
    setStatusFilter('all')
  }

  const selectedSemester = semesters.find(
    (semester) => semester.id === Number(form.semester),
  )

  const availableSemesters = form.regulation
    ? semesters.filter((semester) => {
        const selectedRegulation = regulations.find(
          (regulation) => regulation.id === Number(form.regulation),
        )

        return (
          !selectedRegulation ||
          semester.program === selectedRegulation.program
        )
      })
    : semesters

  const isLoading =
    coursesQuery.isLoading ||
    semestersQuery.isLoading ||
    regulationsQuery.isLoading ||
    programsQuery.isLoading

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  if (coursesQuery.isError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">
            Unable to load courses
          </h2>

          <p className="mt-2 text-sm text-red-700">
            Please check that the backend is running and try again.
          </p>

          <button
            type="button"
            onClick={() => coursesQuery.refetch()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Academics Management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Courses
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage courses, credits, semesters, and regulations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/academics/courses/new')}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
        >
          + Add Course
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Courses</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {courses.length}
          </p>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <p className="text-sm text-green-700">Active Courses</p>
          <p className="mt-2 text-3xl font-bold text-green-800">
            {activeCount}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inactive Courses</p>
          <p className="mt-2 text-3xl font-bold text-gray-700">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label
              htmlFor="course-search"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Search
            </label>

            <input
              id="course-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code or course name..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="program-filter"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Program
            </label>

            <select
              id="program-filter"
              value={programFilter}
              onChange={(event) => {
                setProgramFilter(event.target.value)
                setSemesterFilter('')
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Programs</option>

              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.code} - {program.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="semester-filter"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Semester
            </label>

            <select
              id="semester-filter"
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Semesters</option>

              {semesters
                .filter(
                  (semester) =>
                    !programFilter ||
                    String(semester.program) === programFilter,
                )
                .map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    Sem {semester.number} - {semester.program_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="regulation-filter"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Regulation
            </label>

            <select
              id="regulation-filter"
              value={regulationFilter}
              onChange={(event) => setRegulationFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Regulations</option>

              {regulations
                .filter(
                  (regulation) =>
                    !programFilter ||
                    String(regulation.program) === programFilter,
                )
                .map((regulation) => (
                  <option key={regulation.id} value={regulation.id}>
                    {regulation.code} - {regulation.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>

          <span className="ml-auto text-sm text-gray-500">
            Showing {filteredCourses.length} of {courses.length}
          </span>
        </div>
      </div>

      {/* Course table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Course
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Program
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Semester
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Regulation
                </th>

                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Credits
                </th>

                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    No courses found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {course.code}
                        </p>

                        <p className="mt-0.5 text-sm text-gray-500">
                          {course.name}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {course.program_name}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-700">
                      Semester {course.semester_number}
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-gray-700">
                      {course.regulation_code}
                    </td>

                    <td className="px-5 py-4 text-center text-sm font-semibold text-gray-900">
                      {course.credits}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          course.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(course)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(course)}
                          disabled={deleteCourse.isPending}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingCourse ? 'Edit Course' : 'Create Course'}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {editingCourse
                      ? 'Update the course information.'
                      : 'Add a new course to the academic structure.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Regulation */}
                <div>
                  <label
                    htmlFor="course-regulation"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Regulation *
                  </label>

                  <select
                    id="course-regulation"
                    value={form.regulation}
                    onChange={(event) => {
                      const value = event.target.value

                      updateForm('regulation', value)

                      const regulation = regulations.find(
                        (item) => item.id === Number(value),
                      )

                      if (
                        regulation &&
                        form.semester &&
                        semesterProgramMap.get(Number(form.semester)) !==
                          regulation.program
                      ) {
                        updateForm('semester', '')
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">Select Regulation</option>

                    {regulations.map((regulation) => (
                      <option key={regulation.id} value={regulation.id}>
                        {regulation.code} - {regulation.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label
                    htmlFor="course-semester"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Semester *
                  </label>

                  <select
                    id="course-semester"
                    value={form.semester}
                    onChange={(event) =>
                      updateForm('semester', event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  >
                    <option value="">Select Semester</option>

                    {availableSemesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        Semester {semester.number} — {semester.program_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course code */}
                <div>
                  <label
                    htmlFor="course-code"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Course Code *
                  </label>

                  <input
                    id="course-code"
                    type="text"
                    value={form.code}
                    onChange={(event) =>
                      updateForm('code', event.target.value.toUpperCase())
                    }
                    placeholder="e.g. CS101"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                {/* Credits */}
                <div>
                  <label
                    htmlFor="course-credits"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Credits *
                  </label>

                  <input
                    id="course-credits"
                    type="number"
                    min="0"
                    max="20"
                    value={form.credits}
                    onChange={(event) =>
                      updateForm('credits', event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>

              {/* Course name */}
              <div>
                <label
                  htmlFor="course-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Course Name *
                </label>

                <input
                  id="course-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm('name', event.target.value)
                  }
                  placeholder="e.g. Data Structures"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Program preview */}
              {selectedSemester && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Course Program
                  </p>

                  <p className="mt-1 text-sm font-medium text-blue-900">
                    {selectedSemester.program_name}
                  </p>

                  <p className="mt-1 text-xs text-blue-700">
                    The selected regulation must belong to this same program.
                  </p>
                </div>
              )}

              {/* Active */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateForm('is_active', event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <span>
                  <span className="block text-sm font-medium text-gray-700">
                    Active Course
                  </span>

                  <span className="block text-xs text-gray-500">
                    Active courses are available for academic use.
                  </span>
                </span>
              </label>

              {/* Form actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createCourse.isPending || updateCourse.isPending
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createCourse.isPending || updateCourse.isPending
                    ? 'Saving...'
                    : editingCourse
                      ? 'Update Course'
                      : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
