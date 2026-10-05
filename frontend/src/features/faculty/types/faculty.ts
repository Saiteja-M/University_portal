export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type EmploymentType =
  | 'PERMANENT'
  | 'CONTRACT'
  | 'GUEST'
  | 'VISITING'

export type EmploymentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ON_LEAVE'
  | 'RETIRED'
  | 'RESIGNED'

export type FacultyGender = 'MALE' | 'FEMALE' | 'OTHER'
export type FacultyBloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'

export interface FacultyCreateData {
  faculty_id?: string
  employee_id: string
  department: number
  designation: string
  employment_type: EmploymentType
  joining_date: string
  status: EmploymentStatus
  create_username?: string
  create_password?: string
  create_first_name?: string
  create_last_name?: string
  create_email?: string
}

export type FacultyUpdateData = Partial<FacultyCreateData>

export interface Faculty {
  id: number
  faculty_id: string
  employee_id: string
  department: number
  department_name: string
  designation: string
  employment_type: EmploymentType
  joining_date: string
  status: EmploymentStatus
  user: number | null
  profile: FacultyProfile | null
  qualifications: FacultyQualification[]
  experiences: FacultyExperience[]
  created_at: string
  updated_at: string

  // Backward-compatible UI aliases; API responses may not provide them.
  username?: string
  email?: string
  employee_name?: string
  employment_status?: EmploymentStatus
  is_active?: boolean
}

export interface FacultyProfile {
  id: number
  faculty: number
  first_name: string | null
  last_name: string | null
  full_name: string
  date_of_birth: string | null
  gender: FacultyGender | null
  blood_group: FacultyBloodGroup | null
  phone_number: string
  alternate_phone_number: string
  institutional_email: string | null
  personal_email: string | null
  address: string
  city: string
  state: string
  postal_code: string
  photo: string | null
  created_at: string
  updated_at: string
}

export type FacultyProfileCreateData = Partial<Omit<FacultyProfile, 'id' | 'full_name' | 'created_at' | 'updated_at'>>
export type FacultyProfileUpdateData = Partial<FacultyProfileCreateData>

export interface FacultyQualification {
  id: number
  faculty: number
  degree: string
  specialization: string
  institution: string
  university: string
  year_of_passing: number
  grade_or_percentage: string
  created_at: string
  updated_at: string
}

export interface FacultyExperience {
  id: number
  faculty: number
  organization: string
  designation: string
  start_date: string
  end_date: string | null
  description: string
  created_at: string
  updated_at: string
}

export interface FacultyCourseAssignment {
  id: number
  faculty: number
  faculty_name: string
  course: number
  course_code: string
  course_name: string
  academic_year: number
  semester: number
  section: string
  assigned_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FacultyCourseAssignmentCreateData {
  faculty: number
  course: number
  academic_year: number
  semester: number
  section?: string
  assigned_date?: string
  is_active?: boolean
}

export type FacultyCourseAssignmentUpdateData =
  Partial<FacultyCourseAssignmentCreateData>

export interface FacultyListParams {
  search?: string
  department?: number | string
  status?: EmploymentStatus
  employment_type?: EmploymentType
  employment_status?: EmploymentStatus
  is_active?: boolean
  ordering?: string
  page?: number
  page_size?: number
}
