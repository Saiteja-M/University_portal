import { apiClient } from '../../../lib/axios'
import type {
  AcademicYear,
  Course,
  CourseOffering,
  Department,
  Program,
  Regulation,
  Semester,
} from '../types/academics'

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type AcademicListParams = Record<
  string,
  string | number | boolean | undefined
>

export interface DepartmentCreateData {
  code: string
  name: string
  description?: string
  is_active?: boolean
}

export type DepartmentUpdateData =
  Partial<DepartmentCreateData>

export interface ProgramCreateData {
  department: number
  code: string
  name: string
  duration_years: number
  is_active?: boolean
}

export type ProgramUpdateData =
  Partial<ProgramCreateData>

export interface RegulationCreateData {
  program: number
  code: string
  name: string
  start_year: number
  end_year?: number | null
  is_active?: boolean
}

export type RegulationUpdateData =
  Partial<RegulationCreateData>

export interface AcademicYearCreateData {
  name: string
  start_date: string
  end_date: string
  is_current?: boolean
}

export type AcademicYearUpdateData =
  Partial<AcademicYearCreateData>

export interface SemesterCreateData {
  program: number
  academic_year: number
  number: number
  semester_type: 'ODD' | 'EVEN'
  is_active?: boolean
}

export type SemesterUpdateData =
  Partial<SemesterCreateData>

export interface CourseCreateData {
  semester: number
  regulation: number
  code: string
  name: string
  credits: number
  lecture_hours?: number
  tutorial_hours?: number
  practical_hours?: number
  course_category?: Course['course_category']
  is_active?: boolean
}

export interface CourseOfferingCreateData {
  course: number
  academic_year: number
  semester: number
  section: string
  capacity: number
  status?: CourseOffering['status']
  is_active?: boolean
}

export type CourseUpdateData = Partial<CourseCreateData>

export type CourseOfferingUpdateData =
  Partial<CourseOfferingCreateData>

export const academicsApi = {
  departments: {
    list: (
      params?: AcademicListParams,
    ) =>
      apiClient.get<
        PaginatedResponse<Department>
      >('/academics/departments/', {
        params,
      }).then((response) => response.data),

    get: (id: number) =>
      apiClient.get<Department>(
        `/academics/departments/${id}/`,
      ).then((response) => response.data),

    create: (data: DepartmentCreateData) =>
      apiClient.post<Department>(
        '/academics/departments/',
        data,
      ).then((response) => response.data),

    update: (
      id: number,
      data: DepartmentUpdateData,
    ) =>
      apiClient.patch<Department>(
        `/academics/departments/${id}/`,
        data,
      ).then((response) => response.data),

    delete: (id: number) =>
      apiClient.delete(
        `/academics/departments/${id}/`,
      ),
  },

  programs: {
    list: (
      params?: AcademicListParams,
    ) =>
      apiClient.get<
        PaginatedResponse<Program>
      >('/academics/programs/', {
        params,
      }).then((response) => response.data),

    get: (id: number) =>
      apiClient.get<Program>(
        `/academics/programs/${id}/`,
      ).then((response) => response.data),

    create: (data: ProgramCreateData) =>
      apiClient.post<Program>(
        '/academics/programs/',
        data,
      ).then((response) => response.data),

    update: (
      id: number,
      data: ProgramUpdateData,
    ) =>
      apiClient.patch<Program>(
        `/academics/programs/${id}/`,
        data,
      ).then((response) => response.data),

    delete: (id: number) =>
      apiClient.delete(
        `/academics/programs/${id}/`,
      ),
  },

  regulations: {
    list: (
      params?: AcademicListParams,
    ) =>
      apiClient.get<
        PaginatedResponse<Regulation>
      >('/academics/regulations/', {
        params,
      }).then((response) => response.data),

    get: (id: number) =>
      apiClient.get<Regulation>(
        `/academics/regulations/${id}/`,
      ).then((response) => response.data),

    create: (data: RegulationCreateData) =>
      apiClient.post<Regulation>(
        '/academics/regulations/',
        data,
      ).then((response) => response.data),

    update: (
      id: number,
      data: RegulationUpdateData,
    ) =>
      apiClient.patch<Regulation>(
        `/academics/regulations/${id}/`,
        data,
      ).then((response) => response.data),

    delete: (id: number) =>
      apiClient.delete(
        `/academics/regulations/${id}/`,
      ),
  },

  academicYears: {
    list: (
      params?: AcademicListParams,
    ) =>
      apiClient.get<
        PaginatedResponse<AcademicYear>
      >('/academics/academic-years/', {
        params,
      }).then((response) => response.data),

    get: (id: number) =>
      apiClient.get<AcademicYear>(
        `/academics/academic-years/${id}/`,
      ).then((response) => response.data),

    create: (
      data: AcademicYearCreateData,
    ) =>
      apiClient.post<AcademicYear>(
        '/academics/academic-years/',
        data,
      ).then((response) => response.data),

    update: (
      id: number,
      data: AcademicYearUpdateData,
    ) =>
      apiClient.patch<AcademicYear>(
        `/academics/academic-years/${id}/`,
        data,
      ).then((response) => response.data),

    delete: (id: number) =>
      apiClient.delete(
        `/academics/academic-years/${id}/`,
      ),
  },

  semesters: {
    list: (
      params?: AcademicListParams,
    ) =>
      apiClient.get<
        PaginatedResponse<Semester>
      >('/academics/semesters/', {
        params,
      }).then((response) => response.data),

    get: (id: number) =>
      apiClient.get<Semester>(
        `/academics/semesters/${id}/`,
      ).then((response) => response.data),

    create: (data: SemesterCreateData) =>
      apiClient.post<Semester>(
        '/academics/semesters/',
        data,
      ).then((response) => response.data),

    update: (
      id: number,
      data: SemesterUpdateData,
    ) =>
      apiClient.patch<Semester>(
        `/academics/semesters/${id}/`,
        data,
      ).then((response) => response.data),

    delete: (id: number) =>
      apiClient.delete(
        `/academics/semesters/${id}/`,
      ),
  },

  courses: {
    list: (
      params?: AcademicListParams,
    ) =>
      apiClient.get<
        PaginatedResponse<Course>
      >('/academics/courses/', {
        params,
      }).then((response) => response.data),

    get: (id: number) =>
      apiClient.get<Course>(
        `/academics/courses/${id}/`,
      ).then((response) => response.data),

    create: (data: CourseCreateData) =>
      apiClient.post<Course>(
        '/academics/courses/',
        data,
      ).then((response) => response.data),

    update: (
      id: number,
      data: CourseUpdateData,
    ) =>
      apiClient.patch<Course>(
        `/academics/courses/${id}/`,
        data,
      ).then((response) => response.data),

    delete: (id: number) =>
      apiClient.delete(
        `/academics/courses/${id}/`,
      ),
  },

  courseOfferings: {
    list: (
      params?: AcademicListParams,
    ) =>
      apiClient.get<
        PaginatedResponse<CourseOffering>
      >('/academics/course-offerings/', {
        params,
      }).then((response) => response.data),

    get: (id: number) =>
      apiClient.get<CourseOffering>(
        `/academics/course-offerings/${id}/`,
      ).then((response) => response.data),

    create: (data: CourseOfferingCreateData) =>
      apiClient.post<CourseOffering>(
        '/academics/course-offerings/',
        data,
      ).then((response) => response.data),

    update: (
      id: number,
      data: CourseOfferingUpdateData,
    ) =>
      apiClient.patch<CourseOffering>(
        `/academics/course-offerings/${id}/`,
        data,
      ).then((response) => response.data),

    delete: (id: number) =>
      apiClient.delete(
        `/academics/course-offerings/${id}/`,
      ),
  },
}