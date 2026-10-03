import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import axios from 'axios'

import { studentsApi } from './api/studentsApi'
import { useStudent } from './hooks/useStudents'
import type { StudentStatus } from './types/students'

function InfoItem({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  const displayValue =
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ''
      ? String(value)
      : 'Not provided'

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-900">
        {displayValue}
      </p>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="px-6 py-6">
        {children}
      </div>
    </section>
  )
}

function statusClasses(status: StudentStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'

    case 'INACTIVE':
      return 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200'

    case 'GRADUATED':
      return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'

    case 'SUSPENDED':
      return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'

    case 'DROPPED':
      return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'

    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}

function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return 'Not provided'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Not provided'
  }

  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getInitials(
  firstName: string,
  lastName: string,
) {
  const initials =
    `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`
      .toUpperCase()

  return initials || 'ST'
}

export function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>()

  const studentId = Number(id)

  const studentQuery = useStudent(studentId)

  const [downloading, setDownloading] =
    useState(false)

  const [deactivating, setDeactivating] =
    useState(false)

  const [actionMessage, setActionMessage] =
    useState('')

  const student = studentQuery.data

  const handleDownloadProfile = async () => {
    if (!student) {
      return
    }

    setDownloading(true)
    setActionMessage('')

    try {
      const blob =
        await studentsApi.downloadProfilePdf(
          student.id,
        )

      const url =
        window.URL.createObjectURL(blob)

      const anchor =
        document.createElement('a')

      anchor.href = url

      anchor.download =
        `${student.student_id}_student_profile.pdf`

      document.body.appendChild(anchor)

      anchor.click()

      anchor.remove()

      window.URL.revokeObjectURL(url)

      setActionMessage(
        'Student profile downloaded successfully.',
      )
    } catch (error) {
      console.error(
        'Failed to download student profile:',
        error,
      )

      setActionMessage(
        'Unable to download the student profile.',
      )
    } finally {
      setDownloading(false)
    }
  }

  const handleDeactivateAccount =
    async () => {
      if (!student) {
        return
      }

      if (!student.user) {
        setActionMessage(
          'This student has not registered a portal account.',
        )

        return
      }

      const confirmed =
        window.confirm(
          `Deactivate the student portal account for ${student.student_id}?\n\n` +
            'The student will no longer be able to log in. ' +
            'Academic records will be preserved.',
        )

      if (!confirmed) {
        return
      }

      setDeactivating(true)
      setActionMessage('')

      try {
        const result =
          await studentsApi.deactivateAccount(
            student.id,
          )

        setActionMessage(
          result.detail ||
            'Student account deactivated successfully.',
        )

        await studentQuery.refetch()
      } catch (error) {
        console.error(
          'Failed to deactivate student account:',
          error,
        )

        setActionMessage(
          'Unable to deactivate the student account.',
        )
      } finally {
        setDeactivating(false)
      }
    }

  const handlePermanentDelete = async () => {
    if (!student) {
      return
    }

    const studentName =
      `${student.first_name || ''} ${student.last_name || ''}`.trim() ||
      student.student_id

    const confirmation = window.prompt(
      `PERMANENT DELETION\\n\\n` +
        `Student: ${student.student_id}\\n` +
        `Name: ${studentName}\\n\\n` +
        `This will permanently delete the student record, portal account, ` +
        `profile, guardians, enrollments, and uploaded photo.\\n\\n` +
        `This action cannot be undone.\\n\\n` +
        `Type DELETE to continue:`,
    )

    if (confirmation !== 'DELETE') {
      return
    }

    setActionMessage('')

    try {
      await studentsApi.permanentDelete(student.id)

      window.alert(
        `Student ${student.student_id} has been permanently deleted.`,
      )

      window.location.href = '/students'
    } catch (deleteError) {
      console.error(
        'Failed to permanently delete student:',
        deleteError,
      )

      if (axios.isAxiosError(deleteError)) {
        const data = deleteError.response?.data

        if (
          data &&
          typeof data === 'object' &&
          'detail' in data
        ) {
          setActionMessage(String(data.detail))
        } else {
          setActionMessage(
            'Unable to permanently delete the student.',
          )
        }
      } else {
        setActionMessage(
          'Unable to permanently delete the student.',
        )
      }
    }
  }

  if (
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Invalid Student ID
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The requested student identifier is
            not valid.
          </p>

          <Link
            to="/students"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
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
        <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-5 text-sm font-semibold text-slate-700">
            Loading student profile
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Retrieving university records...
          </p>
        </div>
      </main>
    )
  }

  if (
    studentQuery.isError ||
    !student
  ) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/students"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to Students
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">
              Unable to load student
            </h1>

            <p className="mt-2 text-sm text-red-600">
              The requested student could not be loaded.
            </p>

            <button
              type="button"
              onClick={() =>
                studentQuery.refetch()
              }
              className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    )
  }

  const firstName =
    student.first_name || ''

  const lastName =
    student.last_name || ''

  const initials =
    getInitials(firstName, lastName)

  const currentEnrollment =
    student.current_enrollment

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/students"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Students
          </Link>
        </div>

        {/* Hero */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-900 px-6 py-8 text-white md:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-5">
                {student.profile?.photo ? (
                  <img
                    src={student.profile.photo}
                    alt={`${firstName} ${lastName}`}
                    className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/10"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold">
                    {initials}
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Student Profile
                  </p>

                  <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                    {`${firstName} ${lastName}`.trim() ||
                      student.student_id}
                  </h1>

                  <p className="mt-1 text-sm text-slate-300">
                    {student.student_id}
                    {' • '}
                    {student.program_name}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusClasses(
                  student.status,
                )}`}
              >
                {formatStatus(student.status)}
              </span>
            </div>
          </div>

          <div className="grid gap-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
            <InfoItem
              label="Student ID"
              value={student.student_id}
            />

            <InfoItem
              label="Admission Number"
              value={student.admission_number}
            />

            <InfoItem
              label="Department"
              value={student.department_name}
            />

            <InfoItem
              label="Program"
              value={student.program_name}
            />
          </div>
        </section>

        {/* Administrative actions */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Administrative Actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Authorized student-account and document operations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownloadProfile}
                disabled={downloading}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading
                  ? 'Preparing PDF...'
                  : 'Download Full Profile'}
              </button>
              

              <Link
                to={`/students/${student.id}/edit`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Edit Student
              </Link>

              {student.user && (
                <button
                  type="button"
                  onClick={handleDeactivateAccount}
                  disabled={
                    deactivating ||
                    student.status !== 'ACTIVE'
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deactivating
                    ? 'Deactivating...'
                    : 'Deactivate Portal Account'}
                </button>
              )}
              <button
                type="button"
                onClick={() => void handlePermanentDelete()}
                className="inline-flex items-center justify-center rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
              >
                Permanently Delete Student
              </button>
            </div>
          </div>
          

          {actionMessage && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
              {actionMessage}
            </div>
          )}
          
        </section>
          {/* Administrative actions section ends here. */}
        

        {/* Academic information */}
        <div className="mt-6">
          <Section
            title="Academic Information"
            description="Current academic placement and enrollment."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                label="Program"
                value={student.program_name}
              />

              <InfoItem
                label="Department"
                value={student.department_name}
              />

              <InfoItem
                label="Academic Year"
                value={currentEnrollment?.academic_year_name}
              />

              <InfoItem
                label="Semester"
                value={
                  currentEnrollment
                    ? `Semester ${currentEnrollment.semester_number}`
                    : null
                }
              />

              <InfoItem
                label="Year of Study"
                value={
                  currentEnrollment?.year_of_study
                }
              />

              <InfoItem
                label="Enrollment Status"
                value={
                  currentEnrollment?.status
                }
              />

              <InfoItem
                label="Enrollment Date"
                value={formatDate(
                  currentEnrollment?.enrollment_date,
                )}
              />

              <InfoItem
                label="Admission Date"
                value={formatDate(
                  student.admission_date,
                )}
              />
            </div>
          </Section>
        </div>

        {/* Personal information */}
        <div className="mt-6">
          <Section
            title="Personal Information"
            description="Official personal information associated with the student."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                label="First Name"
                value={student.first_name}
              />

              <InfoItem
                label="Last Name"
                value={student.last_name}
              />

              <InfoItem
                label="Date of Birth"
                value={formatDate(
                  student.profile?.date_of_birth,
                )}
              />

              <InfoItem
                label="Gender"
                value={student.profile?.gender}
              />

              <InfoItem
                label="Blood Group"
                value={student.profile?.blood_group}
              />

              <InfoItem
                label="Phone"
                value={student.profile?.phone_number}
              />

              <InfoItem
                label="Institutional Email"
                value={
                  student.profile?.institutional_email ||
                  student.email
                }
              />

              <InfoItem
                label="Alternate Phone"
                value={
                  student.profile?.alternate_phone_number
                }
              />
            </div>
          </Section>
        </div>

        {/* Address */}
        <div className="mt-6">
          <Section
            title="Address"
            description="Registered residential/contact address."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                label="Address"
                value={student.profile?.address}
              />

              <InfoItem
                label="City"
                value={student.profile?.city}
              />

              <InfoItem
                label="State"
                value={student.profile?.state}
              />

              <InfoItem
                label="Postal Code"
                value={student.profile?.postal_code}
              />
            </div>
          </Section>
        </div>

        {/* Guardians */}
        <div className="mt-6">
          <Section
            title="Guardian Information"
            description="Registered parent or guardian records."
          >
            {student.guardians?.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {student.guardians.map(
                  (guardian) => (
                    <div
                      key={guardian.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {guardian.name}
                          </h3>

                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {guardian.relationship}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <InfoItem
                          label="Phone"
                          value={
                            guardian.phone_number
                          }
                        />

                        <InfoItem
                          label="Email"
                          value={guardian.email}
                        />

                        <InfoItem
                          label="Occupation"
                          value={
                            guardian.occupation
                          }
                        />

                        <InfoItem
                          label="Address"
                          value={
                            guardian.address
                          }
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                No guardian records available.
              </div>
            )}
          </Section>
        </div>

        {/* Account */}
        <div className="mt-6">
          <Section
            title="Portal Account"
            description="Authentication and portal registration status."
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                label="Username"
                value={student.username}
              />

              <InfoItem
                label="Portal Email"
                value={student.email}
              />

              <InfoItem
                label="Account"
                value={
                  student.user
                    ? 'Registered'
                    : 'Not registered'
                }
              />

              <InfoItem
                label="Student Status"
                value={formatStatus(
                  student.status,
                )}
              />
            </div>
          </Section>
        </div>

        {/* Future modules */}
        <div className="mt-6">
          <Section
            title="Student 360° Services"
            description="Modules that will connect to this student's official records."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                'Attendance',
                'Courses',
                'Examinations & Results',
                'Fees & Payments',
              ].map((module) => (
                <div
                  key={module}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="font-semibold text-slate-800">
                    {module}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Module integration pending
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Bottom navigation */}
        <div className="mt-6 flex justify-end border-t border-slate-200 pt-6">
          <Link
            to="/students"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to Students
          </Link>
        </div>
      </div>
    </main>
  )
}

export default StudentDetailsPage