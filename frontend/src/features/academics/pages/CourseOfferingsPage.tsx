import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  useAcademicYears,
  useCourseOfferings,
  useCourses,
  useCreateCourseOffering,
  useDeleteCourseOffering,
  useSemesters,
} from '../hooks'
import type {
  CourseOffering,
  CourseOfferingStatus,
} from '../types'

const statuses: CourseOfferingStatus[] = [
  'PLANNED',
  'OPEN',
  'CLOSED',
  'CANCELLED',
]

const studyYears = [1, 2, 3, 4] as const

type StudyYear = (typeof studyYears)[number] | ''

const fieldClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100'

export default function CourseOfferingsPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CourseOfferingStatus | ''>('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [studyYearFilter, setStudyYearFilter] = useState<StudyYear>('')
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    course: '',
    academic_year: '',
    semester: '',
    section: '',
    capacity: '60',
    status: 'PLANNED' as CourseOfferingStatus,
  })

  const offeringsQuery = useCourseOfferings({
    search: search || undefined,
    status: status || undefined,
    section: sectionFilter || undefined,
    ordering: 'course__code',
  })

  const coursesQuery = useCourses({ is_active: true })
  const yearsQuery = useAcademicYears()
  const semestersQuery = useSemesters({ is_active: true })

  const createOffering = useCreateCourseOffering()
  const deleteOffering = useDeleteCourseOffering()

  const offerings = offeringsQuery.data?.results ?? []
  const courses = coursesQuery.data?.results ?? []
  const years = yearsQuery.data?.results ?? []
  const semesters = semestersQuery.data?.results ?? []

  const selectedCourse = courses.find(
    (course) => course.id === Number(form.course),
  )

  const selectedSemester = semesters.find(
    (semester) => semester.id === Number(form.semester),
  )

  const compatibleSemesters = useMemo(() => {
    return semesters.filter((semester) => {
      const matchesCourse =
        !selectedCourse || semester.id === selectedCourse.semester

      const matchesYear =
        !form.academic_year ||
        semester.academic_year === Number(form.academic_year)

      return matchesCourse && matchesYear
    })
  }, [semesters, selectedCourse, form.academic_year])

  const filteredOfferings = useMemo(() => {
    if (studyYearFilter === '') return offerings

    return offerings.filter(
      (offering) =>
        getStudyYear(offering.semester_number) === studyYearFilter,
    )
  }, [offerings, studyYearFilter])

  const resetForm = () => {
    setForm({
      course: '',
      academic_year: '',
      semester: '',
      section: '',
      capacity: '60',
      status: 'PLANNED',
    })
    setFormOpen(false)
    setError('')
  }

  const updateForm = (
    field: keyof typeof form,
    value: string,
  ) => {
    setError('')

    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      }

      if (field === 'course') {
        next.semester = ''
        next.academic_year = ''
      }

      if (field === 'academic_year') {
        next.semester = ''
      }

      return next
    })
  }

  const handleCreate = () => {
    setError('')

    const courseId = Number(form.course)
    const yearId = Number(form.academic_year)
    const semesterId = Number(form.semester)
    const capacity = Number(form.capacity)
    const normalizedSection = form.section.trim().toUpperCase()

    if (!courseId) {
      setError('Please select a course.')
      return
    }

    if (!yearId) {
      setError('Please select an academic year.')
      return
    }

    if (!semesterId) {
      setError('Please select a semester.')
      return
    }

    if (!normalizedSection) {
      setError('Section is required.')
      return
    }

    if (normalizedSection.length > 50) {
      setError('Section must be 50 characters or fewer.')
      return
    }

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
      setError('Capacity must be a whole number between 1 and 1000.')
      return
    }

    if (!selectedCourse) {
      setError('Selected course could not be found.')
      return
    }

    if (!selectedSemester) {
      setError('Selected semester could not be found.')
      return
    }

    if (selectedCourse.semester !== selectedSemester.id) {
      setError('The selected semester must match the course semester.')
      return
    }

    if (selectedSemester.academic_year !== yearId) {
      setError('The selected academic year must match the semester.')
      return
    }

    createOffering.mutate(
      {
        course: courseId,
        academic_year: yearId,
        semester: semesterId,
        section: normalizedSection,
        capacity,
        status: form.status,
        is_active: true,
      },
      {
        onSuccess: resetForm,
        onError: (err: unknown) => {
          setError(getApiErrorMessage(err))
        },
      },
    )
  }

  const handleDelete = (offering: CourseOffering) => {
    setError('')

    if (
      !window.confirm(
        `Delete ${offering.course_code} - Section ${offering.section}?`,
      )
    ) {
      return
    }

    deleteOffering.mutate(offering.id, {
      onError: (err: unknown) => {
        setError(
          `This offering could not be deleted. ${getApiErrorMessage(err)}`,
        )
      },
    })
  }

  const loading =
    offeringsQuery.isLoading ||
    coursesQuery.isLoading ||
    yearsQuery.isLoading ||
    semestersQuery.isLoading

  const anyMutationPending =
    createOffering.isPending || deleteOffering.isPending

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Academic Delivery
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Course Offerings
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Create and manage semester- and section-wise delivery of
              curriculum courses.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/academics/courses')}
              className="rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Courses
            </button>

            <button
              type="button"
              onClick={() => {
                setError('')
                setFormOpen((value) => !value)
              }}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {formOpen ? 'Close Form' : '+ New Offering'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError('')}
              className="font-semibold text-red-700 hover:text-red-900"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {formOpen && (
          <section className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Create Course Offering
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select the course first. Academic year and semester are then
                constrained to valid combinations.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <SelectField label="Course">
                <select
                  value={form.course}
                  onChange={(event) =>
                    updateForm('course', event.target.value)
                  }
                  className={fieldClassName}
                  disabled={coursesQuery.isLoading}
                >
                  <option value="">
                    {coursesQuery.isLoading
                      ? 'Loading courses...'
                      : courses.length === 0
                        ? 'No active courses found'
                        : 'Select course'}
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.name}
                    </option>
                  ))}
                </select>
              </SelectField>

              <SelectField label="Academic Year">
                <select
                  value={form.academic_year}
                  onChange={(event) =>
                    updateForm('academic_year', event.target.value)
                  }
                  className={fieldClassName}
                  disabled={!selectedCourse || yearsQuery.isLoading}
                >
                  <option value="">
                    {!selectedCourse
                      ? 'Select course first'
                      : yearsQuery.isLoading
                        ? 'Loading academic years...'
                        : years.length === 0
                          ? 'No academic years found'
                          : 'Select academic year'}
                  </option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                      {year.is_current ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              </SelectField>

              <SelectField label="Semester">
                <select
                  value={form.semester}
                  onChange={(event) =>
                    updateForm('semester', event.target.value)
                  }
                  className={fieldClassName}
                  disabled={
                    !selectedCourse ||
                    !form.academic_year ||
                    semestersQuery.isLoading
                  }
                >
                  <option value="">
                    {!selectedCourse
                      ? 'Select course first'
                      : !form.academic_year
                        ? 'Select academic year first'
                        : semestersQuery.isLoading
                          ? 'Loading semesters...'
                          : compatibleSemesters.length === 0
                            ? 'No matching semester found'
                            : 'Select semester'}
                  </option>

                  {compatibleSemesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      Semester {semester.number} —{' '}
                      {capitalize(semester.semester_type)}
                    </option>
                  ))}
                </select>
              </SelectField>

              <SelectField label="Study Year">
                <select
                  value={
                    selectedSemester
                      ? String(getStudyYear(selectedSemester.number) ?? '')
                      : ''
                  }
                  className={fieldClassName}
                  disabled
                  aria-label="Study year derived from semester"
                >
                  <option value="">Derived from semester</option>
                  {studyYears.map((year) => (
                    <option key={year} value={year}>
                      {year} — {ordinalYear(year)}
                    </option>
                  ))}
                </select>
              </SelectField>

              <SelectField label="Section">
                <input
                  value={form.section}
                  onChange={(event) =>
                    updateForm(
                      'section',
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="e.g. A"
                  maxLength={50}
                  className={fieldClassName}
                  disabled={!form.semester}
                />
              </SelectField>

              <SelectField label="Capacity">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={form.capacity}
                  onChange={(event) =>
                    updateForm('capacity', event.target.value)
                  }
                  placeholder="e.g. 60"
                  className={fieldClassName}
                />
              </SelectField>

              <SelectField label="Status">
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      'status',
                      event.target.value as CourseOfferingStatus,
                    )
                  }
                  className={fieldClassName}
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {formatStatus(item)}
                    </option>
                  ))}
                </select>
              </SelectField>
            </div>

            <div className="mt-5 flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={resetForm}
                disabled={anyMutationPending}
                className="rounded-lg border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreate}
                disabled={
                  createOffering.isPending ||
                  coursesQuery.isLoading ||
                  yearsQuery.isLoading ||
                  semestersQuery.isLoading
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createOffering.isPending
                  ? 'Creating...'
                  : 'Create Offering'}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SelectField label="Search">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Course, section, year..."
                className={fieldClassName}
              />
            </SelectField>

            <SelectField label="Study Year">
              <select
                value={studyYearFilter === '' ? '' : String(studyYearFilter)}
                onChange={(event) => {
                  setStudyYearFilter(
                    event.target.value
                      ? (Number(event.target.value) as StudyYear)
                      : '',
                  )
                }}
                className={fieldClassName}
              >
                <option value="">All study years</option>
                {studyYears.map((year) => (
                  <option key={year} value={year}>
                    {year} — {ordinalYear(year)}
                  </option>
                ))}
              </select>
            </SelectField>

            <SelectField label="Status">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as CourseOfferingStatus | '',
                  )
                }
                className={fieldClassName}
              >
                <option value="">All statuses</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {formatStatus(item)}
                  </option>
                ))}
              </select>
            </SelectField>

            <SelectField label="Section">
              <input
                value={sectionFilter}
                onChange={(event) =>
                  setSectionFilter(
                    event.target.value.toUpperCase(),
                  )
                }
                placeholder="e.g. A"
                maxLength={50}
                className={fieldClassName}
              />
            </SelectField>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Loading course offerings...
            </div>
          ) : offeringsQuery.isError ? (
            <div className="p-10 text-center text-sm text-red-700">
              Unable to load course offerings.
              <button
                type="button"
                onClick={() => void offeringsQuery.refetch()}
                className="ml-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : filteredOfferings.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-gray-900">
                No course offerings found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Adjust the filters or create a new offering.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Course',
                      'Program',
                      'Academic Year',
                      'Study Year',
                      'Semester',
                      'Section',
                      'Capacity',
                      'Status',
                      'Actions',
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredOfferings.map((offering) => (
                    <tr key={offering.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {offering.course_code}
                        </p>
                        <p className="text-sm text-gray-500">
                          {offering.course_name}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {offering.program_name}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {offering.academic_year_name}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {getStudyYearLabel(offering.semester_number)}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        Semester {offering.semester_number}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {offering.section}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {offering.capacity}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {formatStatus(offering.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(offering)}
                          disabled={deleteOffering.isPending}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deleteOffering.isPending ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function SelectField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
  )
}

function getStudyYear(
  semesterNumber: number,
): 1 | 2 | 3 | 4 | null {
  if (semesterNumber < 1 || semesterNumber > 8) return null
  return Math.ceil(semesterNumber / 2) as 1 | 2 | 3 | 4
}

function getStudyYearLabel(semesterNumber: number) {
  const year = getStudyYear(semesterNumber)

  return year ? `${year} — ${ordinalYear(year)} Year` : '—'
}

function ordinalYear(year: number) {
  if (year === 1) return '1st'
  if (year === 2) return '2nd'
  if (year === 3) return '3rd'
  return '4th'
}

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function formatStatus(value: CourseOfferingStatus) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function getApiErrorMessage(error: unknown) {
  const responseData = (
    error as {
      response?: { data?: Record<string, unknown> }
    }
  )?.response?.data

  if (!responseData) {
    return 'Please try again.'
  }

  const preferredKeys = [
    'detail',
    'non_field_errors',
    'course',
    'academic_year',
    'semester',
    'section',
    'capacity',
  ]

  for (const key of preferredKeys) {
    const message = extractErrorMessage(responseData[key])
    if (message) return message
  }

  for (const value of Object.values(responseData)) {
    const message = extractErrorMessage(value)
    if (message) return message
  }

  return 'The server rejected this operation.'
}

function extractErrorMessage(value: unknown): string | null {
  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string')
    return typeof first === 'string' ? first : null
  }

  return null
}
