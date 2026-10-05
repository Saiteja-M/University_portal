import { useMemo, useState } from 'react'

import { useCourseOfferings } from '../../academics/hooks/useAcademics'
import {
  useCreateCourseOfferingEnrollment,
  useCourseOfferingEnrollments,
  useDeleteCourseOfferingEnrollment,
  useStudents,
  useEnrollments,
} from '../hooks/useStudents'

export default function StudentCourseOfferingsPage() {
  const [search, setSearch] = useState('')
  const [studentEnrollment, setStudentEnrollment] = useState<number | ''>('')
  const [offering, setOffering] = useState<number | ''>('')

  const students = useStudents({ search: search || '' })
  const offerings = useCourseOfferings()
  const enrollments = useEnrollments()
  const assigned = useCourseOfferingEnrollments({ search })

  const create = useCreateCourseOfferingEnrollment()
  const remove = useDeleteCourseOfferingEnrollment()

  const activeEnrollments = useMemo(
    () => (enrollments.data?.results ?? []).filter((item) => item.status === 'ACTIVE'),
    [enrollments.data],
  )

  const availableOfferings = useMemo(
    () => (offerings.data?.results ?? []).filter((item) => item.status !== 'CLOSED' && item.status !== 'CANCELLED'),
    [offerings.data],
  )

  const selectedEnrollment = activeEnrollments.find((item) => item.id === studentEnrollment)

  const compatibleOfferings = selectedEnrollment
    ? availableOfferings.filter(
        (item) =>
          item.academic_year === selectedEnrollment.academic_year &&
          item.semester === selectedEnrollment.semester,
      )
    : availableOfferings

  const handleAssign = async () => {
    if (!studentEnrollment || !offering) return
    await create.mutateAsync({
      student_enrollment: studentEnrollment,
      offering,
      enrolled_date: new Date().toISOString().slice(0, 10),
      status: 'ENROLLED',
    })
    setOffering('')
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Course Offering Students</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enroll students from their active semester enrollment into specific course offerings.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Search student</label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Student ID or name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Student semester enrollment</label>
          <select
            value={studentEnrollment}
            onChange={(event) => {
              setStudentEnrollment(event.target.value ? Number(event.target.value) : '')
              setOffering('')
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select active enrollment</option>
            {activeEnrollments
              .filter((item) => {
                if (!search) return true
                const student = students.data?.results.find((s) => s.id === item.student)
                const label = (student?.student_id ?? '') + ' ' + (student?.first_name ?? '') + ' ' + (student?.last_name ?? '')
                return label.toLowerCase().includes(search.toLowerCase())
              })
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.student_id} — {item.program_name} — {item.academic_year_name} — Sem {item.semester_number}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Course offering</label>
          <select
            value={offering}
            onChange={(event) => setOffering(event.target.value ? Number(event.target.value) : '')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select course offering</option>
            {compatibleOfferings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.course_code} — {item.course_name} — {item.section}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <button
            type="button"
            onClick={handleAssign}
            disabled={!studentEnrollment || !offering || create.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {create.isPending ? 'Enrolling...' : 'Enroll Student'}
          </button>
          {create.error && (
            <p className="mt-2 text-sm text-red-600">
              {create.error instanceof Error ? create.error.message : 'Unable to enroll student.'}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Current course enrollments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Program</th>
                <th className="px-5 py-3">Year / Semester</th>
                <th className="px-5 py-3">Section</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(assigned.data?.results ?? []).map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {item.student_id}
                    <div className="text-xs font-normal text-slate-500">{item.student_name}</div>
                  </td>
                  <td className="px-5 py-3">
                    {item.course_code}
                    <div className="text-xs text-slate-500">{item.course_name}</div>
                  </td>
                  <td className="px-5 py-3">{item.program_name}</td>
                  <td className="px-5 py-3">{item.academic_year_name} / Sem {item.semester_number}</td>
                  <td className="px-5 py-3">{item.section}</td>
                  <td className="px-5 py-3">{item.status}</td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => remove.mutate(item.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {!assigned.isLoading && !(assigned.data?.results?.length) && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No course offering enrollments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
