import type { ExamType, ResultStatus, StudentResult } from './examinations'

export interface Exam {
  id: number
  name: string
  exam_type: ExamType
  semester: number
  semester_number: number
  academic_year_name: string
  start_date: string
  end_date: string
  max_marks: number
  is_published: boolean
  is_active: boolean
}

export interface AdminStudentResult extends StudentResult {
  student: number
  student_name: string
  student_id: string
  exam: number
  course: number
}

export interface AdminStudentResultCreateData {
  student: number
  exam: number
  course: number
  marks: number
  grade: string
  grade_point: number | null
  status: ResultStatus
  remarks?: string
}

export interface ExamCreateData {
  name: string
  exam_type: ExamType
  semester: number
  start_date: string
  end_date: string
  max_marks: number
  is_active?: boolean
}

export type ExamUpdateData = Partial<ExamCreateData>

export interface ExamListParams {
  search?: string
  exam_type?: ExamType
  semester?: number
  is_published?: boolean
  is_active?: boolean
  ordering?: string
  page?: number
}

export interface AdminResultListParams {
  exam?: number
  student?: number
  course?: number
  status?: ResultStatus
  ordering?: string
  page?: number
}