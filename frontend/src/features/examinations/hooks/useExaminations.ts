import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  examinationsApi,
} from '../api/examinationsApi'

import type {
  AdminResultListParams,
  AdminStudentResultCreateData,
  ExamCreateData,
  ExamListParams,
  ExamUpdateData,
} from '../types/adminExaminations'
/* -------------------------------------------------------------------------- */
/* Query keys                                                                 */
/* -------------------------------------------------------------------------- */

export const examinationKeys = {
  all: ['examinations'] as const,

  exams: (params?: ExamListParams) =>
    [...examinationKeys.all, 'exams', params] as const,

  results: (params?: AdminResultListParams) =>
    [...examinationKeys.all, 'results', params] as const,

  myExaminations: () =>
    [...examinationKeys.all, 'my-examinations'] as const,

  myResults: () =>
    [...examinationKeys.all, 'my-results'] as const,

  myResultsSummary: () =>
    [...examinationKeys.all, 'my-results-summary'] as const,
}

/* -------------------------------------------------------------------------- */
/* Student                                                                     */
/* -------------------------------------------------------------------------- */

export function useMyResults() {
  return useQuery({
    queryKey: examinationKeys.myResults(),
    queryFn: examinationsApi.student.results,
  })
}

export function useMyResultsSummary() {
  return useQuery({
    queryKey:
      examinationKeys.myResultsSummary(),
    queryFn:
      examinationsApi.student.resultsSummary,
  })
}

export function useMyExaminations() {
  return useQuery({
    queryKey: examinationKeys.myExaminations(),
    queryFn: examinationsApi.student.exams,
  })
}

/* -------------------------------------------------------------------------- */
/* Exams                                                                       */
/* -------------------------------------------------------------------------- */

export function useExams(
  params?: ExamListParams,
) {
  return useQuery({
    queryKey: examinationKeys.exams(params),
    queryFn: () =>
      examinationsApi.exams.list(params),
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: ExamCreateData,
    ) => examinationsApi.exams.create(data),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: examinationKeys.all,
      })
    },
  })
}

export function useUpdateExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: ExamUpdateData
    }) =>
      examinationsApi.exams.update(
        id,
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: examinationKeys.all,
      })
    },
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      examinationsApi.exams.delete(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: examinationKeys.all,
      })
    },
  })
}

export function usePublishExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      examinationsApi.exams.publish(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: examinationKeys.all,
      })
    },
  })
}

export function useUnpublishExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      examinationsApi.exams.unpublish(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: examinationKeys.all,
      })
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Admin results                                                               */
/* -------------------------------------------------------------------------- */

export function useAdminResults(
  params?: AdminResultListParams,
) {
  return useQuery({
    queryKey: examinationKeys.results(
      params,
    ),
    queryFn: () =>
      examinationsApi.adminResults.list(
        params,
      ),
    enabled:
      params?.exam !== undefined,
  })
}

export function useCreateAdminResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      data: AdminStudentResultCreateData,
    ) =>
      examinationsApi.adminResults.create(
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: examinationKeys.all,
      })
    },
  })
}

export function useUpdateAdminResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: AdminStudentResultCreateData
    }) =>
      examinationsApi.adminResults.update(
        id,
        data,
      ),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: examinationKeys.all,
      })
    },
  })
}

export function useDeleteAdminResult() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      examinationsApi.adminResults.delete(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: examinationKeys.all,
      })
    },
  })
}