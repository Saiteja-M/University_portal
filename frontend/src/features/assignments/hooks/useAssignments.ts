import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {assignmentsApi} from '../api/assignmentsApi'
import type {AssignmentCreateData,AssignmentSubmissionCreateData,AssignmentSubmissionUpdateData,AssignmentUpdateData} from '../types/assignments'
const k={all:['assignments'] as const,list:(p?:unknown)=>['assignments','list',p] as const,sub:(p?:unknown)=>['assignments','submissions',p] as const}
export const useAssignments=(p?:Record<string,unknown>)=>useQuery({queryKey:k.list(p),queryFn:()=>assignmentsApi.assignments.list(p)})
export const useAssignmentSubmissions=(p?:Record<string,unknown>)=>useQuery({queryKey:k.sub(p),queryFn:()=>assignmentsApi.submissions.list(p)})
export const useCreateAssignment=()=>{const q=useQueryClient();return useMutation({mutationFn:(d:AssignmentCreateData)=>assignmentsApi.assignments.create(d),onSuccess:()=>q.invalidateQueries({queryKey:k.all})})}
export const useUpdateAssignment=()=>{const q=useQueryClient();return useMutation({mutationFn:({id,data}:{id:number;data:AssignmentUpdateData})=>assignmentsApi.assignments.update(id,data),onSuccess:()=>q.invalidateQueries({queryKey:k.all})})}
export const useDeleteAssignment=()=>{const q=useQueryClient();return useMutation({mutationFn:(id:number)=>assignmentsApi.assignments.delete(id),onSuccess:()=>q.invalidateQueries({queryKey:k.all})})}
export const useCreateAssignmentSubmission=()=>{const q=useQueryClient();return useMutation({mutationFn:(d:AssignmentSubmissionCreateData)=>assignmentsApi.submissions.create(d),onSuccess:()=>q.invalidateQueries({queryKey:k.all})})}
export const useUpdateAssignmentSubmission=()=>{const q=useQueryClient();return useMutation({mutationFn:({id,data}:{id:number;data:AssignmentSubmissionUpdateData})=>assignmentsApi.submissions.update(id,data),onSuccess:()=>q.invalidateQueries({queryKey:k.all})})}
