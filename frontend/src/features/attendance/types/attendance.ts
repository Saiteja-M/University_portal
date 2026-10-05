export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'

export interface AttendanceSession {
  id: number

  faculty: number
  offering: number
  offering_course_code: string
  offering_course_name: string
  offering_section: string
  faculty_employee_id: string
  faculty_name: string

  course: number
  course_code: string
  course_name: string

  academic_year: number
  academic_year_name: string

  semester: number
  semester_number: number

  session_date: string
  period: number

  topic: string
  remarks: string

  record_count: number

  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: number

  session: number

  student: number
  student_id: string
  student_name: string

  status: AttendanceStatus

  marked_at: string
  remarks: string
}

export interface AttendanceEntry {
  student_id: number
  status: AttendanceStatus
  remarks?: string
}

export interface MarkAttendanceRequest {
  attendance: AttendanceEntry[]
}

export interface MarkAttendanceResponse {
  message: string
  session: number
  records: AttendanceRecord[]
}

export interface AttendanceSummary {
  total: number
  present: number
  absent: number
  late: number
  attendance_percentage: number
}

export interface PaginatedAttendanceSessions {
  count: number
  next: string | null
  previous: string | null
  results: AttendanceSession[]
}