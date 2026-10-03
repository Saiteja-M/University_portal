import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react'
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

  if (studentQuery.isLoading || coursesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-12 w-80 animate-pulse rounded-xl bg-gray-200" />

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (studentQuery.isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />

              <div>
                <h2 className="font-semibold text-red-900">
                  Unable to load student information
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  Please refresh the page and try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const student = studentQuery.data
  const courses = coursesQuery.data?.results ?? []
  const enrollment = student?.current_enrollment

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3 text-white">
              <BookOpen className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Courses
              </h1>

              <p className="text-sm text-gray-500">
                Courses assigned to your current semester.
              </p>
            </div>
          </div>

          <Link
            to="/student"
            className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Academic Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Student ID
            </p>

            <p className="mt-2 font-bold text-gray-900">
              {student?.student_id ?? '—'}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Academic Year
            </p>

            <p className="mt-2 font-bold text-gray-900">
              {enrollment?.academic_year_name ?? '—'}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Semester
            </p>

            <p className="mt-2 font-bold text-gray-900">
              {enrollment?.semester_number
                ? `Semester ${enrollment.semester_number}`
                : '—'}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Courses
            </p>

            <p className="mt-2 font-bold text-blue-600">
              {courses.length}
            </p>
          </div>
        </div>

        {/* No enrollment */}
        {!enrollment && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
            <div className="flex gap-3">
              <CalendarDays className="h-6 w-6 text-yellow-600" />

              <div>
                <h2 className="font-semibold text-yellow-900">
                  No active enrollment found
                </h2>

                <p className="mt-1 text-sm text-yellow-800">
                  Your current semester enrollment has not been
                  configured yet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Courses */}
        {enrollment && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Semester {enrollment.semester_number} Courses
              </h2>

              <p className="text-sm text-gray-500">
                {student?.program_name}
              </p>
            </div>

            {courses.length === 0 ? (
              <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
                <BookOpen className="mx-auto h-10 w-10 text-gray-400" />

                <h3 className="mt-4 font-semibold text-gray-900">
                  No courses found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  No active courses have been assigned to your
                  current semester.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="rounded-xl bg-blue-50 p-3">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-bold text-blue-600">
                        {course.code}
                      </p>

                      <h3 className="mt-1 text-lg font-semibold text-gray-900">
                        {course.name}
                      </h3>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Credits
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {course.credits}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Semester
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {course.semester_number}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t pt-4">
                      <p className="text-xs text-gray-500">
                        Program
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-800">
                        {course.program_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}