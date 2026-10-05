import { useQuery } from '@tanstack/react-query'
import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import { facultyPortalApi } from '../api/facultyPortalApi'

export default function FacultyStudentsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useQuery({ queryKey: ['faculty-my-students', search], queryFn: () => facultyPortalApi.students(search ? { search } : undefined) })
  const students = data?.results ?? []
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Faculty Portal</p><h1 className="mt-1 text-3xl font-bold text-slate-900">My Students</h1><p className="mt-1 text-sm text-slate-500">Students enrolled in your active course offerings.</p></header>
    <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm"><Search className="h-5 w-5 text-slate-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student, course or section..." className="w-full bg-transparent text-sm outline-none" /><span className="text-xs font-semibold text-slate-500">{data?.count ?? 0} records</span></div>
    {isError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load your students.</div>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Student','Course','Section','Program','Semester','Status'].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{students.map(s=><tr key={s.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{s.student_name}</p><p className="text-xs text-slate-500">{s.student_id} · {s.admission_number}</p></td><td className="px-5 py-4"><p className="font-medium text-slate-800">{s.course_code}</p><p className="text-xs text-slate-500">{s.course_name}</p></td><td className="px-5 py-4 text-sm">{s.offering_section}</td><td className="px-5 py-4 text-sm">{s.program_name}</td><td className="px-5 py-4 text-sm">Sem {s.semester_number}</td><td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{s.status}</span></td></tr>)}{!isLoading && !students.length && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500"><Users className="mx-auto mb-2 h-6 w-6" />No students found in your assigned offerings.</td></tr>}</tbody></table></div></div>
  </div>
}
