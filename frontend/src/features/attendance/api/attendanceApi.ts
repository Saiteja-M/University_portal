import { apiClient } from '../../../lib/axios'
import type { AttendanceRecord, AttendanceSession, AttendanceSummary, MarkAttendanceRequest, MarkAttendanceResponse, PaginatedAttendanceSessions } from '../types/attendance'

export type AttendanceListParams = Record<string, string | number | boolean>
export interface AttendanceRecordListParams { session?: number; student?: number; status?: string; ordering?: string; page?: number }
export interface EnrolledStudentListParams { academic_year?: number; semester?: number }
export interface CreateAttendanceSessionData {
  offering: number
  faculty?: number
  course?: number
  academic_year?: number
  semester?: number
  session_date: string
  period: number
  topic?: string
  remarks?: string
}
export interface EnrolledStudent { id: number; student_id: string; student_name: string; program: number }
export interface StudentAttendanceOverall { total_classes: number; present: number; absent: number; late: number; percentage: number }
export interface StudentAttendanceCourse { course_id: number; course_code: string; course_name: string; total_classes: number; present: number; absent: number; late: number; percentage: number }
export interface StudentAttendanceRecent { id: number; date: string; course_code: string; course_name: string; period: number; status: 'PRESENT' | 'ABSENT' | 'LATE'; remarks: string | null }
export interface StudentAttendanceSummary { student_id: string; overall: StudentAttendanceOverall; courses: StudentAttendanceCourse[]; recent: StudentAttendanceRecent[] }
export type UpdateAttendanceSessionData = Partial<CreateAttendanceSessionData>

export const attendanceApi = {
  sessions: {
    list: async (params?: AttendanceListParams): Promise<PaginatedAttendanceSessions> => (await apiClient.get<PaginatedAttendanceSessions>('/attendance/sessions/', { params })).data,
    get: async (id: number): Promise<AttendanceSession> => (await apiClient.get<AttendanceSession>(`/attendance/sessions/${id}/`)).data,
    create: async (data: CreateAttendanceSessionData): Promise<AttendanceSession> => (await apiClient.post<AttendanceSession>('/attendance/sessions/', data)).data,
    update: async (id: number, data: UpdateAttendanceSessionData): Promise<AttendanceSession> => (await apiClient.patch<AttendanceSession>(`/attendance/sessions/${id}/`, data)).data,
    delete: async (id: number): Promise<void> => { await apiClient.delete(`/attendance/sessions/${id}/`) },
    mark: async (id: number, data: MarkAttendanceRequest): Promise<MarkAttendanceResponse> => (await apiClient.post<MarkAttendanceResponse>(`/attendance/sessions/${id}/mark/`, data)).data,
    summary: async (id: number): Promise<AttendanceSummary> => (await apiClient.get<AttendanceSummary>(`/attendance/sessions/${id}/summary/`)).data,
  },
  student: {
    summary: async (): Promise<StudentAttendanceSummary> => (await apiClient.get<StudentAttendanceSummary>('/attendance/records/my-summary/')).data,
  },
  enrolledStudents: {
    list: async (params?: EnrolledStudentListParams) => (await apiClient.get<{ count:number; next:string|null; previous:string|null; results:EnrolledStudent[] }>('/attendance/enrolled-students/', { params })).data,
  },
  records: {
    list: async (params?: AttendanceRecordListParams) => (await apiClient.get<{ count:number; next:string|null; previous:string|null; results:AttendanceRecord[] }>('/attendance/records/', { params })).data,
    get: async (id: number): Promise<AttendanceRecord> => (await apiClient.get<AttendanceRecord>(`/attendance/records/${id}/`)).data,
    create: async (data: { session:number; student:number; status:'PRESENT'|'ABSENT'|'LATE'; remarks?:string }): Promise<AttendanceRecord> => (await apiClient.post<AttendanceRecord>('/attendance/records/', data)).data,
    update: async (id:number, data:{status?:'PRESENT'|'ABSENT'|'LATE'; remarks?:string}): Promise<AttendanceRecord> => (await apiClient.patch<AttendanceRecord>(`/attendance/records/${id}/`, data)).data,
    delete: async (id:number): Promise<void> => { await apiClient.delete(`/attendance/records/${id}/`) },
  },
}
