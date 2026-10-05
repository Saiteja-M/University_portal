import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ClipboardCheck } from 'lucide-react'
import { attendanceApi } from '../../attendance/api/attendanceApi'
import { facultyPortalApi } from '../api/facultyPortalApi'
import type { AttendanceStatus } from '../../attendance/types/attendance'

export default function FacultyAttendancePage() {
  const qc = useQueryClient()
  const [selectedSession, setSelectedSession] = useState<number | null>(null)
  const [selectedOffering, setSelectedOffering] = useState<number | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [period, setPeriod] = useState(1)
  const [topic, setTopic] = useState('')
  const [status, setStatus] = useState<Record<number, AttendanceStatus>>({})

  const courses = useQuery({ queryKey: ['faculty-my-courses'], queryFn: () => facultyPortalApi.courses() })
  const sessions = useQuery({ queryKey: ['faculty-attendance-sessions'], queryFn: () => attendanceApi.sessions.list({ ordering: '-session_date,-period' }) })
  const students = useQuery({ queryKey: ['faculty-attendance-students', selectedOffering], queryFn: () => facultyPortalApi.students({ offering: selectedOffering as number }), enabled: Boolean(selectedOffering) })

  const createSession = useMutation({
    mutationFn: async () => {
      const course = courses.data?.results.find(c => c.offering === selectedOffering)
      if (!course) throw new Error('Select a course offering first.')
      return attendanceApi.sessions.create({
        faculty: course.faculty,
        offering: course.offering,
        course: course.course_id,
        academic_year: undefined as never,
        semester: undefined as never,
        session_date: date,
        period,
        topic,
      })
    },
    onSuccess: (session) => { setSelectedSession(session.id); setSelectedOffering(session.offering); qc.invalidateQueries({ queryKey: ['faculty-attendance-sessions'] }) },
  })

  const mark = useMutation({
    mutationFn: () => attendanceApi.sessions.mark(selectedSession as number, {
      attendance: Object.entries(status).map(([student_id, value]) => ({ student_id: Number(student_id), status: value })),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['faculty-attendance-sessions'] }); qc.invalidateQueries({ queryKey: ['faculty-attendance-students'] }) },
  })

  const selected = useMemo(() => sessions.data?.results.find(s => s.id === selectedSession) ?? null, [sessions.data, selectedSession])

  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Faculty Portal</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Attendance</h1><p className="mt-1 text-sm text-slate-500">Create class sessions and record attendance only for your assigned offerings.</p></header>
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">New attendance session</h2>
        <select value={selectedOffering ?? ''} onChange={e=>setSelectedOffering(Number(e.target.value)||null)} className="w-full rounded-xl border px-3 py-2 text-sm"><option value="">Select course offering</option>{(courses.data?.results ?? []).map(c=><option key={c.offering} value={c.offering}>{c.course_code} · {c.section}</option>)}</select>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" />
        <input type="number" min={1} value={period} onChange={e=>setPeriod(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Period" />
        <input value={topic} onChange={e=>setTopic(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Topic" />
        <button disabled={!selectedOffering || createSession.isPending} onClick={()=>createSession.mutate()} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{createSession.isPending ? 'Creating...' : 'Create Session'}</button>
        {createSession.isError && <p className="text-xs text-red-600">Unable to create session. Check the selected offering and date.</p>}
        <div className="border-t pt-4"><h3 className="mb-2 text-sm font-semibold text-slate-800">Recent sessions</h3><div className="max-h-72 space-y-2 overflow-auto">{(sessions.data?.results ?? []).map(s=><button key={s.id} onClick={()=>{setSelectedSession(s.id);setSelectedOffering(s.offering)}} className={`w-full rounded-xl border p-3 text-left text-sm ${selectedSession===s.id?'border-blue-400 bg-blue-50':'border-slate-200 hover:bg-slate-50'}`}><p className="font-semibold">{s.offering_course_code} · {s.offering_section}</p><p className="text-xs text-slate-500">{s.session_date} · Period {s.period}</p></button>)}</div></div>
      </section>
      <section className="rounded-2xl border bg-white shadow-sm"><div className="border-b px-5 py-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><ClipboardCheck className="h-5 w-5" /></div><div><h2 className="font-semibold text-slate-900">Mark attendance</h2><p className="text-xs text-slate-500">{selected ? `${selected.offering_course_code} · ${selected.session_date} · Period ${selected.period}` : 'Select a session to begin.'}</p></div></div></div>
        {!selectedSession ? <div className="p-12 text-center text-sm text-slate-500"><CalendarDays className="mx-auto mb-2 h-7 w-7" />Select or create a session.</div> : <><div className="divide-y">{(students.data?.results ?? []).map(s=><div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium text-slate-900">{s.student_name}</p><p className="text-xs text-slate-500">{s.student_id}</p></div><select value={status[s.id] ?? 'PRESENT'} onChange={e=>setStatus(prev=>({...prev,[s.id]:e.target.value as AttendanceStatus}))} className="rounded-lg border px-3 py-2 text-sm"><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option></select></div>)}</div><div className="flex justify-end border-t p-5"><button disabled={mark.isPending || !(students.data?.results.length)} onClick={()=>mark.mutate()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />{mark.isPending?'Saving...':'Save Attendance'}</button></div></>}
      </section>
    </div>
  </div>
}
