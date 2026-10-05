import { apiClient } from '../../../lib/axios'

export interface FacultyExam {
  id:number; name:string; exam_type:string; semester:number; semester_number:number
  academic_year_name:string; program_name:string; start_date:string; end_date:string
  max_marks:number; is_published:boolean; is_active:boolean
}
export interface FacultyResult {
  id:number; student:number; student_id:string; student_name:string; exam:number
  exam_name:string; exam_type:string; course_offering:number; course_code:string
  course_name:string; section:string; credits:number; semester_number:number
  academic_year_name:string; max_marks:number; marks:number|string
  grade:string; grade_point:number|string|null; status:string; remarks:string
}
export interface Page<T>{count:number;next:string|null;previous:string|null;results:T[]}

export const facultyExaminationsApi={
  exams:async(params?:Record<string,string|number|boolean>)=>
    (await apiClient.get<Page<FacultyExam>>('/examinations/faculty/exams/',{params})).data,
  results:async(params?:Record<string,string|number|boolean>)=>
    (await apiClient.get<Page<FacultyResult>>('/examinations/faculty/results/',{params})).data,
}