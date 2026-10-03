import {
  useAcademicYears,
  useCourses,
  useDepartments,
  usePrograms,
  useSemesters,
} from './hooks'

export function AcademicsTestPage() {
  const departments = useDepartments()
  const programs = usePrograms()
  const academicYears = useAcademicYears()
  const semesters = useSemesters()
  const courses = useCourses()

  if (
    departments.isLoading ||
    programs.isLoading ||
    academicYears.isLoading ||
    semesters.isLoading ||
    courses.isLoading
  ) {
    return (
      <div className="p-8">
        Loading Academics data...
      </div>
    )
  }

  if (
    departments.isError ||
    programs.isError ||
    academicYears.isError ||
    semesters.isError ||
    courses.isError
  ) {
    return (
      <div className="p-8 text-red-600">
        Failed to load Academics data.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Academics API Test
        </h1>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold">
              Departments
            </h2>

            <p className="mt-2 text-3xl font-bold">
              {departments.data?.count ?? 0}
            </p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold">
              Programs
            </h2>

            <p className="mt-2 text-3xl font-bold">
              {programs.data?.count ?? 0}
            </p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold">
              Academic Years
            </h2>

            <p className="mt-2 text-3xl font-bold">
              {academicYears.data?.count ?? 0}
            </p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold">
              Semesters
            </h2>

            <p className="mt-2 text-3xl font-bold">
              {semesters.data?.count ?? 0}
            </p>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold">
              Courses
            </h2>

            <p className="mt-2 text-3xl font-bold">
              {courses.data?.count ?? 0}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}