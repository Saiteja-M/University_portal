import { apiClient } from '../../../lib/axios'

export interface FacultyMyCourse {
  id: number
  offering: number
  faculty: number
  course_id: number
  course_code: string
  course_name: string
  credits: number
  academic_year_name: string
  semester_number: number
  program_name: string
  section: string
  offering_status: string
  capacity: number
  assigned_date: string
  is_active: boolean
}

export interface FacultyMyStudent {
  id: number
  student_id: string
  student_name: string
  admission_number: string
  program_name: string
  offering: number
  offering_section: string
  course_code: string
  course_name: string
  semester_number: number
  academic_year_name: string
  status: string
  enrolled_date: string
}

interface Page<T> { count: number; next: string | null; previous: string | null; results: T[] }

export const facultyPortalApi = {
  courses: async (params?: Record<string, string | number>) =>
    (await apiClient.get<Page<FacultyMyCourse>>('/faculty/my-courses/', { params })).data,
  students: async (params?: Record<string, string | number>) =>
    (await apiClient.get<Page<FacultyMyStudent>>('/faculty/my-students/', { params })).data,
}
