/* =========================================================
   ACADEMIC TYPES
========================================================= */

export interface Department {
  id: number;
  name: string;
  code?: string;
}

export interface AcademicYear {
  id: number;
  name: string;
  is_current?: boolean;
}

export interface Semester {
  id: number;
  number: number;
  name?: string;
  academic_year: number;
  program: number;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  credits?: number;
  semester: number;
}

/* =========================================================
   FACULTY
========================================================= */

export interface Faculty {
  id: number;

  /*
   * Authentication user.
   * Can be null because the backend Faculty model
   * allows a faculty record before a user account exists.
   */
  user?: number | null;

  /*
   * Official faculty identifiers.
   */
  faculty_id: string;
  employee_id: string;

  /*
   * Academic organization.
   */
  department: number;
  department_name?: string;

  /*
   * Employment information.
   */
  designation: string;

  employment_type:
    | "PERMANENT"
    | "CONTRACT"
    | "GUEST"
    | "VISITING";

  joining_date: string;

  status:
    | "ACTIVE"
    | "INACTIVE"
    | "ON_LEAVE"
    | "RETIRED"
    | "RESIGNED";

  /*
   * Related profile.
   */
  profile?: FacultyProfile | null;

  created_at?: string;
  updated_at?: string;
}

/* =========================================================
   FACULTY PROFILE
========================================================= */

export interface FacultyProfile {
  id: number;

  faculty: number;

  /*
   * Personal identity.
   */
  first_name: string;
  last_name: string;

  /*
   * Personal information.
   */
  date_of_birth?: string | null;

  gender?:
    | "MALE"
    | "FEMALE"
    | "OTHER"
    | string;

  blood_group?:
    | "A+"
    | "A-"
    | "B+"
    | "B-"
    | "AB+"
    | "AB-"
    | "O+"
    | "O-"
    | string;

  /*
   * Contact information.
   */
  phone_number?: string;
  alternate_phone?: string;

  institutional_email?: string | null;
  personal_email?: string;

  /*
   * Address.
   */
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;

  /*
   * Profile photo.
   */
  photo?: string | null;

  /*
   * Computed/display field.
   */
  full_name?: string;

  created_at?: string;
  updated_at?: string;
}

/* =========================================================
   FACULTY QUALIFICATION
========================================================= */

export interface FacultyQualification {
  id: number;

  faculty: number;

  degree: string;
  specialization?: string;

  institution: string;
  university?: string;

  year_of_passing: number;

  grade_or_percentage?: string;

  created_at?: string;
  updated_at?: string;
}

/* =========================================================
   FACULTY EXPERIENCE
========================================================= */

export interface FacultyExperience {
  id: number;

  faculty: number;

  organization: string;
  designation: string;

  start_date: string;
  end_date?: string | null;

  description?: string;

  created_at?: string;
  updated_at?: string;
}

/* =========================================================
   FACULTY COURSE ASSIGNMENT
========================================================= */

export interface FacultyCourseAssignment {
  id: number;

  /*
   * Faculty relationship.
   */
  faculty: number;
  faculty_name?: string;
  faculty_employee_id?: string;

  /*
   * Course relationship.
   */
  course: number;
  course_name?: string;
  course_code?: string;

  /*
   * Academic context.
   */
  academic_year: number;
  semester: number;

  /*
   * Section.
   */
  section?: string;

  /*
   * Assignment information.
   */
  assigned_date: string;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
}