import { useQuery } from '@tanstack/react-query'
import { BookOpen, Users, Clock3 } from 'lucide-react'
import { facultyPortalApi } from '../api/facultyPortalApi'

export default function FacultyCoursesPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['faculty-my-courses'], queryFn: () => facultyPortalApi.courses() })
  const courses = data?.results ?? []
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Faculty Portal</p><h1 className="mt-1 text-3xl font-bold text-slate-900">My Courses</h1><p className="mt-1 text-sm text-slate-500">Courses and sections currently assigned to you.</p></header>
    {isError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load your course assignments.</div>}
    {isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200" />)}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {courses.map(course => <article key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><BookOpen className="h-5 w-5" /></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{course.section}</span></div>
        <p className="mt-4 text-sm font-semibold text-blue-700">{course.course_code}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{course.course_name}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500"><span>Semester {course.semester_number}</span><span>{course.credits} credits</span><span><Users className="mr-1 inline h-3.5 w-3.5" />Capacity {course.capacity}</span><span><Clock3 className="mr-1 inline h-3.5 w-3.5" />{course.offering_status}</span></div>
        <p className="mt-4 border-t pt-3 text-xs text-slate-500">{course.program_name} · {course.academic_year_name}</p>
      </article>)}
      {!courses.length && !isError && <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">No active course assignments found.</div>}
    </div>}
  </div>
}
