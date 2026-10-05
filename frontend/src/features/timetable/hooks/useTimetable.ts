import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { timetableApi } from '../api/timetableApi'
import type { TimetableCreateData,TimetableUpdateData } from '../types/timetable'
const keys={all:['timetable'] as const,list:(params?:Record<string,string|number|boolean>)=>['timetable','list',params] as const}
export function useTimetable(params?:Record<string,string|number|boolean>){return useQuery({queryKey:keys.list(params),queryFn:()=>timetableApi.list(params)})}
export function useCreateTimetableSlot(){const q=useQueryClient();return useMutation({mutationFn:(d:TimetableCreateData)=>timetableApi.create(d),onSuccess:()=>void q.invalidateQueries({queryKey:keys.all})})}
export function useDeleteTimetableSlot(){const q=useQueryClient();return useMutation({mutationFn:(id:number)=>timetableApi.delete(id),onSuccess:()=>void q.invalidateQueries({queryKey:keys.all})})}
export function useUpdateTimetableSlot(){const q=useQueryClient();return useMutation({mutationFn:({id,data}:{id:number;data:TimetableUpdateData})=>timetableApi.update(id,data),onSuccess:()=>void q.invalidateQueries({queryKey:keys.all})})}
