import { useQuery } from '@tanstack/react-query'
import { facultyExaminationsApi } from '../api/facultyExaminationsApi'

export default function FacultyExaminationsPage(){
  const exams=useQuery({queryKey:['faculty-exams'],queryFn:()=>facultyExaminationsApi.exams()})
  const results=useQuery({queryKey:['faculty-results'],queryFn:()=>facultyExaminationsApi.results()})
  const examRows=exams.data?.results??[]
  const resultRows=results.data?.results??[]
  return <main className="min-h-screen bg-slate-50"><div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-blue-600">FACULTY PORTAL</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Examinations</h1>
      <p className="mt-1 text-sm text-slate-500">View examinations and published result records for your assigned course offerings.</p>
    </header>
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Assigned Examinations</p><p className="mt-2 text-3xl font-bold">{examRows.length}</p></div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Result Records</p><p className="mt-2 text-3xl font-bold">{resultRows.length}</p></div>
      <div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Published Exams</p><p className="mt-2 text-3xl font-bold">{examRows.filter(x=>x.is_published).length}</p></div>
    </section>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-5"><h2 className="font-semibold">Examination Schedule</h2></div>
      {exams.isLoading?<div className="p-6 text-slate-500">Loading...</div>:<div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{['Examination','Type','Semester','Dates','Maximum','Status'].map(h=><th key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody className="divide-y">{examRows.map(x=><tr key={x.id}><td className="px-5 py-4 font-semibold">{x.name}</td><td className="px-5 py-4">{x.exam_type}</td><td className="px-5 py-4">Sem {x.semester_number}</td><td className="px-5 py-4">{x.start_date} → {x.end_date}</td><td className="px-5 py-4">{x.max_marks}</td><td className="px-5 py-4">{x.is_published?'Published':'Draft'}</td></tr>)}</tbody></table></div>}
    </section>
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-5"><h2 className="font-semibold">Course Offering Results</h2></div>
      {results.isLoading?<div className="p-6 text-slate-500">Loading...</div>:<div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>{['Student','Course Offering','Exam','Marks','Grade','Status'].map(h=><th key={h} className="px-5 py-3">{h}</th>)}</tr></thead><tbody className="divide-y">{resultRows.map(x=><tr key={x.id}><td className="px-5 py-4"><b>{x.student_id}</b><div className="text-xs text-slate-500">{x.student_name}</div></td><td className="px-5 py-4">{x.course_code} — {x.course_name}<div className="text-xs text-slate-500">Section {x.section}</div></td><td className="px-5 py-4">{x.exam_name}</td><td className="px-5 py-4">{x.marks} / {x.max_marks}</td><td className="px-5 py-4">{x.grade||'—'}</td><td className="px-5 py-4">{x.status}</td></tr>)}</tbody></table></div>}
    </section>
  </div></main>
}