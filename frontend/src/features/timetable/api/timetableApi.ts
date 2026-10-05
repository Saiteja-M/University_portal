import { apiClient } from '../../../lib/axios'
import type { TimetableCreateData, TimetableSlot, TimetableUpdateData } from '../types/timetable'
interface PaginatedResponse<T> { count:number; next:string|null; previous:string|null; results:T[] }
type ListParams = Record<string,string|number|boolean>
const list = (url:string, params?:ListParams) => apiClient.get<PaginatedResponse<TimetableSlot>>(url,{params}).then(r=>r.data)
export const timetableApi = {
  list:(params?:ListParams)=>list('/timetable/slots/',params),
  myFaculty:(params?:ListParams)=>list('/timetable/my/faculty/',params),
  myStudent:(params?:ListParams)=>list('/timetable/my/student/',params),
  create:(data:TimetableCreateData)=>apiClient.post<TimetableSlot>('/timetable/slots/',data).then(r=>r.data),
  update:(id:number,data:TimetableUpdateData)=>apiClient.patch<TimetableSlot>('/timetable/slots/'+id+'/',data).then(r=>r.data),
  delete:(id:number)=>apiClient.delete('/timetable/slots/'+id+'/'),
}
