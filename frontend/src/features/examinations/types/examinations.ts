export type ExamType = 'MID_I' | 'MID_II' | 'SEMESTER' | 'LAB' | 'INTERNAL'

export type ResultStatus = 'PASS' | 'FAIL' | 'ABSENT' | 'WITHHELD'

export interface StudentResult {
  id: number
  student_id: string
  exam: number
  exam_name: string
  exam_type: ExamType
  course_offering: number
  course_code: string
  course_name: string
  section: string
  credits: number
  semester_number: number
  academic_year_name: string
  max_marks: number
  marks: number | string
  grade: string
  grade_point: number | string | null
  status: ResultStatus
  remarks: string
  created_at: string
  updated_at: string
}

export interface MyResultsResponse {
  student_id: string
  count: number
  results: StudentResult[]
}

export interface SemesterResultSummary {
  semester: number
  semester_number: number
  academic_year: number
  academic_year_name: string
  total_credits: number
  sgpa: number | null
  results: StudentResult[]
}

export interface MyResultsSummaryResponse {
  student_id: string
  semester_count: number
  semesters: SemesterResultSummary[]
}