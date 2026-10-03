import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  attendanceApi,
  type AttendanceListParams,
  type AttendanceRecordListParams,
  type CreateAttendanceSessionData,
  type EnrolledStudentListParams,
  type UpdateAttendanceSessionData,
} from '../api/attendanceApi'

import type {
  MarkAttendanceRequest,
} from '../types/attendance'

const attendanceKeys = {
  all: ['attendance'] as const,

  sessions: (
    params?: AttendanceListParams,
  ) =>
    [
      'attendance',
      'sessions',
      params,
    ] as const,

  sessionDetail: (id: number) =>
    [
      'attendance',
      'sessions',
      id,
    ] as const,

  summary: (id: number) =>
    [
      'attendance',
      'sessions',
      id,
      'summary',
    ] as const,

  records: (
    params?: AttendanceRecordListParams,
  ) =>
    [
      'attendance',
      'records',
      params,
    ] as const,

  recordDetail: (id: number) =>
    [
      'attendance',
      'records',
      id,
    ] as const,

  enrolledStudents: (
    params?: EnrolledStudentListParams,
  ) =>
    [
      'attendance',
      'enrolled-students',
      params,
    ] as const,
}


/* ============================================================
   Attendance Sessions
   ============================================================ */

export function useAttendanceSessions(
  params?: AttendanceListParams,
) {
  return useQuery({
    queryKey: attendanceKeys.sessions(
      params,
    ),

    queryFn: () =>
      attendanceApi.sessions.list(
        params,
      ),
  })
}


export function useAttendanceSession(
  id?: number,
) {
  return useQuery({
    queryKey:
      attendanceKeys.sessionDetail(
        id ?? 0,
      ),

    queryFn: () =>
      attendanceApi.sessions.get(
        id as number,
      ),

    enabled: Boolean(id),
  })
}


export function useCreateAttendanceSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: CreateAttendanceSessionData,
    ) =>
      attendanceApi.sessions.create(
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      })
    },
  })
}


export function useUpdateAttendanceSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: UpdateAttendanceSessionData
    }) =>
      attendanceApi.sessions.update(
        id,
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      })
    },
  })
}


export function useDeleteAttendanceSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      attendanceApi.sessions.delete(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      })
    },
  })
}


/* ============================================================
   Mark Attendance
   ============================================================ */

export function useMarkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: number
      data: MarkAttendanceRequest
    }) =>
      attendanceApi.sessions.mark(
        sessionId,
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      })
    },
  })
}


/* ============================================================
   Attendance Summary
   ============================================================ */

export function useAttendanceSummary(
  sessionId?: number,
) {
  return useQuery({
    queryKey: attendanceKeys.summary(
      sessionId ?? 0,
    ),

    queryFn: () =>
      attendanceApi.sessions.summary(
        sessionId as number,
      ),

    enabled: Boolean(sessionId),
  })
}


/* ============================================================
   Attendance Records
   ============================================================ */

export function useAttendanceRecords(
  params?: AttendanceRecordListParams,
) {
  return useQuery({
    queryKey: attendanceKeys.records(
      params,
    ),

    queryFn: () =>
      attendanceApi.records.list(
        params,
      ),
  })
}


export function useAttendanceRecord(
  id?: number,
) {
  return useQuery({
    queryKey:
      attendanceKeys.recordDetail(
        id ?? 0,
      ),

    queryFn: () =>
      attendanceApi.records.get(
        id as number,
      ),

    enabled: Boolean(id),
  })
}


export function useCreateAttendanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: {
        session: number
        student: number
        status:
          | 'PRESENT'
          | 'ABSENT'
          | 'LATE'
        remarks?: string
      },
    ) =>
      attendanceApi.records.create(
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      })
    },
  })
}


export function useUpdateAttendanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: {
        status?:
          | 'PRESENT'
          | 'ABSENT'
          | 'LATE'
        remarks?: string
      }
    }) =>
      attendanceApi.records.update(
        id,
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      })
    },
  })
}


export function useDeleteAttendanceRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      attendanceApi.records.delete(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.all,
      })
    },
  })
}


/* ============================================================
   Enrolled Students
   ============================================================ */

export function useEnrolledStudents(
  params?: EnrolledStudentListParams,
) {
  return useQuery({
    queryKey:
      attendanceKeys.enrolledStudents(
        params,
      ),

    queryFn: () =>
      attendanceApi.enrolledStudents.list(
        params,
      ),

    enabled: Boolean(
      params?.academic_year &&
      params?.semester,
    ),
  })
}
/* ============================================================
   Student Attendance
   ============================================================ */

export function useMyAttendanceSummary() {
  return useQuery({
    queryKey: [
      'attendance',
      'student',
      'my-summary',
    ],

    queryFn: () =>
      attendanceApi.student.summary(),
  })
}