import { useMemo, useState } from 'react'
import { useCourseOfferings } from '../../academics/hooks'
import { useFaculty } from '../../faculty/hooks/useFaculty'
import { useCreateTimetableSlot, useDeleteTimetableSlot, useTimetable } from '../hooks/useTimetable'
import type { DayOfWeek } from '../types/timetable'

const days: { id: DayOfWeek; label: string }[] = [
  {id:1,label:'Monday'},{id:2,label:'Tuesday'},{id:3,label:'Wednesday'},
  {id:4,label:'Thursday'},{id:5,label:'Friday'},{id:6,label:'Saturday'},
]
const periods = Array.from({length:8},(_,i)=>i+1)

export default function TimetablePage() {
  const [day,setDay]=useState<DayOfWeek|''>('')
  const [search,setSearch]=useState('')
  const [formOpen,setFormOpen]=useState(false)
  const [error,setError]=useState('')
  const slotsQuery=useTimetable({...day?{day_of_week:day}:{},...search?{search}: {}})
  const offeringsQuery=useCourseOfferings({status:'OPEN'})
  const facultyQuery=useFaculty()
  const create=useCreateTimetableSlot()
  const remove=useDeleteTimetableSlot()
  const [form,setForm]=useState({offering:'',faculty:'',day_of_week:'1',period:'1',start_time:'09:00',end_time:'09:50',room:'',building:''})
  const slots=slotsQuery.data?.results??[]
  const offerings=offeringsQuery.data?.results??[]
  const faculty=facultyQuery.data?.results??[]
  const grouped=useMemo(()=>new Map(slots.map(s=>[s.day_of_week+'-'+s.period,s])),[slots])

  const submit=()=>{
    setError('')
    const payload={offering:Number(form.offering),faculty:Number(form.faculty),day_of_week:Number(form.day_of_week) as DayOfWeek,period:Number(form.period),start_time:form.start_time,end_time:form.end_time,room:form.room.trim(),building:form.building.trim(),is_active:true}
    if(!payload.offering||!payload.faculty||!payload.room)return setError('Course offering, faculty and room are required.')
    if(payload.end_time<=payload.start_time)return setError('End time must be later than start time.')
    create.mutate(payload,{onSuccess:()=>{setFormOpen(false);setForm({offering:'',faculty:'',day_of_week:'1',period:'1',start_time:'09:00',end_time:'09:50',room:'',building:''})},onError:(e:any)=>setError(e?.response?.data?.detail||'Unable to create timetable slot.')})
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Academic Operations</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Timetable</h1><p className="mt-2 text-sm text-slate-500">Build a conflict-aware weekly schedule from course offerings and faculty assignments.</p></div>
      <button onClick={()=>setFormOpen(v=>!v)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">{formOpen?'Close editor':'+ Schedule class'}</button>
    </div>
    {error&&<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
    {formOpen&&<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5"><h2 className="text-lg font-semibold text-slate-900">Schedule a class</h2><p className="mt-1 text-sm text-slate-500">Only active, open offerings with an active faculty assignment can be scheduled.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Field label="Course offering"><select value={form.offering} onChange={e=>setForm({...form,offering:e.target.value})}><option value="">Select offering</option>{offerings.map(o=><option key={o.id} value={o.id}>{o.course_code} — Sec {o.section}</option>)}</select></Field>
      <Field label="Faculty"><select value={form.faculty} onChange={e=>setForm({...form,faculty:e.target.value})}><option value="">Select faculty</option>{faculty.map(f=><option key={f.id} value={f.id}>{f.faculty_id} — {f.designation}</option>)}</select></Field>
      <Field label="Day"><select value={form.day_of_week} onChange={e=>setForm({...form,day_of_week:e.target.value})}>{days.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></Field>
      <Field label="Period"><select value={form.period} onChange={e=>setForm({...form,period:e.target.value})}>{periods.map(p=><option key={p} value={p}>Period {p}</option>)}</select></Field>
      <Field label="Start"><input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></Field>
      <Field label="End"><input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/></Field>
      <Field label="Room"><input value={form.room} onChange={e=>setForm({...form,room:e.target.value})} placeholder="Room 201"/></Field>
      <Field label="Building"><input value={form.building} onChange={e=>setForm({...form,building:e.target.value})} placeholder="Academic Block A"/></Field>
    </div><div className="mt-5 flex justify-end"><button disabled={create.isPending} onClick={submit} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{create.isPending?'Saving...':'Save timetable slot'}</button></div></section>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search course, faculty, room..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"/><select value={day} onChange={e=>setDay(e.target.value?Number(e.target.value) as DayOfWeek:'')} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"><option value="">All days</option>{days.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[1050px] w-full"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Period</th>{days.map(d=><th key={d.id} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{d.label}</th>)}</tr></thead><tbody>{periods.map(p=><tr key={p} className="border-b border-slate-100 last:border-0"><td className="w-28 px-4 py-4 align-top"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">P{p}</span></td>{days.map(d=>{const s=grouped.get(d.id+'-'+p);return <td key={d.id} className="min-w-[150px] px-2 py-2 align-top">{s?<div className="group rounded-xl border border-blue-100 bg-blue-50/70 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold text-slate-900">{s.course_code}</p><p className="mt-0.5 text-xs text-slate-600">Section {s.section}</p></div><button onClick={()=>remove.mutate(s.id)} className="text-xs font-semibold text-red-500 opacity-0 transition group-hover:opacity-100">Remove</button></div><p className="mt-2 text-xs font-medium text-slate-700">{s.faculty_name}</p><p className="mt-1 text-xs text-slate-500">{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)} · {s.room}</p></div>:<div className="h-[96px] rounded-xl border border-dashed border-slate-200 bg-slate-50/40"/>}</td>})}</tr>)}</tbody></table></div></section>
    <div className="flex items-center justify-between text-xs text-slate-500"><span>{slots.length} scheduled slot{slots.length===1?'':'s'}</span><span>Room and offering conflicts are enforced by the API.</span></div>
  </div>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span><div className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-slate-50 [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-sm [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:bg-slate-50 [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-sm">{children}</div></label>}
