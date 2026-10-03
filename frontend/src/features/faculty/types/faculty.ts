export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
export interface FacultyCreateData {
  faculty_id?: string

  employee_id: string
  department: number
  designation: string
  joining_date: string

  employment_type:
    | 'PERMANENT'
    | 'CONTRACT'
    | 'GUEST'
    | 'VISITING'

  status:
    | 'ACTIVE'
    | 'INACTIVE'
    | 'ON_LEAVE'
    | 'RETIRED'
    | 'RESIGNED'

  create_username: string
  create_password: string
  create_first_name: string
  create_last_name: string
  create_email: string
}

export type FacultyListParams = {
  search?: string
  department?: number
  employment_status?: string
  is_active?: boolean
  ordering?: string
  page?: number
}

export type EmploymentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ON_LEAVE'
  | 'RETIRED'
  | 'RESIGNED'
export type FacultyGender =
  | 'MALE'
  | 'FEMALE'
  | 'OTHER'
  | 'PREFER_NOT_TO_SAY'

export type FacultyAssignmentRole =
  | 'PRIMARY'
  | 'CO_FACULTY'
  | 'LAB_FACULTY'

export interface Faculty {
  id: number
  user: number
  username: string
  email: string
  employee_id: string
  employee_name: string
  department: number
  department_name: string
  designation: string
  joining_date: string
  employment_status: EmploymentStatus
  is_active: boolean
  profile: number | null
  created_at: string
  updated_at: string
}

export interface FacultyCreateData {
  faculty_id?: string

  employee_id: string
  department: number
  designation: string
  joining_date: string

  employment_type:
    | 'PERMANENT'
    | 'CONTRACT'
    | 'GUEST'
    | 'VISITING'

  status:
    | 'ACTIVE'
    | 'INACTIVE'
    | 'ON_LEAVE'
    | 'RETIRED'
    | 'RESIGNED'

  create_username: string
  create_password: string
  create_first_name: string
  create_last_name: string
  create_email: string
}

export type FacultyUpdateData =
  Partial<FacultyCreateData>

export interface FacultyProfile {
  id: number
  faculty: number
  date_of_birth: string | null
  gender: FacultyGender | ''
  phone_number: string
  alternate_phone_number: string
  address: string
  city: string
  state: string
  postal_code: string
  created_at: string
  updated_at: string
}

export interface FacultyProfileCreateData {
  faculty: number
  date_of_birth?: string | null
  gender?: FacultyGender | ''
  phone_number?: string
  alternate_phone_number?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
}

export type FacultyProfileUpdateData =
  Partial<FacultyProfileCreateData>

export interface FacultyCourseAssignment {
  id: number
  faculty: number
  faculty_employee_id: string
  faculty_name: string
  course: number
  course_code: string
  course_name: string
  academic_year: number
  academic_year_name: string
  semester: number
  semester_number: number
  department_name: string
  role: FacultyAssignmentRole
  created_at: string
  updated_at: string
}

export interface FacultyCourseAssignmentCreateData {
  faculty: number
  course: number
  academic_year: number
  semester: number
  role?: FacultyAssignmentRole
}

export type FacultyCourseAssignmentUpdateData =
  Partial<FacultyCourseAssignmentCreateData>