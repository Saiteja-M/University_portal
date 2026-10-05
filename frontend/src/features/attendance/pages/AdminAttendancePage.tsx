import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../../lib/axios'

interface Option { id: number; name?: string; number?: number }
interface ReportStudent {
  student_id: string
  student_name: string
  total_classes: number
  present: number
  absent: number
  late: number
  percentage: number
}
interface AttendanceReport {
  program: { id: number; name: string; department_name: string }
  academic_year: { id: number; name: string }
  year_of_study: number
  semester: { id: number; number: number }
  course: { id: number; code: string; name: string }
  total_sessions: number
  students: ReportStudent[]
}
interface Paginated<T> { results: T[] }

async function getOptions<T>(url: string) {
  return (await apiClient.get<Paginated<T>>(url, { params: { page_size: 200 } })).data.results
}

async function getReport(params: Record<string, number>) {
  return (await apiClient.get<AttendanceReport>('/attendance/sessions/class-report/', { params })).data
}

export default function AdminAttendancePage() {
  const [program, setProgram] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [semester, setSemester] = useState('')
  const [course, setCourse] = useState('')

  const programs = useQuery({ queryKey: ['admin-attendance','programs'], queryFn: () => getOptions<Option>('/academics/programs/') })
  const years = useQuery({ queryKey: ['admin-attendance','years'], queryFn: () => getOptions<Option>('/academics/academic-years/') })
  const semesters = useQuery({ queryKey: ['admin-attendance','semesters',program,academicYear], queryFn: () => getOptions<Option>('/academics/semesters/'), enabled: Boolean(program && academicYear) })
  const courses = useQuery({ queryKey: ['admin-attendance','courses',semester], queryFn: () => getOptions<Option>('/academics/courses/'), enabled: Boolean(semester) })
  const report = useQuery({
    queryKey: ['admin-attendance','report',program,academicYear,semester,course],
    queryFn: () => getReport({ program: Number(program), academic_year: Number(academicYear), semester: Number(semester), course: Number(course) }),
    enabled: Boolean(program && academicYear && semester && course),
  })

  const filteredSemesters = useMemo(() => semesters.data?.filter(s => s.id === Number(semester) || !semester) ?? [], [semesters.data, semester])
  const filteredCourses = useMemo(() => courses.data?.filter(c => c.id === Number(course) || !course) ?? [], [courses.data, course])

  const downloadExcel = async () => {
    const params = { program: Number(program), academic_year: Number(academicYear), semester: Number(semester), course: Number(course), export: 'excel' }
    const response = await apiClient.get('/attendance/sessions/class-report/', { params, responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = 'attendance-report.xlsx'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Academic Operations</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Attendance</h1>
        <p className="mt-2 text-sm text-slate-500">Review class-wise attendance across programs, semesters, courses and academic years.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label><span className="mb-2 block text-sm font-medium text-slate-700">Program</span><select value={program} onChange={e => { setProgram(e.target.value); setSemester(''); setCourse('') }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">Select program</option>{programs.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-medium text-slate-700">Academic Year</span><select value={academicYear} onChange={e => { setAcademicYear(e.target.value); setSemester(''); setCourse('') }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><option value="">Select academic year</option>{years.data?.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-medium text-slate-700">Semester</span><select value={semester} onChange={e => { setSemester(e.target.value); setCourse('') }} disabled={!program || !academicYear} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:opacity-50"><option value="">Select semester</option>{filteredSemesters.map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-medium text-slate-700">Course</span><select value={course} onChange={e => setCourse(e.target.value)} disabled={!semester} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm disabled:opacity-50"><option value="">Select course</option>{filteredCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        </div>
        {report.data && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><div className="text-sm text-slate-600"><strong className="text-slate-900">{report.data.course.code}</strong> · {report.data.course.name} · {report.data.total_sessions} sessions</div><button type="button" onClick={downloadExcel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Export Excel</button></div>}
      </section>

      {report.isLoading && <div className="rounded-2xl border bg-white p-12 text-center text-sm text-slate-500">Loading attendance report...</div>}
      {report.isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Unable to load the attendance report. Check the selected academic context and try again.</div>}
      {report.data && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[900px] w-full text-sm"><thead className="bg-slate-50"><tr className="border-b border-slate-200"><th className="px-5 py-3 text-left">Student</th><th className="px-5 py-3 text-right">Classes</th><th className="px-5 py-3 text-right">Present</th><th className="px-5 py-3 text-right">Absent</th><th className="px-5 py-3 text-right">Late</th><th className="px-5 py-3 text-right">Attendance</th></tr></thead><tbody className="divide-y divide-slate-100">{report.data.students.map(s => <tr key={s.student_id}><td className="px-5 py-4"><div className="font-semibold text-slate-900">{s.student_id}</div><div className="text-xs text-slate-500">{s.student_name}</div></td><td className="px-5 py-4 text-right">{s.total_classes}</td><td className="px-5 py-4 text-right text-emerald-700">{s.present}</td><td className="px-5 py-4 text-right text-red-700">{s.absent}</td><td className="px-5 py-4 text-right text-amber-700">{s.late}</td><td className="px-5 py-4 text-right font-bold">{s.percentage}%</td></tr>)}{report.data.students.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">No attendance records found for this selection.</td></tr>}</tbody></table></div></section>}
    </div>
  )
}
