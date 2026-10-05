import { useMemo, useState } from 'react'
import { CalendarDays, Clock3, Search, ShieldCheck } from 'lucide-react'
import { useMyExaminations } from '../hooks/useStudentExaminations'

const examTypeLabels: Record<string, string> = {
  MID_I: 'Mid-I',
  MID_II: 'Mid-II',
  SEMESTER: 'Semester End',
  LAB: 'Laboratory',
  INTERNAL: 'Internal Assessment',
}

export default function StudentExaminationsPage() {
  const { data, isLoading, isError } = useMyExaminations()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('ALL')

  const exams = useMemo(() => {
    const value = search.trim().toLowerCase()
    return (data?.results ?? []).filter((exam) => {
      const matchesSearch =
        !value ||
        exam.name.toLowerCase().includes(value) ||
        (exam.program_name ?? '').toLowerCase().includes(value) ||
        String(exam.semester_number).includes(value)

      return matchesSearch && (type === 'ALL' || exam.exam_type === type)
    })
  }, [data?.results, search, type])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">Examinations</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              View published examinations for the semesters in which you are
              actively enrolled.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-sm">
            <span className="text-slate-400">Published exams</span>
            <p className="mt-1 text-xl font-semibold">{data?.count ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search examination, program, or semester..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All examination types</option>
            {Object.entries(examTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </section>

      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading your examination schedule...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Unable to load examinations. Please try again.
        </div>
      )}

      {!isLoading && !isError && exams.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900">No examinations found</h2>
          <p className="mt-1 text-sm text-slate-500">
            Published examinations for your active enrollments will appear here.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {exams.map((exam) => (
          <article
            key={exam.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {examTypeLabels[exam.exam_type] ?? exam.exam_type}
                </span>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{exam.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {exam.program_name} · Semester {exam.semester_number}
                </p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Published
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Examination period</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  {exam.start_date} → {exam.end_date}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Maximum marks</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Clock3 className="h-4 w-4 text-blue-600" />
                  {exam.max_marks}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
