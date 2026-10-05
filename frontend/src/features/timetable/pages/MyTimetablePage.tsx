import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react'
import { timetableApi } from '../api/timetableApi'
import type { DayOfWeek, TimetableSlot } from '../types/timetable'

const days: { id: DayOfWeek; label: string }[] = [
  {id:1,label:'Monday'},{id:2,label:'Tuesday'},{id:3,label:'Wednesday'},
  {id:4,label:'Thursday'},{id:5,label:'Friday'},{id:6,label:'Saturday'},
]
const periods = Array.from({length:8},(_,i)=>i+1)

export default function MyTimetablePage({ role }: { role: 'FACULTY' | 'STUDENT' }) {
  const [day,setDay]=useState<DayOfWeek|''>('')
  const [search,setSearch]=useState('')
  const query=useQuery({queryKey:['my-timetable',role,day,search],queryFn:()=>role==='FACULTY'?timetableApi.myFaculty({...day?{day_of_week:day}:{},...search?{search}:{}}):timetableApi.myStudent({...day?{day_of_week:day}:{},...search?{search}:{}})})
  const slots=query.data?.results??[]
  const grouped=useMemo(()=>new Map(slots.map(s=>[s.day_of_week+'-'+s.period,s])),[slots])
  const title=role==='FACULTY'?'My Teaching Timetable':'My Class Timetable'
  const subtitle=role==='FACULTY'?'Your active teaching schedule from assigned course offerings.':'Your timetable contains only course offerings in which you are actively enrolled.'
  return <div className="space-y-6">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Academic Schedule</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">{subtitle}</p></div><div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm"><div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><CalendarDays className="h-4 w-4 text-blue-600"/>Weekly Schedule</div><p className="mt-1 text-xs text-slate-500">{slots.length} active slot{slots.length===1?'':'s'}</p></div></header>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search course, room, faculty..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"/><select value={day} onChange={e=>setDay(e.target.value?Number(e.target.value) as DayOfWeek:'')} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"><option value="">All days</option>{days.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></div></section>
    {query.isLoading?<div className="rounded-2xl border bg-white p-12 text-center text-sm text-slate-500">Loading your timetable...</div>:query.isError?<div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">Unable to load your timetable. Please try again.</div>:<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[1050px] w-full"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Period</th>{days.map(d=><th key={d.id} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{d.label}</th>)}</tr></thead><tbody>{periods.map(p=><tr key={p} className="border-b border-slate-100 last:border-0"><td className="w-28 px-4 py-4 align-top"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">P{p}</span></td>{days.map(d=>{const s=grouped.get(d.id+'-'+p);return <td key={d.id} className="min-w-[150px] px-2 py-2 align-top">{s?<SlotCard slot={s} role={role}/>:<div className="h-[120px] rounded-xl border border-dashed border-slate-200 bg-slate-50/40"/>}</td>})}</tr>)}</tbody></table></div></section>}
  </div>
}
function SlotCard({slot,role}:{slot:TimetableSlot;role:'FACULTY'|'STUDENT'}){return <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3"><p className="text-sm font-bold text-slate-900">{slot.course_code}</p><p className="mt-0.5 text-xs text-slate-600">{slot.course_name} · Sec {slot.section}</p><div className="mt-3 space-y-1.5 text-xs text-slate-600"><p className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5"/>{slot.start_time.slice(0,5)}–{slot.end_time.slice(0,5)}</p><p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/>{slot.room}{slot.building?' · '+slot.building:''}</p>{role==='STUDENT'&&<p className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5"/>{slot.faculty_name}</p>}</div></div>}