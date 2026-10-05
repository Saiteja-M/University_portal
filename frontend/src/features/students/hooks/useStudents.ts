
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  studentsApi,
  type EnrollmentCreateData,
  type EnrollmentUpdateData,
  type CourseOfferingEnrollmentCreateData,
  type CourseOfferingEnrollmentUpdateData,
  type GuardianCreateData,
  type GuardianUpdateData,
  type StudentCreateData,
  type StudentListParams,
  type StudentProfileCreateData,
  type StudentProfileUpdateData,
  type StudentUpdateData,
} from '../api/studentsApi'

// -----------------------------------------------------------------------------
// Query keys
// -----------------------------------------------------------------------------

export const studentQueryKeys = {
  all: ['students'] as const,

  me: () =>
    [...studentQueryKeys.all, 'me'] as const,

  lists: () =>
    [...studentQueryKeys.all, 'list'] as const,

  list: (params?: StudentListParams) =>
    [...studentQueryKeys.lists(), params] as const,

  details: () =>
    [...studentQueryKeys.all, 'detail'] as const,

  detail: (id: number) =>
    [...studentQueryKeys.details(), id] as const,

  profile: (id: number) =>
    [...studentQueryKeys.all, 'profile', id] as const,

  guardians: (studentId: number) =>
    [...studentQueryKeys.all, 'guardians', studentId] as const,

  enrollments: (studentId: number) =>
    [...studentQueryKeys.all, 'enrollments', studentId] as const,
}

// -----------------------------------------------------------------------------
// Authenticated student
// -----------------------------------------------------------------------------

export function useMyStudent() {
  return useQuery({
    queryKey: studentQueryKeys.me(),
    queryFn: studentsApi.me,
  })
}

// -----------------------------------------------------------------------------
// Student list
// -----------------------------------------------------------------------------

export function useStudents(
  params?: StudentListParams,
) {
  return useQuery({
    queryKey: studentQueryKeys.list(params),
    queryFn: () => studentsApi.list(params),
  })
}

// -----------------------------------------------------------------------------
// Single student
// -----------------------------------------------------------------------------

export function useStudent(id: number) {
  return useQuery({
    queryKey: studentQueryKeys.detail(id),
    queryFn: () => studentsApi.get(id),
    enabled: id > 0,
  })
}

// -----------------------------------------------------------------------------
// Create student
// -----------------------------------------------------------------------------

export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: StudentCreateData,
    ) => studentsApi.create(data),

    onSuccess: (student) => {
      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.lists(),
      })

      queryClient.setQueryData(
        studentQueryKeys.detail(student.id),
        student,
      )
    },
  })
}

// -----------------------------------------------------------------------------
// Update student
// -----------------------------------------------------------------------------

export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: StudentUpdateData
    }) => studentsApi.update(id, data),

    onSuccess: (student) => {
      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.lists(),
      })

      queryClient.setQueryData(
        studentQueryKeys.detail(student.id),
        student,
      )

      queryClient.setQueryData(
        studentQueryKeys.me(),
        student,
      )
    },
  })
}

// -----------------------------------------------------------------------------
// Delete student
// -----------------------------------------------------------------------------

export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      studentsApi.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.lists(),
      })
    },
  })
}

// -----------------------------------------------------------------------------
// Student profile
// -----------------------------------------------------------------------------

export function useCreateStudentProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: StudentProfileCreateData,
    ) => studentsApi.profiles.create(data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.detail(
          variables.student,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.profile(
          variables.student,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.me(),
      })
    },
  })
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: StudentProfileUpdateData
    }) =>
      studentsApi.profiles.update(id, data),

    onSuccess: (profile) => {
      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.detail(
          profile.student,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.profile(
          profile.student,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.me(),
      })
    },
  })
}

// -----------------------------------------------------------------------------
// Guardians
// -----------------------------------------------------------------------------

export function useCreateGuardian(
  studentId: number,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: GuardianCreateData,
    ) => studentsApi.guardians.create(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.detail(
          studentId,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.guardians(
          studentId,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.me(),
      })
    },
  })
}

export function useUpdateGuardian(
  studentId: number,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: GuardianUpdateData
    }) =>
      studentsApi.guardians.update(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.detail(
          studentId,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.guardians(
          studentId,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.me(),
      })
    },
  })
}
export function useMyStudentCourses() {
  return useQuery({
    queryKey: [...studentQueryKeys.me(), 'courses'],
    queryFn: studentsApi.myCourses,
  })
}

export function useDeleteGuardian(
  studentId: number,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      studentsApi.guardians.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.detail(
          studentId,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.guardians(
          studentId,
        ),
      })

      queryClient.invalidateQueries({
        queryKey: studentQueryKeys.me(),
      })
    },
  })
}

// -----------------------------------------------------------------------------
// Enrollments
// -----------------------------------------------------------------------------

export function useEnrollments(
  params?: Record<
    string,
    string | number | boolean | undefined
  >,
) {
  const studentId =
    typeof params?.student === 'number'
      ? params.student
      : undefined

  return useQuery({
    queryKey: studentId
      ? studentQueryKeys.enrollments(studentId)
      : [
          ...studentQueryKeys.all,
          'enrollments',
          params,
        ],

    queryFn: () =>
      studentsApi.enrollments.list(params),
  })
}

export function useCreateEnrollment(
  studentId: number,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: EnrollmentCreateData,
    ) =>
      studentsApi.enrollments.create(data),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.detail(
            studentId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.enrollments(
            studentId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.me(),
        }),
      ])
    },
  })
}

export function useUpdateEnrollment(
  studentId: number,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: EnrollmentUpdateData
    }) =>
      studentsApi.enrollments.update(
        id,
        data,
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.detail(
            studentId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.enrollments(
            studentId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: studentQueryKeys.me(),
        }),
      ])
    },
  })
}
  

// -----------------------------------------------------------------------------
// Course offering enrollments
// -----------------------------------------------------------------------------

export function useCourseOfferingEnrollments(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: [...studentQueryKeys.all, 'course-offering-enrollments', params],
    queryFn: () => studentsApi.courseOfferingEnrollments.list(params),
  })
}

export function useCreateCourseOfferingEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CourseOfferingEnrollmentCreateData) =>
      studentsApi.courseOfferingEnrollments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...studentQueryKeys.all, 'course-offering-enrollments'] })
      queryClient.invalidateQueries({ queryKey: studentQueryKeys.me() })
    },
  })
}

export function useUpdateCourseOfferingEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CourseOfferingEnrollmentUpdateData }) =>
      studentsApi.courseOfferingEnrollments.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...studentQueryKeys.all, 'course-offering-enrollments'] })
      queryClient.invalidateQueries({ queryKey: studentQueryKeys.me() })
    },
  })
}

export function useDeleteCourseOfferingEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => studentsApi.courseOfferingEnrollments.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...studentQueryKeys.all, 'course-offering-enrollments'] })
      queryClient.invalidateQueries({ queryKey: studentQueryKeys.me() })
    },
  })
}
