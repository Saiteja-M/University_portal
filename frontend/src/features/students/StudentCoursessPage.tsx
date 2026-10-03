import { Link } from 'react-router-dom'

import { useCourses } from '../academics/hooks/useAcademics'
import { useMyStudent } from './hooks/useStudents'

export default function StudentCoursesPage() {
  const studentQuery = useMyStudent()

  const semesterId =
    studentQuery.data?.current_enrollment?.semester

  const coursesQuery = useCourses(
    semesterId
      ? {
          semester: semesterId,
          is_active: true,
          ordering: 'code',
        }
      : undefined,
  )

  if (studentQuery.isLoading) {
    return <PageLoading title="Loading your courses..." />
  }

  if (studentQuery.isError) {
    return (
      <PageError
        title="Unable to load student information"
        message="We could not retrieve your current academic enrollment."
      />
    )
  }

  const student = studentQuery.data

  if (!student) {
    return null
  }

  const courses = coursesQuery.data?.results ?? []

  const totalCredits = courses.reduce(
    (total, course) => total + Number(course.credits || 0),
    0,
  )

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Student Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              My Courses
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Current semester courses and academic subjects.
            </p>
          </div>

          <Link
            to="/student/dashboard"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Student academic summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Student ID"
            value={student.student_id}
          />

          <SummaryCard
            label="Academic Year"
            value={student.academic_year || '—'}
          />

          <SummaryCard
            label="Semester"
            value={
              student.semester
                ? `Semester ${student.semester}`
                : '—'
            }
          />

          <SummaryCard
            label="Total Credits"
            value={String(totalCredits)}
          />
        </section>

        {/* Page heading */}
        <section className="mt-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Current Semester
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {courses.length} active course
                {courses.length === 1 ? '' : 's'} found for your
                current enrollment.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              {student.program_name}
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="mt-5">
          {coursesQuery.isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-2xl border bg-white"
                />
              ))}
            </div>
          ) : coursesQuery.isError ? (
            <div className="rounded-2xl border border-red-200 bg-white p-8">
              <h3 className="font-semibold text-red-700">
                Unable to load courses
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Please try again later.
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                📚
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No courses available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                No active courses were found for your current semester.
                Please contact the academic office if this information
                appears incorrect.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                      📘
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {course.code}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900">
                    {course.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {course.program_name}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <InfoBox
                      label="Credits"
                      value={String(course.credits)}
                    />

                    <InfoBox
                      label="Semester"
                      value={String(course.semester_number)}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span
                      className={
                        course.is_active
                          ? 'text-xs font-semibold text-emerald-600'
                          : 'text-xs font-semibold text-slate-400'
                      }
                    >
                      {course.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>

                    <span className="text-xs text-slate-400">
                      {course.regulation_code}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 truncate text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  )
}

function InfoBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  )
}

function PageLoading({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="animate-pulse">
            <div className="h-7 w-64 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-96 rounded bg-slate-200" />
          </div>

          <p className="mt-6 text-sm text-slate-500">
            {title}
          </p>
        </div>
      </div>
    </main>
  )
}

function PageError({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-red-700">
            {title}
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {message}
          </p>
        </div>
      </div>
    </main>
  )
}