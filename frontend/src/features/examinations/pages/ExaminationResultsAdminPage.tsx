import { useMemo, useState } from 'react'
import {
  useAdminResults,
  useCreateAdminResult,
  useDeleteAdminResult,
  useExams,
  useUpdateAdminResult,
} from '../hooks/useExaminations'
import { useStudents } from '../../students/hooks/useStudents'
import { useCourseOfferings } from '../../academics/hooks/useAcademics'
import type { Student } from '../../students/types/students'
import type { CourseOffering } from '../../academics/types/academics'
import type { Exam } from '../types/adminExaminations'
import type { ResultStatus } from '../types/examinations'

type ResultForm = {
  student: number
  exam: number
  course_offering: number
  marks: number
  grade: string
  grade_point: number | null
  status: ResultStatus
  remarks: string
}

const emptyForm: ResultForm = {
  student: 0,
  exam: 0,
  course_offering: 0,
  marks: 0,
  grade: '',
  grade_point: null,
  status: 'PASS',
  remarks: '',
}

const statuses: ResultStatus[] = ['PASS', 'FAIL', 'ABSENT', 'WITHHELD']

function studentLabel(student: Student) {
  const name = [student.first_name, student.last_name].filter(Boolean).join(' ')
  return name ? `${student.student_id} — ${name}` : student.student_id
}

export function ExaminationResultsAdminPage() {
  const [selectedExam, setSelectedExam] = useState<number | undefined>()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ResultStatus | ''>('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<ResultForm>(emptyForm)
  const [error, setError] = useState('')

  const examsQuery = useExams({ ordering: '-start_date' })
  const resultsQuery = useAdminResults(selectedExam ? { exam: selectedExam } : undefined)
  const studentsQuery = useStudents({ ordering: 'student_id' })
  const offeringsQuery = useCourseOfferings()

  const createResult = useCreateAdminResult()
  const updateResult = useUpdateAdminResult()
  const deleteResult = useDeleteAdminResult()

  const exams = examsQuery.data?.results ?? []
  const results = resultsQuery.data?.results ?? []
  const students = studentsQuery.data?.results ?? []
  const offerings = offeringsQuery.data?.results ?? []

  const exam = exams.find((item) => item.id === selectedExam)

  const compatibleOfferings = useMemo(() => {
    if (!form.exam) return offerings
    const selected = exams.find((item) => item.id === form.exam)
    if (!selected) return offerings
    return offerings.filter(
      (item) =>
        item.semester === selected.semester &&
        item.is_active &&
        item.status !== 'CLOSED' &&
        item.status !== 'CANCELLED',
    )
  }, [exams, form.exam, offerings])

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    return results.filter((result) => {
      const matchesSearch =
        !q ||
        result.student_id.toLowerCase().includes(q) ||
        result.student_name.toLowerCase().includes(q) ||
        result.course_code.toLowerCase().includes(q) ||
        result.course_name.toLowerCase().includes(q) ||
        result.section.toLowerCase().includes(q)
      return matchesSearch && (!statusFilter || result.status === statusFilter)
    })
  }, [results, search, statusFilter])

  const reset = () => {
    setForm(emptyForm)
    setEditing(null)
    setError('')
  }

  const openCreate = () => {
    reset()
    setForm((current) => ({ ...current, exam: selectedExam ?? 0 }))
    setModal(true)
  }

  const openEdit = (result: any) => {
    setEditing(result)
    setForm({
      student: result.student,
      exam: result.exam,
      course_offering: result.course_offering,
      marks: Number(result.marks),
      grade: result.grade ?? '',
      grade_point: result.grade_point == null ? null : Number(result.grade_point),
      status: result.status,
      remarks: result.remarks ?? '',
    })
    setError('')
    setModal(true)
  }

  const save = async () => {
    setError('')
    if (!form.student || !form.exam || !form.course_offering) {
      setError('Student, examination and course offering are required.')
      return
    }
    const selected = exams.find((item) => item.id === form.exam)
    if (selected && form.marks > selected.max_marks) {
      setError(`Marks cannot exceed ${selected.max_marks}.`)
      return
    }
    try {
      if (editing) {
        await updateResult.mutateAsync({ id: editing.id, data: form })
      } else {
        await createResult.mutateAsync({ ...form })
      }
      setModal(false)
      reset()
    } catch {
      setError('Unable to save result. Check the examination, offering and student enrollment.')
    }
  }

  const remove = async (id: number) => {
    if (!window.confirm('Delete this result?')) return
    try {
      await deleteResult.mutateAsync(id)
    } catch {
      window.alert('Unable to delete the result.')
    }
  }

  const loading =
    examsQuery.isLoading ||
    resultsQuery.isLoading ||
    studentsQuery.isLoading ||
    offeringsQuery.isLoading

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">EXAMINATIONS</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Student Results</h1>
              <p className="mt-1 text-sm text-slate-500">
                Record results against the exact course offering in which the student is enrolled.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add Result
            </button>
          </div>
        </header>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Examination</label>
            <select
              value={selectedExam ?? ''}
              onChange={(e) => setSelectedExam(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="">Select examination</option>
              {exams.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — Sem {item.semester_number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Student ID, name, course or section"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ResultStatus | '')}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="">All statuses</option>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </section>

        {exam && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div><p className="text-xs uppercase text-blue-600">Examination</p><p className="mt-1 font-semibold">{exam.name}</p></div>
              <div><p className="text-xs uppercase text-blue-600">Type</p><p className="mt-1 font-semibold">{exam.exam_type}</p></div>
              <div><p className="text-xs uppercase text-blue-600">Semester</p><p className="mt-1 font-semibold">Semester {exam.semester_number}</p></div>
              <div><p className="text-xs uppercase text-blue-600">Publication</p><p className="mt-1 font-semibold">{exam.is_published ? 'Published' : 'Draft'}</p></div>
            </div>
          </section>
        )}

        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Loading results...</div>
        ) : !selectedExam ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Select an examination to manage its results.</div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Course Offering</th>
                    <th className="px-5 py-4">Marks</th>
                    <th className="px-5 py-4">Grade</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{result.student_id}</p>
                        <p className="text-xs text-slate-500">{result.student_name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{result.course_code} — {result.course_name}</p>
                        <p className="text-xs text-slate-500">Section {result.section}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold">{result.marks} / {result.max_marks}</td>
                      <td className="px-5 py-4">{result.grade || '—'}</td>
                      <td className="px-5 py-4">{result.status}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => openEdit(result)} className="mr-3 text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => void remove(result.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredResults.length && <div className="p-8 text-center text-slate-500">No results found for this examination.</div>}
            </div>
          </section>
        )}

        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <div><h2 className="text-xl font-bold">Result Entry</h2><p className="text-sm text-slate-500">Student → Examination → Course Offering</p></div>
                <button onClick={() => setModal(false)} className="text-slate-500">✕</button>
              </div>
              {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium">Student
                  <select value={form.student} onChange={(e) => setForm({...form, student: Number(e.target.value)})} className="mt-2 w-full rounded-xl border px-3 py-2.5">
                    <option value={0}>Select student</option>
                    {students.map((item) => <option key={item.id} value={item.id}>{studentLabel(item)}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">Examination
                  <select value={form.exam} onChange={(e) => setForm({...form, exam: Number(e.target.value), course_offering: 0})} className="mt-2 w-full rounded-xl border px-3 py-2.5">
                    <option value={0}>Select examination</option>
                    {exams.filter((item) => !item.is_published).map((item) => <option key={item.id} value={item.id}>{item.name} — Sem {item.semester_number}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium md:col-span-2">Course Offering
                  <select value={form.course_offering} onChange={(e) => setForm({...form, course_offering: Number(e.target.value)})} className="mt-2 w-full rounded-xl border px-3 py-2.5">
                    <option value={0}>Select course offering</option>
                    {compatibleOfferings.map((item) => <option key={item.id} value={item.id}>{item.course_code} — {item.course_name} | {item.section}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">Marks
                  <input type="number" min={0} value={form.marks} onChange={(e) => setForm({...form, marks: Number(e.target.value)})} className="mt-2 w-full rounded-xl border px-3 py-2.5" />
                </label>
                <label className="text-sm font-medium">Grade
                  <input value={form.grade} onChange={(e) => setForm({...form, grade: e.target.value})} placeholder="A+" className="mt-2 w-full rounded-xl border px-3 py-2.5" />
                </label>
                <label className="text-sm font-medium">Grade Point
                  <input type="number" min={0} max={10} step="0.01" value={form.grade_point ?? ''} onChange={(e) => setForm({...form, grade_point: e.target.value === '' ? null : Number(e.target.value)})} className="mt-2 w-full rounded-xl border px-3 py-2.5" />
                </label>
                <label className="text-sm font-medium">Status
                  <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value as ResultStatus})} className="mt-2 w-full rounded-xl border px-3 py-2.5">
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium md:col-span-2">Remarks
                  <textarea value={form.remarks} onChange={(e) => setForm({...form, remarks: e.target.value})} rows={3} className="mt-2 w-full rounded-xl border px-3 py-2.5" />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setModal(false)} className="rounded-xl border px-5 py-2.5">Cancel</button>
                <button onClick={() => void save()} disabled={createResult.isPending || updateResult.isPending} className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">
                  {createResult.isPending || updateResult.isPending ? 'Saving...' : editing ? 'Update Result' : 'Save Result'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
