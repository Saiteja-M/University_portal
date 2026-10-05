import { apiClient } from '../../../lib/axios'
import type { TimetableCreateData, TimetableSlot, TimetableUpdateData } from '../types/timetable'
interface PaginatedResponse<T> { count:number; next:string|null; previous:string|null; results:T[] }
type ListParams = Record<string,string|number|boolean>
export const timetableApi = {
  list:(params?:ListParams)=>apiClient.get<PaginatedResponse<TimetableSlot>>('/timetable/slots/',{params}).then(r=>r.data),
  create:(data:TimetableCreateData)=>apiClient.post<TimetableSlot>('/timetable/slots/',data).then(r=>r.data),
  update:(id:number,data:TimetableUpdateData)=>apiClient.patch<TimetableSlot>('/timetable/slots/'+id+'/',data).then(r=>r.data),
  delete:(id:number)=>apiClient.delete('/timetable/slots/'+id+'/'),
}
