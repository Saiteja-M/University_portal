import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'

import { usePrograms } from '../academics/hooks'
import { useStudent, useUpdateStudent } from './hooks/useStudents'
import type { StudentStatus } from './types/students'

const studentStatusValues = [
  'ACTIVE',
  'INACTIVE',
  'GRADUATED',
  'SUSPENDED',
  'DROPPED',
] as const satisfies readonly StudentStatus[]

const studentEditSchema = z.object({
  student_id: z
    .string()
    .trim()
    .min(1, 'Student ID is required'),
  admission_number: z
    .string()
    .trim()
    .min(1, 'Admission number is required'),
  program: z
    .number()
    .int()
    .positive('Select a program'),
  admission_date: z
    .string()
    .min(1, 'Admission date is required'),
  status: z.enum(studentStatusValues),
})

type StudentEditFormData = z.infer<typeof studentEditSchema>

const statusLabels: Record<StudentStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  GRADUATED: 'Graduated',
  SUSPENDED: 'Suspended',
  DROPPED: 'Dropped',
}

export function StudentEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const studentId = Number(id)

  const studentQuery = useStudent(studentId)
  const programsQuery = usePrograms({ is_active: true })
  const updateStudent = useUpdateStudent()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentEditFormData>({
    resolver: zodResolver(studentEditSchema),
    defaultValues: {
      student_id: '',
      admission_number: '',
      program: 0,
      admission_date: '',
      status: 'ACTIVE',
    },
  })

  useEffect(() => {
    const student = studentQuery.data

    if (!student) {
      return
    }

    reset({
      student_id: student.student_id,
      admission_number: student.admission_number,
      program: student.program,
      admission_date: student.admission_date,
      status: student.status,
    })
  }, [studentQuery.data, reset])

  const onSubmit = (data: StudentEditFormData) => {
    updateStudent.mutate(
      {
        id: studentId,
        data: {
          student_id: data.student_id.trim(),
          admission_number: data.admission_number.trim(),
          program: data.program,
          admission_date: data.admission_date,
          status: data.status,
        },
      },
      {
        onSuccess: () => {
          navigate(`/students/${studentId}`)
        },
      },
    )
  }

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Invalid student
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The student identifier supplied in the URL is invalid.
          </p>
          <Link
            to="/students"
            className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to Students
          </Link>
        </div>
      </main>
    )
  }

  if (studentQuery.isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading student information...
          </p>
        </div>
      </main>
    )
  }

  if (studentQuery.isError || !studentQuery.data) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Unable to load student
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {axios.isAxiosError(studentQuery.error)
              ? (
                  studentQuery.error.response?.data?.detail ??
                  'Failed to load student information.'
                )
              : studentQuery.error instanceof Error
                ? studentQuery.error.message
                : 'Failed to load student information.'}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => studentQuery.refetch()}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Try Again
            </button>

            <Link
              to="/students"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Students
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const student = studentQuery.data

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6 md:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
          >
            <Link
              to="/students"
              className="transition hover:text-blue-600"
            >
              Students
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to={`/students/${studentId}`}
              className="transition hover:text-blue-600"
            >
              Student Details
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-700">Edit</span>
          </nav>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Student Management
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Edit Student
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Update the academic and identification information for{' '}
                <span className="font-semibold text-slate-900">
                  {student.student_id}
                </span>
                .
              </p>
            </div>

            <Link
              to={`/students/${studentId}`}
              className="inline-flex w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-8 md:px-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Student Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Maintain the official student identification details.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="student_id"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Student ID
                </label>
                <input
                  id="student_id"
                  type="text"
                  autoComplete="off"
                  {...register('student_id')}
                  aria-invalid={Boolean(errors.student_id)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm uppercase outline-none transition focus:ring-2 focus:ring-blue-100 ${
                    errors.student_id
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {errors.student_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.student_id.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="admission_number"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Admission Number
                </label>
                <input
                  id="admission_number"
                  type="text"
                  autoComplete="off"
                  {...register('admission_number')}
                  aria-invalid={Boolean(errors.admission_number)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm uppercase outline-none transition focus:ring-2 focus:ring-blue-100 ${
                    errors.admission_number
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {errors.admission_number && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.admission_number.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Academic Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update the programme and admission information associated with
                this student.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="program"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Programme
                </label>

                <select
                  id="program"
                  {...register('program', {
                    valueAsNumber: true,
                  })}
                  disabled={
                    programsQuery.isLoading ||
                    programsQuery.isError
                  }
                  aria-invalid={Boolean(errors.program)}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 ${
                    errors.program
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                >
                  <option value={0}>
                    {programsQuery.isLoading
                      ? 'Loading programmes...'
                      : 'Select Programme'}
                  </option>

                  {programsQuery.data?.results.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.code} — {program.name}
                    </option>
                  ))}
                </select>

                {errors.program && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.program.message}
                  </p>
                )}

                {programsQuery.isError && (
                  <p className="mt-1 text-xs text-red-600">
                    Unable to load active programmes. Please refresh and try
                    again.
                  </p>
                )}

                {!programsQuery.isLoading &&
                  !programsQuery.isError &&
                  programsQuery.data?.results.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No active programmes are available.
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor="admission_date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Admission Date
                </label>

                <input
                  id="admission_date"
                  type="date"
                  {...register('admission_date')}
                  aria-invalid={Boolean(errors.admission_date)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${
                    errors.admission_date
                      ? 'border-red-500'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />

                {errors.admission_date && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.admission_date.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Student Status
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Set the official lifecycle status of the student record.
              </p>
            </div>

            <div className="mt-5 max-w-md">
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                {...register('status')}
                aria-invalid={Boolean(errors.status)}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-100 ${
                  errors.status
                    ? 'border-red-500'
                    : 'border-slate-300 focus:border-blue-500'
                }`}
              >
                {studentStatusValues.map((value) => (
                  <option key={value} value={value}>
                    {statusLabels[value]}
                  </option>
                ))}
              </select>

              {errors.status && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.status.message}
                </p>
              )}
            </div>
          </section>

          {updateStudent.isError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <p className="text-sm font-semibold text-red-800">
                Update failed
              </p>
              <p className="mt-1 break-words text-sm text-red-700">
                {axios.isAxiosError(updateStudent.error)
                  ? (
                      updateStudent.error.response?.data?.detail ??
                      JSON.stringify(updateStudent.error.response?.data) ??
                      'Unable to update student.'
                    )
                  : updateStudent.error instanceof Error
                    ? updateStudent.error.message
                    : 'Unable to update student.'}
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              to={`/students/${studentId}`}
              className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                updateStudent.isPending ||
                programsQuery.isLoading
              }
              className="inline-flex justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateStudent.isPending
                ? 'Saving Changes...'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default StudentEditPage
