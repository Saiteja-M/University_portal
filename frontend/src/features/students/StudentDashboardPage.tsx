import { useAuthStore } from '../../app/store/authStore'
import { useMyStudent } from './hooks/useStudents'
import { Link } from 'react-router-dom'

export function StudentDashboardPage() {
  const logout = useAuthStore(
    (state) => state.logout,
  )

  const {
    data: student,
    isLoading,
    isError,
    error,
  } = useMyStudent()

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="animate-pulse">
              <div className="h-7 w-64 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-96 rounded bg-slate-200" />

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-28 rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-red-700">
              Unable to load student information
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              We could not retrieve your student profile.
            </p>

            {error instanceof Error && (
              <p className="mt-3 text-xs text-slate-500">
                {error.message}
              </p>
            )}
          </div>
        </div>
      </main>
    )
  }

  if (!student) {
    return null
  }

  const fullName =
    `${student.first_name} ${student.last_name}`.trim() ||
    student.username

  const currentEnrollment =
    student.current_enrollment

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Student Portal
            </h1>

            <p className="text-sm text-slate-500">
              Academic dashboard
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <section className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Welcome back
              </p>

              <h2 className="mt-1 text-3xl font-bold text-slate-900">
                {fullName}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {student.student_id}
                {' • '}
                {student.program_name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {student.status}
              </p>
            </div>
          </div>
        </section>

        {/* Academic summary */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            label="Student ID"
            value={student.student_id}
          />

          <DashboardCard
            label="Department"
            value={student.department_name}
          />

          <DashboardCard
            label="Year of Study"
            value={
              student.year_of_study
                ? `Year ${student.year_of_study}`
                : '—'
            }
          />

          <DashboardCard
            label="Semester"
            value={
              student.semester
                ? `Semester ${student.semester}`
                : '—'
            }
          />
        </section>

        {/* Current academic information */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Current Academic Information
            </h3>

            <div className="mt-5 space-y-4">
              <InfoRow
                label="Programme"
                value={student.program_name}
              />

              <InfoRow
                label="Department"
                value={student.department_name}
              />

              <InfoRow
                label="Academic Year"
                value={
                  student.academic_year || 'Not available'
                }
              />

              <InfoRow
                label="Semester"
                value={
                  student.semester
                    ? `Semester ${student.semester}`
                    : 'Not available'
                }
              />

              <InfoRow
                label="Year of Study"
                value={
                  student.year_of_study
                    ? `Year ${student.year_of_study}`
                    : 'Not available'
                }
              />

              <InfoRow
                label="Enrollment Status"
                value={
                  currentEnrollment?.status ||
                  'Not available'
                }
              />
            </div>
          </div>

          {/* Personal information */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Personal Information
            </h3>

            <div className="mt-5 space-y-4">
              <InfoRow
                label="Full Name"
                value={fullName}
              />

              <InfoRow
                label="Email"
                value={
                  student.email || 'Not available'
                }
              />

              <InfoRow
                label="Institutional Email"
                value={
                  student.profile?.institutional_email ||
                  'Not available'
                }
              />

              <InfoRow
                label="Phone"
                value={
                  student.profile?.phone_number ||
                  'Not available'
                }
              />

              <InfoRow
                label="Admission Number"
                value={student.admission_number}
              />

              <InfoRow
                label="Admission Date"
                value={student.admission_date}
              />
            </div>
          </div>
        </section>

        {/* Portal modules */}
<section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
  <h3 className="text-lg font-bold text-slate-900">
    Student Services
  </h3>

  <p className="mt-1 text-sm text-slate-500">
    Access your academic and university services.
  </p>

  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {/* Profile */}
    <Link
      to="/student/profile"
      className="group rounded-xl border bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition group-hover:scale-110">
        👤
      </div>

      <h4 className="mt-4 font-semibold text-slate-900">
        Profile
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        View and manage your personal information.
      </p>

      <div className="mt-4 text-sm font-medium text-blue-600">
        View Profile →
      </div>
    </Link>

    {/* Courses */}
    <Link
      to="/student/courses"
      className="group rounded-xl border bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 transition group-hover:scale-110">
        📚
      </div>

      <h4 className="mt-4 font-semibold text-slate-900">
        Courses
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        View your registered courses and subjects.
      </p>

      <div className="mt-4 text-sm font-medium text-indigo-600">
        View Courses →
      </div>
    </Link>

    {/* Attendance */}
    <Link
      to="/student/attendance"
      className="group rounded-xl border bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition group-hover:scale-110">
        📊
      </div>

      <h4 className="mt-4 font-semibold text-slate-900">
        Attendance
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        View attendance records for your courses.
      </p>

      <div className="mt-4 text-sm font-medium text-emerald-600">
        View Attendance →
      </div>
    </Link>

    {/* Results */}
    <Link
      to="/student/results"
      className="group rounded-xl border bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 transition group-hover:scale-110">
        🎓
      </div>

      <h4 className="mt-4 font-semibold text-slate-900">
        Results
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        View examination results and academic performance.
      </p>

      <div className="mt-4 text-sm font-medium text-amber-600">
        View Results →
      </div>
    </Link>
  </div>
</section>
      </div>
    </main>
  )
}

function DashboardCard({
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

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-medium text-slate-900">
        {value}
      </span>
    </div>
  )
}