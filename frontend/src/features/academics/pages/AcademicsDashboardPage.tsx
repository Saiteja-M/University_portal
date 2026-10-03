import { useNavigate } from 'react-router-dom'
import {
  useAcademicYears,
  useCourses,
  useDepartments,
  usePrograms,
  useRegulations,
  useSemesters,
} from '../hooks'

function StatCard({
  title,
  value,
  active,
  description,
}: {
  title: string
  value: number
  active?: number
  description: string
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
          Academic
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {description}
        </p>

        {active !== undefined && (
          <span className="text-sm font-semibold text-green-600">
            {active} active
          </span>
        )}
      </div>
    </div>
  )
}

export default function AcademicsDashboardPage() {
  const navigate = useNavigate()

  const departmentsQuery = useDepartments()
  const programsQuery = usePrograms()
  const regulationsQuery = useRegulations()
  const academicYearsQuery = useAcademicYears()
  const semestersQuery = useSemesters()
  const coursesQuery = useCourses()

  const departments = departmentsQuery.data?.results ?? []
  const programs = programsQuery.data?.results ?? []
  const regulations = regulationsQuery.data?.results ?? []
  const academicYears = academicYearsQuery.data?.results ?? []
  const semesters = semestersQuery.data?.results ?? []
  const courses = coursesQuery.data?.results ?? []

  const activeDepartments = departments.filter(
    (item) => item.is_active,
  ).length

  const activePrograms = programs.filter(
    (item) => item.is_active,
  ).length

  const activeRegulations = regulations.filter(
    (item) => item.is_active,
  ).length

  const activeAcademicYears = academicYears.filter(
    (item) => item.is_current,
  ).length

  const activeSemesters = semesters.filter(
    (item) => item.is_active,
  ).length

  const activeCourses = courses.filter(
    (item) => item.is_active,
  ).length

  const isLoading =
    departmentsQuery.isLoading ||
    programsQuery.isLoading ||
    regulationsQuery.isLoading ||
    academicYearsQuery.isLoading ||
    semestersQuery.isLoading ||
    coursesQuery.isLoading

  const hasError =
    departmentsQuery.isError ||
    programsQuery.isError ||
    regulationsQuery.isError ||
    academicYearsQuery.isError ||
    semestersQuery.isError ||
    coursesQuery.isError

  const managementItems = [
    {
      title: 'Departments',
      description: 'Manage academic departments',
      path: '/academics/departments',
    },
    {
      title: 'Programs',
      description: 'Manage degree programs',
      path: '/academics/programs',
    },
    {
      title: 'Regulations',
      description: 'Manage program regulations',
      path: '/academics/regulations',
    },
    {
      title: 'Academic Years',
      description: 'Manage academic years',
      path: '/academics/academic-years',
    },
    {
      title: 'Semesters',
      description: 'Manage program semesters',
      path: '/academics/semesters',
    },
    {
      title: 'Courses',
      description: 'Manage curriculum courses',
      path: '/academics/courses',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="text-sm font-medium text-blue-600">
            University Portal
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Academics
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Manage the university's academic structure,
            curriculum, programs, regulations, semesters,
            and courses.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Loading */}
        {isLoading && (
          <div className="mb-6 rounded-xl border bg-white p-5 text-sm text-gray-600 shadow-sm">
            Loading academic information...
          </div>
        )}

        {/* Error */}
        {hasError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-800">
              Unable to load academic information.
            </p>

            <p className="mt-1 text-sm text-red-700">
              Please check the backend API connection and try again.
            </p>
          </div>
        )}

        {/* Statistics */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Academic Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current academic structure across the university.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Departments"
              value={departments.length}
              active={activeDepartments}
              description="Academic departments"
            />

            <StatCard
              title="Programs"
              value={programs.length}
              active={activePrograms}
              description="Degree programs"
            />

            <StatCard
              title="Regulations"
              value={regulations.length}
              active={activeRegulations}
              description="Academic regulations"
            />

            <StatCard
              title="Academic Years"
              value={academicYears.length}
              active={activeAcademicYears}
              description="Current academic years"
            />

            <StatCard
              title="Semesters"
              value={semesters.length}
              active={activeSemesters}
              description="Academic semesters"
            />

            <StatCard
              title="Courses"
              value={courses.length}
              active={activeCourses}
              description="Curriculum courses"
            />
          </div>
        </section>

        {/* Academic Structure */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Academic Structure
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Core relationships that define the academic system.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Department → Program
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {departments.length} departments
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Organize academic degree programs.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Program → Regulation
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {regulations.length} regulations
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Define curriculum rules for programs.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Semester → Course
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {courses.length} courses
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Organize courses within semesters.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Academic Management
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage individual areas of the academic structure.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {managementItems.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {item.description}
                    </p>
                  </div>

                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                    Manage
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Open {item.title}
                  <span className="ml-2">→</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}