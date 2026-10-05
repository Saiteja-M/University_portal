export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Department {
  id: number
  code: string
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Program {
  id: number
  department: number
  department_name: string
  code: string
  name: string
  duration_years: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Regulation {
  id: number
  program: number
  program_name: string
  code: string
  name: string
  start_year: number
  end_year: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AcademicYear {
  id: number
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
  updated_at: string
}

export type SemesterType = 'ODD' | 'EVEN'

export interface Semester {
  id: number
  program: number
  program_name: string
  academic_year: number
  academic_year_name: string
  number: number
  semester_type: SemesterType
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CourseCategory =
  | 'THEORY'
  | 'LABORATORY'
  | 'PROJECT'
  | 'SEMINAR'
  | 'OTHER'

export interface Course {
  id: number
  semester: number
  semester_number: number
  program_name: string
  regulation: number
  regulation_code: string
  code: string
  name: string
  credits: number
  lecture_hours: number
  tutorial_hours: number
  practical_hours: number
  course_category: CourseCategory
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CourseOfferingStatus =
  | 'PLANNED'
  | 'OPEN'
  | 'CLOSED'
  | 'CANCELLED'

export interface CourseOffering {
  id: number
  course: number
  course_code: string
  course_name: string
  academic_year: number
  academic_year_name: string
  semester: number
  semester_number: number
  program_name: string
  section: string
  capacity: number
  status: CourseOfferingStatus
  is_active: boolean
  created_at: string
  updated_at: string
}
