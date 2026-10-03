import {
  AlertCircle,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  XCircle,
} from 'lucide-react'

import {
  useMyResults,
  useMyResultsSummary,
} from '../examinations/hooks/useExaminations'


function formatNumber(
  value: number | string | null | undefined,
  digits = 2,
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  const numberValue = Number(value)

  if (Number.isNaN(numberValue)) {
    return String(value)
  }

  return numberValue.toFixed(digits)
}


function getStatusClasses(
  status: string,
) {
  switch (status) {
    case 'PASS':
      return 'bg-green-50 text-green-700 ring-green-200'

    case 'FAIL':
      return 'bg-red-50 text-red-700 ring-red-200'

    case 'ABSENT':
      return 'bg-amber-50 text-amber-700 ring-amber-200'

    case 'WITHHELD':
      return 'bg-gray-100 text-gray-700 ring-gray-200'

    default:
      return 'bg-gray-50 text-gray-600 ring-gray-200'
  }
}


function getStatusIcon(
  status: string,
) {
  switch (status) {
    case 'PASS':
      return (
        <CheckCircle2
          className="h-4 w-4"
        />
      )

    case 'FAIL':
      return (
        <XCircle
          className="h-4 w-4"
        />
      )

    case 'ABSENT':
      return (
        <Clock3
          className="h-4 w-4"
        />
      )

    default:
      return (
        <AlertCircle
          className="h-4 w-4"
        />
      )
  }
}


function getExamTypeLabel(
  examType: string,
) {
  switch (examType) {
    case 'MID_I':
      return 'Mid-I'

    case 'MID_II':
      return 'Mid-II'

    case 'SEMESTER':
      return 'Semester End'

    case 'LAB':
      return 'Laboratory'

    case 'INTERNAL':
      return 'Internal'

    default:
      return examType
  }
}


export default function StudentResultsPage() {
  const resultsQuery = useMyResults()

  const summaryQuery =
    useMyResultsSummary()


  if (
    resultsQuery.isLoading ||
    summaryQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="h-8 w-8 animate-spin text-blue-600"
          />

          <p className="text-sm text-gray-500">
            Loading examination results...
          </p>
        </div>
      </div>
    )
  }


  if (
    resultsQuery.isError ||
    summaryQuery.isError
  ) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load results
              </h2>

              <p className="mt-1 text-sm text-red-700">
                There was a problem while loading your
                examination results. Please try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }


  const results =
    resultsQuery.data?.results ?? []

  const semesters =
    summaryQuery.data?.semesters ?? []

  const studentId =
    resultsQuery.data?.student_id ??
    summaryQuery.data?.student_id ??
    '—'


  const latestSemester =
    semesters.length > 0
      ? semesters[semesters.length - 1]
      : null


  const latestSgpa =
    latestSemester?.sgpa ?? null


  const totalCredits =
    latestSemester?.total_credits ?? 0


  const passedCount =
    results.filter(
      (result) =>
        result.status === 'PASS',
    ).length


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =====================================================
            PAGE HEADER
            ===================================================== */}

        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3">
                  <GraduationCap
                    className="h-7 w-7 text-blue-600"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Examination Results
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    View your published examination results,
                    grades and semester performance.
                  </p>
                </div>
              </div>
            </div>


            <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Student ID
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {studentId}
              </p>
            </div>

          </div>
        </div>


        {/* =====================================================
            SUMMARY CARDS
            ===================================================== */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Latest SGPA */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Latest SGPA
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {latestSgpa !== null
                    ? formatNumber(latestSgpa)
                    : '—'}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <Award
                  className="h-6 w-6 text-blue-600"
                />
              </div>
            </div>
          </div>


          {/* Credits */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Latest Credits
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalCredits}
                </p>
              </div>

              <div className="rounded-lg bg-purple-50 p-3">
                <BookOpen
                  className="h-6 w-6 text-purple-600"
                />
              </div>
            </div>
          </div>


          {/* Published Results */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Published Results
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {results.length}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-3">
                <FileText
                  className="h-6 w-6 text-green-600"
                />
              </div>
            </div>
          </div>


          {/* Passed */}

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Passed Subjects
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {passedCount}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3">
                <CheckCircle2
                  className="h-6 w-6 text-emerald-600"
                />
              </div>
            </div>
          </div>

        </div>


        {/* =====================================================
            NO RESULTS
            ===================================================== */}

        {results.length === 0 && (
          <div className="rounded-xl border bg-white px-6 py-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <FileText
                className="h-8 w-8 text-blue-600"
              />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-900">
              No results published
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Your examination results have not been published yet.
              Once the university publishes your results, they will
              appear here automatically.
            </p>

          </div>
        )}


        {/* =====================================================
            SEMESTER SUMMARY
            ===================================================== */}

        {semesters.length > 0 && (
          <section className="mb-8">

            <div className="mb-4 flex items-center gap-2">
              <CalendarDays
                className="h-5 w-5 text-blue-600"
              />

              <h2 className="text-lg font-semibold text-gray-900">
                Semester Performance
              </h2>
            </div>


            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {semesters.map(
                (semester) => (
                  <div
                    key={semester.semester}
                    className="rounded-xl border bg-white p-5 shadow-sm"
                  >

                    <div className="flex items-start justify-between">

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Semester
                        </p>

                        <h3 className="mt-1 text-lg font-semibold text-gray-900">
                          Semester {semester.semester_number}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {semester.academic_year_name}
                        </p>
                      </div>


                      <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                        <p className="text-xs text-blue-600">
                          SGPA
                        </p>

                        <p className="text-xl font-bold text-blue-700">
                          {semester.sgpa !== null
                            ? formatNumber(
                                semester.sgpa,
                              )
                            : '—'}
                        </p>
                      </div>

                    </div>


                    <div className="mt-5 border-t pt-4">
                      <div className="flex justify-between text-sm">

                        <span className="text-gray-500">
                          Credits
                        </span>

                        <span className="font-semibold text-gray-900">
                          {semester.total_credits}
                        </span>

                      </div>

                      <div className="mt-2 flex justify-between text-sm">

                        <span className="text-gray-500">
                          Subjects
                        </span>

                        <span className="font-semibold text-gray-900">
                          {semester.results.length}
                        </span>

                      </div>
                    </div>

                  </div>
                ),
              )}

            </div>

          </section>
        )}


        {/* =====================================================
            RESULT TABLE
            ===================================================== */}

        {results.length > 0 && (
          <section>

            <div className="mb-4 flex items-center gap-2">
              <FileText
                className="h-5 w-5 text-blue-600"
              />

              <h2 className="text-lg font-semibold text-gray-900">
                Published Results
              </h2>
            </div>


            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-gray-200">

                  <thead className="bg-gray-50">

                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Exam
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Course
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Credits
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Marks
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Grade
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Grade Point
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                    </tr>

                  </thead>


                  <tbody className="divide-y divide-gray-100 bg-white">

                    {results.map(
                      (result) => (
                        <tr
                          key={result.id}
                          className="transition hover:bg-gray-50"
                        >

                          <td className="px-5 py-4">

                            <div className="font-medium text-gray-900">
                              {result.exam_name}
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                              {getExamTypeLabel(
                                result.exam_type,
                              )}
                            </div>

                          </td>


                          <td className="px-5 py-4">

                            <div className="font-medium text-gray-900">
                              {result.course_code}
                            </div>

                            <div className="mt-1 max-w-xs text-sm text-gray-500">
                              {result.course_name}
                            </div>

                          </td>


                          <td className="px-5 py-4 text-center text-sm font-medium text-gray-700">
                            {result.credits}
                          </td>


                          <td className="px-5 py-4 text-center">

                            <span className="font-semibold text-gray-900">
                              {formatNumber(
                                result.marks,
                              )}
                            </span>

                            <span className="text-xs text-gray-400">
                              {' '}
                              / {result.max_marks}
                            </span>

                          </td>


                          <td className="px-5 py-4 text-center">

                            <span className="text-lg font-bold text-gray-900">
                              {result.grade || '—'}
                            </span>

                          </td>


                          <td className="px-5 py-4 text-center">

                            <span className="font-semibold text-gray-900">
                              {formatNumber(
                                result.grade_point,
                              )}
                            </span>

                          </td>


                          <td className="px-5 py-4 text-center">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
                                result.status,
                              )}`}
                            >
                              {getStatusIcon(
                                result.status,
                              )}

                              {result.status}
                            </span>

                          </td>

                        </tr>
                      ),
                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>
        )}

      </div>
    </div>
  )
}