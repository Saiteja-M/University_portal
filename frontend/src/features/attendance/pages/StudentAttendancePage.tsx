import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  TrendingUp,
  XCircle,
} from 'lucide-react'

import { useMyAttendanceSummary } from '../hooks/useAttendance'

export default function StudentAttendancePage() {
  const {
    data,
    isLoading,
    isError,
  } = useMyAttendanceSummary()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-10 w-72 animate-pulse rounded-lg bg-gray-200" />

          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>

          <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-6 w-6 text-red-600" />

              <div>
                <h2 className="font-semibold text-red-900">
                  Unable to load attendance
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  We could not retrieve your attendance information.
                  Please try again later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { overall, courses, recent } = data

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3 text-white">
              <GraduationCap className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Attendance
              </h1>

              <p className="text-sm text-gray-500">
                View your attendance performance and recent records.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Attendance
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {overall.percentage}%
                </p>
              </div>

              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Classes
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {overall.total_classes}
                </p>
              </div>

              <BookOpen className="h-6 w-6 text-gray-700" />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Present
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {overall.present}
                </p>
              </div>

              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Absent
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {overall.absent}
                </p>
              </div>

              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock3 className="h-6 w-6 text-orange-500" />

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Attendance Overview
              </h2>

              <p className="text-sm text-gray-500">
                Summary of your attendance status.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-green-700">
                Present
              </p>

              <p className="mt-1 text-2xl font-bold text-green-800">
                {overall.present}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Absent
              </p>

              <p className="mt-1 text-2xl font-bold text-red-800">
                {overall.absent}
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-sm text-orange-700">
                Late
              </p>

              <p className="mt-1 text-2xl font-bold text-orange-800">
                {overall.late}
              </p>
            </div>
          </div>
        </div>

        {/* Course-wise */}
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Course-wise Attendance
                </h2>

                <p className="text-sm text-gray-500">
                  Attendance percentage for each course.
                </p>
              </div>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No attendance records available yet.
            </div>
          ) : (
            <div className="divide-y">
              {courses.map((course) => (
                <div
                  key={course.course_id}
                  className="p-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {course.course_code}
                      </p>

                      <p className="text-sm text-gray-500">
                        {course.course_name}
                      </p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {course.percentage}%
                      </p>

                      <p className="text-xs text-gray-500">
                        {course.present} present /{' '}
                        {course.total_classes} classes
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${Math.min(
                          course.percentage,
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex gap-5 text-xs">
                    <span className="text-green-600">
                      Present: {course.present}
                    </span>

                    <span className="text-red-600">
                      Absent: {course.absent}
                    </span>

                    <span className="text-orange-600">
                      Late: {course.late}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Records */}
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Attendance
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your latest attendance records.
            </p>
          </div>

          {recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No recent attendance records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Date
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Course
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Period
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {recent.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {new Date(
                          record.date,
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {record.course_code}
                        </p>

                        <p className="text-xs text-gray-500">
                          {record.course_name}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        Period {record.period}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {record.status === 'PRESENT' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Present
                          </span>
                        )}

                        {record.status === 'ABSENT' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            <XCircle className="h-3.5 w-3.5" />
                            Absent
                          </span>
                        )}

                        {record.status === 'LATE' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            <Clock3 className="h-3.5 w-3.5" />
                            Late
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}