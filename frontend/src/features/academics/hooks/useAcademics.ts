import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  academicsApi,
  type AcademicListParams,
  type AcademicYearCreateData,
  type AcademicYearUpdateData,
  type CourseCreateData,
  type CourseUpdateData,
  type DepartmentCreateData,
  type DepartmentUpdateData,
  type ProgramCreateData,
  type ProgramUpdateData,
  type RegulationCreateData,
  type RegulationUpdateData,
  type SemesterCreateData,
  type SemesterUpdateData,
} from '../api/academicsApi'

const academicsKeys = {
  all: ['academics'] as const,
  departments: (
    params?: AcademicListParams,
  ) => ['academics', 'departments', params] as const,
  programs: (
    params?: AcademicListParams,
  ) => ['academics', 'programs', params] as const,
  regulations: (
    params?: AcademicListParams,
  ) => ['academics', 'regulations', params] as const,
  academicYears: (
    params?: AcademicListParams,
  ) => ['academics', 'academic-years', params] as const,
  semesters: (
    params?: AcademicListParams,
  ) => ['academics', 'semesters', params] as const,
  courses: (
    params?: AcademicListParams,
  ) => ['academics', 'courses', params] as const,
}

export function useDepartments(
  params?: AcademicListParams,
) {
  return useQuery({
    queryKey: academicsKeys.departments(params),
    queryFn: () =>
      academicsApi.departments.list(params),
  })
}

export function usePrograms(
  params?: AcademicListParams,
) {
  return useQuery({
    queryKey: academicsKeys.programs(params),
    queryFn: () =>
      academicsApi.programs.list(params),
  })
}

export function useRegulations(
  params?: AcademicListParams,
) {
  return useQuery({
    queryKey: academicsKeys.regulations(params),
    queryFn: () =>
      academicsApi.regulations.list(params),
  })
}

export function useAcademicYears(
  params?: AcademicListParams,
) {
  return useQuery({
    queryKey: academicsKeys.academicYears(params),
    queryFn: () =>
      academicsApi.academicYears.list(params),
  })
}

export function useSemesters(
  params?: AcademicListParams,
) {
  return useQuery({
    queryKey: academicsKeys.semesters(params),
    queryFn: () =>
      academicsApi.semesters.list(params),
  })
}

export function useCourses(
  params?: AcademicListParams,
) {
  return useQuery({
    queryKey: academicsKeys.courses(params),
    queryFn: () =>
      academicsApi.courses.list(params),
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: DepartmentCreateData,
    ) => academicsApi.departments.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: DepartmentUpdateData
    }) =>
      academicsApi.departments.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      academicsApi.departments.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useCreateProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: ProgramCreateData,
    ) => academicsApi.programs.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useUpdateProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: ProgramUpdateData
    }) =>
      academicsApi.programs.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useDeleteProgram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      academicsApi.programs.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useCreateRegulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: RegulationCreateData,
    ) => academicsApi.regulations.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useUpdateRegulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: RegulationUpdateData
    }) =>
      academicsApi.regulations.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useDeleteRegulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      academicsApi.regulations.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: AcademicYearCreateData,
    ) =>
      academicsApi.academicYears.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: AcademicYearUpdateData
    }) =>
      academicsApi.academicYears.update(
        id,
        data,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      academicsApi.academicYears.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useCreateSemester() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: SemesterCreateData,
    ) => academicsApi.semesters.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useUpdateSemester() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: SemesterUpdateData
    }) =>
      academicsApi.semesters.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useDeleteSemester() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      academicsApi.semesters.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: CourseCreateData,
    ) => academicsApi.courses.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: CourseUpdateData
    }) =>
      academicsApi.courses.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      academicsApi.courses.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: academicsKeys.all,
      })
    },
  })
}