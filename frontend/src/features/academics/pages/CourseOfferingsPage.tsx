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

export default function CourseOfferingsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CourseOfferingStatus | ''>('')
  const [section, setSection] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')

  const offeringsQuery = useCourseOfferings({
    search,
    status,
    section,
    ordering: 'course__code',
  })
  const coursesQuery = useCourses({ is_active: true })
  const yearsQuery = useAcademicYears()
  const semestersQuery = useSemesters()

  const createOffering = useCreateCourseOffering()
  const deleteOffering = useDeleteCourseOffering()

  const [form, setForm] = useState({
    course: '',
    academic_year: '',
    semester: '',
    section: '',
    capacity: '60',
    status: 'PLANNED' as CourseOfferingStatus,
  })

  const offerings = offeringsQuery.data?.results ?? []
  const courses = coursesQuery.data?.results ?? []
  const years = yearsQuery.data?.results ?? []
  const semesters = semestersQuery.data?.results ?? []

  const selectedCourse = courses.find(
    (course) => course.id === Number(form.course),
  )

  const compatibleSemesters = useMemo(
    () =>
      semesters.filter(
        (semester) =>
          !selectedCourse ||
          semester.id === selectedCourse.semester,
      ),
    [semesters, selectedCourse],
  )

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

  const handleCreate = () => {
    setError('')

    const courseId = Number(form.course)
    const yearId = Number(form.academic_year)
    const semesterId = Number(form.semester)
    const capacity = Number(form.capacity)
    const normalizedSection = form.section.trim().toUpperCase()

    if (!courseId || !yearId || !semesterId || !normalizedSection) {
      setError('Course, academic year, semester, and section are required.')
      return
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError('Capacity must be a positive whole number.')
      return
    }

    if (
      selectedCourse &&
      selectedCourse.semester !== semesterId
    ) {
      setError('The selected semester must match the course semester.')
      return
    }

    const selectedSemester = semesters.find(
      (item) => item.id === semesterId,
    )

    if (
      selectedSemester &&
      selectedSemester.academic_year !== yearId
    ) {
      setError('The selected semester must belong to the selected academic year.')
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
        onError: (err: any) => {
          const detail = err?.response?.data?.detail
          setError(
            typeof detail === 'string'
              ? detail
              : 'Unable to create course offering.',
          )
        },
      },
    )
  }

  const handleDelete = (offering: CourseOffering) => {
    if (
      !window.confirm(
        `Delete ${offering.course_code} - Section ${offering.section}?`,
      )
    ) {
      return
    }

    deleteOffering.mutate(offering.id, {
      onError: () =>
        setError('Unable to delete the course offering.'),
    })
  }

  const loading =
    offeringsQuery.isLoading ||
    coursesQuery.isLoading ||
    yearsQuery.isLoading ||
    semestersQuery.isLoading

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Academic Delivery
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Course Offerings
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Convert curriculum courses into semester and section-wise offerings.
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
              onClick={() => setFormOpen((value) => !value)}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {formOpen ? 'Close Form' : '+ New Offering'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {formOpen && (
          <section className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Create Course Offering
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Course">
                <select
                  value={form.course}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      course: e.target.value,
                      semester: '',
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} — {course.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Academic Year">
                <select
                  value={form.academic_year}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      academic_year: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select academic year</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Semester">
                <select
                  value={form.semester}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      semester: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select semester</option>
                  {compatibleSemesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.program_name} — Sem {semester.number} ({semester.semester_type})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Section">
                <input
                  value={form.section}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      section: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="A"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <Field label="Capacity">
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      capacity: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      status: e.target.value as CourseOfferingStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-4 py-2.5 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={createOffering.isPending}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {createOffering.isPending ? 'Creating...' : 'Create Offering'}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Search">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Course, section, academic year..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </Field>

            <Field label="Status">
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as CourseOfferingStatus | '')
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All statuses</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Section">
              <input
                value={section}
                onChange={(e) => setSection(e.target.value.toUpperCase())}
                placeholder="A"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </Field>
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
            </div>
          ) : offerings.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-gray-900">
                No course offerings found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Create the first offering for a course and section.
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
                  {offerings.map((offering) => (
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
                          {offering.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(offering)}
                          disabled={deleteOffering.isPending}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Delete
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

function Field({
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
