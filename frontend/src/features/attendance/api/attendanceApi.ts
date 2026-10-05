import { apiClient } from '../../../lib/axios'

import type {
  AttendanceRecord,
  AttendanceSession,
  AttendanceSummary,
  MarkAttendanceRequest,
  MarkAttendanceResponse,
  PaginatedAttendanceSessions,
} from '../types/attendance'

export type AttendanceListParams = Record<
  string,
  string | number | boolean
>

export interface AttendanceRecordListParams {
  session?: number
  student?: number
  status?: string
  ordering?: string
  page?: number
}
export interface EnrolledStudentListParams {
  academic_year?: number
  semester?: number
}
export interface CreateAttendanceSessionData {
  faculty: number
  offering: number
  course: number
  academic_year: number
  semester: number
  session_date: string
  period: number
  topic?: string
  remarks?: string
}
export interface EnrolledStudent {
  id: number
  student_id: string
  student_name: string
  program: number
}
export interface StudentAttendanceOverall {
  total_classes: number
  present: number
  absent: number
  late: number
  percentage: number
}

export interface StudentAttendanceCourse {
  course_id: number
  course_code: string
  course_name: string
  total_classes: number
  present: number
  absent: number
  late: number
  percentage: number
}

export interface StudentAttendanceRecent {
  id: number
  date: string
  course_code: string
  course_name: string
  period: number
  status: 'PRESENT' | 'ABSENT' | 'LATE'
  remarks: string | null
}

export interface StudentAttendanceSummary {
  student_id: string
  overall: StudentAttendanceOverall
  courses: StudentAttendanceCourse[]
  recent: StudentAttendanceRecent[]
}
export type UpdateAttendanceSessionData =
  Partial<CreateAttendanceSessionData>

export const attendanceApi = {
  sessions: {
    list: async (
      params?: AttendanceListParams,
    ): Promise<PaginatedAttendanceSessions> => {
      const response =
        await apiClient.get<PaginatedAttendanceSessions>(
          '/attendance/sessions/',
          { params },
        )

      return response.data
    },


     

    get: async (
      id: number,
    ): Promise<AttendanceSession> => {
      const response =
        await apiClient.get<AttendanceSession>(
          `/attendance/sessions/${id}/`,
        )

      return response.data
    },

    create: async (
      data: CreateAttendanceSessionData,
    ): Promise<AttendanceSession> => {
      const response =
        await apiClient.post<AttendanceSession>(
          '/attendance/sessions/',
          data,
        )

      return response.data
    },

    update: async (
      id: number,
      data: UpdateAttendanceSessionData,
    ): Promise<AttendanceSession> => {
      const response =
        await apiClient.patch<AttendanceSession>(
          `/attendance/sessions/${id}/`,
          data,
        )

      return response.data
    },

    delete: async (
      id: number,
    ): Promise<void> => {
      await apiClient.delete(
        `/attendance/sessions/${id}/`,
      )
    },

    mark: async (
      id: number,
      data: MarkAttendanceRequest,
    ): Promise<MarkAttendanceResponse> => {
      const response =
        await apiClient.post<MarkAttendanceResponse>(
          `/attendance/sessions/${id}/mark/`,
          data,
        )

      return response.data
    },

    summary: async (
      id: number,
    ): Promise<AttendanceSummary> => {
      const response =
        await apiClient.get<AttendanceSummary>(
          `/attendance/sessions/${id}/summary/`,
        )

      return response.data
    },
  },
    student: {
    summary: async (): Promise<StudentAttendanceSummary> => {
      const response =
        await apiClient.get<StudentAttendanceSummary>(
          '/attendance/records/my-summary/',
        )

      return response.data
    },
  },
  enrolledStudents: {
  list: async (
    params?: EnrolledStudentListParams,
  ): Promise<{
    count: number
    next: string | null
    previous: string | null
    results: EnrolledStudent[]
  }> => {
    const response = await apiClient.get<{
      count: number
      next: string | null
      previous: string | null
      results: EnrolledStudent[]
    }>(
      '/attendance/enrolled-students/',
      {
        params,
      },
    )

    return response.data
  },
},

  records: {
    list: async (
      params?: AttendanceRecordListParams,
    ): Promise<{
      count: number
      next: string | null
      previous: string | null
      results: AttendanceRecord[]
    }> => {
      const response = await apiClient.get<{
        count: number
        next: string | null
        previous: string | null
        results: AttendanceRecord[]
      }>('/attendance/records/', {
        params,
      })

      return response.data
    },

    get: async (
      id: number,
    ): Promise<AttendanceRecord> => {
      const response =
        await apiClient.get<AttendanceRecord>(
          `/attendance/records/${id}/`,
        )

      return response.data
    },

    create: async (
      data: {
        session: number
        student: number
        status: 'PRESENT' | 'ABSENT' | 'LATE'
        remarks?: string
      },
    ): Promise<AttendanceRecord> => {
      const response =
        await apiClient.post<AttendanceRecord>(
          '/attendance/records/',
          data,
        )

      return response.data
    },

    update: async (
      id: number,
      data: {
        status?: 'PRESENT' | 'ABSENT' | 'LATE'
        remarks?: string
      },
    ): Promise<AttendanceRecord> => {
      const response =
        await apiClient.patch<AttendanceRecord>(
          `/attendance/records/${id}/`,
          data,
        )

      return response.data
    },

    delete: async (
      id: number,
    ): Promise<void> => {
      await apiClient.delete(
        `/attendance/records/${id}/`,
      )
    },
  },
}
