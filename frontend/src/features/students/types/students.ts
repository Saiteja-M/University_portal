export type StudentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'GRADUATED'
  | 'SUSPENDED'
  | 'DROPPED'

export type EnrollmentStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'WITHDRAWN'

export type Gender =
  | 'MALE'
  | 'FEMALE'
  | 'OTHER'

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'


// ─────────────────────────────────────────────
// Current Enrollment
// ─────────────────────────────────────────────

export interface CurrentEnrollment {
  id: number
  academic_year: number
  academic_year_name: string
  semester: number
  semester_number: number
  year_of_study: number
  status: EnrollmentStatus
  enrollment_date: string
}


// ─────────────────────────────────────────────
// Student Profile
// ─────────────────────────────────────────────

export interface StudentProfile {
  id: number
  student: number

  // Personal information
  date_of_birth: string
  gender: Gender
  blood_group: BloodGroup | ''

  // Profile photo
  photo: string | null

  // Contact information
  phone_number: string
  institutional_email: string
  alternate_phone_number: string

  // Address
  address: string
  city: string
  state: string
  postal_code: string

  created_at: string
  updated_at: string
}

export interface StudentProfileCreateData {
  student: number
  date_of_birth: string
  gender: Gender
  blood_group?: BloodGroup | ''
  phone_number?: string
  alternate_phone_number?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
}

export interface StudentProfileUpdateData {
  date_of_birth?: string
  gender?: Gender
  blood_group?: BloodGroup | ''
  phone_number?: string
  alternate_phone_number?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
}


// ─────────────────────────────────────────────
// Guardian
// ─────────────────────────────────────────────

export interface Guardian {
  id: number
  student: number
  name: string
  relationship: string
  phone_number: string
  email: string
  occupation: string
  address: string
  created_at: string
  updated_at: string
}

export interface GuardianCreateData {
  student: number
  name: string
  relationship: Guardian['relationship']
  phone_number: string
  email?: string
  occupation?: string
  address?: string
}

export type GuardianUpdateData =
  Partial<Omit<GuardianCreateData, 'student'>>


// ─────────────────────────────────────────────
// Enrollment
// ─────────────────────────────────────────────

export interface Enrollment {
  id: number
  student: number
  student_id: string
  academic_year: number
  academic_year_name: string
  semester: number
  semester_number: number
  year_of_study: number
  program_name: string
  status: EnrollmentStatus
  enrollment_date: string
  created_at: string
  updated_at: string
}

export interface EnrollmentCreateData {
  student: number
  academic_year: number
  semester: number
  status?: EnrollmentStatus
  enrollment_date: string
}

export type EnrollmentUpdateData =
  Partial<Omit<EnrollmentCreateData, 'student'>>


// ─────────────────────────────────────────────
// Student
// ─────────────────────────────────────────────

export interface Student {
  id: number

  student_id: string
  admission_number: string

  user: number
  username: string
  first_name: string
  last_name: string
  email: string

  program: number
  program_name: string
  department_name: string

  admission_date: string
  status: StudentStatus

  current_enrollment: CurrentEnrollment | null
  academic_year: string | null
  semester: number | null
  year_of_study: number | null

  profile: StudentProfile | null
  guardians: Guardian[]

  created_at: string
  updated_at: string
}


// ─────────────────────────────────────────────
// Student List
// ─────────────────────────────────────────────

export interface StudentListParams {
  search?: string
  status?: StudentStatus
  program?: number
  ordering?: string
  page?: number
}


// ─────────────────────────────────────────────
// Student Create
// ─────────────────────────────────────────────

export interface StudentCreateData {
  create_first_name: string
  create_last_name: string
  create_institutional_email: string

  create_date_of_birth: string
  create_gender: 'MALE' | 'FEMALE' | 'OTHER'
  create_blood_group?: string
  create_phone_number: string
  create_alternate_phone_number?: string
  create_address?: string
  create_city?: string
  create_state?: string
  create_postal_code?: string

  student_id: string
  admission_number: string
  program: number
  admission_date: string

  status:
    | 'ACTIVE'
    | 'INACTIVE'
    | 'GRADUATED'
    | 'SUSPENDED'
    | 'DROPPED'

  enrollment_academic_year?: number
  enrollment_semester?: number
  enrollment_date?: string

  enrollment_status?:
    | 'ACTIVE'
    | 'COMPLETED'
    | 'WITHDRAWN'
}


// ─────────────────────────────────────────────
// Student Update
// ─────────────────────────────────────────────

export interface StudentUpdateData {
  student_id?: string
  admission_number?: string
  program?: number
  admission_date?: string
  status?: StudentStatus
}


// ─────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ─────────────────────────────────────────────
// Course Offering Enrollment
// ─────────────────────────────────────────────

export type CourseOfferingEnrollmentStatus =
  | 'ENROLLED'
  | 'DROPPED'
  | 'COMPLETED'

export interface CourseOfferingEnrollment {
  id: number
  student_enrollment: number
  student_id: string
  student_name: string
  offering: number
  course_code: string
  course_name: string
  academic_year_name: string
  semester_number: number
  program_name: string
  section: string
  status: CourseOfferingEnrollmentStatus
  enrolled_date: string
  created_at: string
  updated_at: string
}

export interface CourseOfferingEnrollmentCreateData {
  student_enrollment: number
  offering: number
  status?: CourseOfferingEnrollmentStatus
  enrolled_date: string
}

export type CourseOfferingEnrollmentUpdateData =
  Partial<Omit<CourseOfferingEnrollmentCreateData, 'student_enrollment'>>
