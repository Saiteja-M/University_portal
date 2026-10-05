import { apiClient } from '../../../lib/axios'

import type {
  Enrollment,
  EnrollmentCreateData,
  EnrollmentUpdateData,
  CourseOfferingEnrollment,
  CourseOfferingEnrollmentCreateData,
  CourseOfferingEnrollmentUpdateData,
  Guardian,
  GuardianCreateData,
  GuardianUpdateData,
  PaginatedResponse,
  Student,
  StudentCreateData,
  StudentListParams,
  StudentProfile,
  StudentProfileCreateData,
  StudentProfileUpdateData,
  StudentUpdateData,
  CourseOfferingEnrollmentCreateData,
  CourseOfferingEnrollmentUpdateData,
} from '../types/students'

/* ============================================================================
   RE-EXPORT TYPES
   ========================================================================== */

export type {
  CourseOfferingEnrollmentCreateData,
  CourseOfferingEnrollmentUpdateData,
  EnrollmentCreateData,
  EnrollmentUpdateData,
  GuardianCreateData,
  GuardianUpdateData,
  StudentCreateData,
  StudentListParams,
  StudentProfileCreateData,
  StudentProfileUpdateData,
  StudentUpdateData,
} from '../types/students'

/* ============================================================================
   AUTHENTICATED STUDENT - COURSES RESPONSE
   ========================================================================== */

/**
 * Courses available to the currently authenticated student.
 *
 * These courses are resolved from the student's active enrollment,
 * semester and program on the backend.
 */
export interface StudentCourse {
  id: number
  code: string
  name: string
  credits: number
  semester: number
  semester_number: number
  semester_type: string
  academic_year: number
  academic_year_name: string
  program_name: string
  regulation: number
  regulation_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StudentCoursesResponse {
  student_id: string
  academic_year: number | null
  academic_year_name: string | null
  semester: number | null
  semester_number: number | null
  semester_type: string | null
  course_count: number
  total_credits: number
  results: StudentCourse[]
}

/* ============================================================================
   STUDENTS API
   ========================================================================== */

export const studentsApi = {
  // ==========================================================================
  // AUTHENTICATED STUDENT
  // ==========================================================================

  /**
   * Get the currently authenticated student's complete information.
   *
   * Backend:
   * GET /api/v1/students/students/me/
   */
  me: async (): Promise<Student> => {
    const response = await apiClient.get<Student>(
      '/students/students/me/',
    )

    return response.data
  },

  /**
   * Get courses belonging to the currently authenticated student's
   * active academic enrollment.
   *
   * Backend:
   * GET /api/v1/students/students/me/courses/
   */
  myCourses: async (): Promise<StudentCoursesResponse> => {
    const response = await apiClient.get<StudentCoursesResponse>(
      '/students/students/me/courses/',
    )

    return response.data
  },

  // ==========================================================================
  // STUDENTS
  // ==========================================================================

  /**
   * List students.
   *
   * Administrative / staff endpoint.
   */
  list: async (
    params?: StudentListParams,
  ): Promise<PaginatedResponse<Student>> => {
    const response = await apiClient.get<PaginatedResponse<Student>>(
      '/students/students/',
      {
        params,
      },
    )

    return response.data
  },

  /**
   * Get a specific student.
   */
  get: async (id: number): Promise<Student> => {
    const response = await apiClient.get<Student>(
      `/students/students/${id}/`,
    )

    return response.data
  },

  /**
   * Create the official university Student record.
   *
   * The admin does NOT create:
   * - username
   * - password
   * - Django User account
   *
   * The student completes portal registration later.
   */
  create: async (
    data: StudentCreateData,
  ): Promise<Student> => {
    const response = await apiClient.post<Student>(
      '/students/students/',
      data,
    )

    return response.data
  },

  /**
   * Update an official Student record.
   */
  update: async (
    id: number,
    data: StudentUpdateData,
  ): Promise<Student> => {
    const response = await apiClient.patch<Student>(
      `/students/students/${id}/`,
      data,
    )

    return response.data
  },

  /**
   * Delete an official Student record.
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(
      `/students/students/${id}/`,
    )
  },

  /**
   * Download the complete administrative
   * student profile as a PDF.
   */
  downloadProfilePdf: async (
    id: number,
  ): Promise<Blob> => {
    const response = await apiClient.get<Blob>(
      `/students/students/${id}/profile-pdf/`,
      {
        responseType: 'blob',
      },
    )

    return response.data
  },

  /**
   * Deactivate only the student's portal account.
   *
   * The official Student record and academic
   * records remain preserved.
   */
  deactivateAccount: async (
    id: number,
  ): Promise<{
    detail: string
    student_id: string
    account_active: boolean
  }> => {
    const response = await apiClient.post<{
      detail: string
      student_id: string
      account_active: boolean
    }>(
      `/students/students/${id}/deactivate-account/`,
    )

    return response.data
  },

  /**
   * Permanently delete a student.
   *
   * Administrative operation.
   */
  permanentDelete: async (
    id: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/students/students/${id}/permanent-delete/`,
    )
  },

  // ==========================================================================
  // STUDENT PROFILES
  // ==========================================================================

  profiles: {
    /**
     * List student profiles.
     */
    list: async (): Promise<
      PaginatedResponse<StudentProfile>
    > => {
      const response =
        await apiClient.get<
          PaginatedResponse<StudentProfile>
        >(
          '/students/profiles/',
        )

      return response.data
    },

    /**
     * Get a specific student profile.
     */
    get: async (
      id: number,
    ): Promise<StudentProfile> => {
      const response =
        await apiClient.get<StudentProfile>(
          `/students/profiles/${id}/`,
        )

      return response.data
    },

    /**
     * Create a student profile.
     */
    create: async (
      data: StudentProfileCreateData,
    ): Promise<StudentProfile> => {
      const response =
        await apiClient.post<StudentProfile>(
          '/students/profiles/',
          data,
        )

      return response.data
    },

    /**
     * Update a student profile.
     */
    update: async (
      id: number,
      data: StudentProfileUpdateData,
    ): Promise<StudentProfile> => {
      const response =
        await apiClient.patch<StudentProfile>(
          `/students/profiles/${id}/`,
          data,
        )

      return response.data
    },
  },

  // ==========================================================================
  // GUARDIANS
  // ==========================================================================

  guardians: {
    /**
     * List guardians.
     *
     * Optional student filter:
     * ?student=<student_id>
     */
    list: async (
      params?: { student?: number },
    ): Promise<PaginatedResponse<Guardian>> => {
      const response =
        await apiClient.get<
          PaginatedResponse<Guardian>
        >(
          '/students/guardians/',
          {
            params,
          },
        )

      return response.data
    },

    /**
     * Create a guardian.
     */
    create: async (
      data: GuardianCreateData,
    ): Promise<Guardian> => {
      const response =
        await apiClient.post<Guardian>(
          '/students/guardians/',
          data,
        )

      return response.data
    },

    /**
     * Update a guardian.
     */
    update: async (
      id: number,
      data: GuardianUpdateData,
    ): Promise<Guardian> => {
      const response =
        await apiClient.patch<Guardian>(
          `/students/guardians/${id}/`,
          data,
        )

      return response.data
    },

    /**
     * Delete a guardian.
     */
    delete: async (
      id: number,
    ): Promise<void> => {
      await apiClient.delete(
        `/students/guardians/${id}/`,
      )
    },
  },

  // ==========================================================================
  // ENROLLMENTS
  // ==========================================================================

  enrollments: {
    /**
     * List enrollments.
     *
     * Optional student filter:
     * ?student=<student_id>
     */
    list: async (
      params?: { student?: number },
    ): Promise<PaginatedResponse<Enrollment>> => {
      const response =
        await apiClient.get<
          PaginatedResponse<Enrollment>
        >(
          '/students/enrollments/',
          {
            params,
          },
        )

      return response.data
    },

    /**
     * Get a specific enrollment.
     */
    get: async (
      id: number,
    ): Promise<Enrollment> => {
      const response =
        await apiClient.get<Enrollment>(
          `/students/enrollments/${id}/`,
        )

      return response.data
    },

    /**
     * Create an enrollment.
     */
    create: async (
      data: EnrollmentCreateData,
    ): Promise<Enrollment> => {
      const response =
        await apiClient.post<Enrollment>(
          '/students/enrollments/',
          data,
        )

      return response.data
    },

    /**
     * Update an enrollment.
     */
    update: async (
      id: number,
      data: EnrollmentUpdateData,
    ): Promise<Enrollment> => {
      const response =
        await apiClient.patch<Enrollment>(
          `/students/enrollments/${id}/`,
          data,
        )

      return response.data
    },
  },

  // ==========================================================================
  // COURSE OFFERING ENROLLMENTS
  // ===========================================================================

  courseOfferingEnrollments: {
    list: async (params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<CourseOfferingEnrollment>> => {
      const response = await apiClient.get<PaginatedResponse<CourseOfferingEnrollment>>('/students/course-offering-enrollments/', { params })
      return response.data
    },
    get: async (id: number): Promise<CourseOfferingEnrollment> => {
      const response = await apiClient.get<CourseOfferingEnrollment>(`/students/course-offering-enrollments/${id}/`)
      return response.data
    },
    create: async (data: CourseOfferingEnrollmentCreateData): Promise<CourseOfferingEnrollment> => {
      const response = await apiClient.post<CourseOfferingEnrollment>('/students/course-offering-enrollments/', data)
      return response.data
    },
    update: async (id: number, data: CourseOfferingEnrollmentUpdateData): Promise<CourseOfferingEnrollment> => {
      const response = await apiClient.patch<CourseOfferingEnrollment>(`/students/course-offering-enrollments/${id}/`, data)
      return response.data
    },
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/students/course-offering-enrollments/${id}/`)
    },
  },
}