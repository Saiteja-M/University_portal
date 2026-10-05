import { apiClient } from '../../../lib/axios'

import type {
  MyResultsResponse,
  MyResultsSummaryResponse,
} from '../types/examinations'

import type {
  AdminResultListParams,
  AdminStudentResult,
  AdminStudentResultCreateData,
  Exam,
  ExamCreateData,
  ExamListParams,
  ExamUpdateData,
} from '../types/adminExaminations'

export const examinationsApi = {
  /* ======================================================================== */
  /* STUDENT                                                                   */
  /* ======================================================================== */

  student: {
    exams: async (): Promise<{
      count: number
      next: string | null
      previous: string | null
      results: Exam[]
    }> => {
      const response = await apiClient.get<{
        count: number
        next: string | null
        previous: string | null
        results: Exam[]
      }>('/examinations/student/exams/')

      return response.data
    },

    results: async (): Promise<MyResultsResponse> => {
      const response =
        await apiClient.get<MyResultsResponse>(
          '/examinations/results/my/',
        )

      return response.data
    },

    resultsSummary:
      async (): Promise<MyResultsSummaryResponse> => {
        const response =
          await apiClient.get<MyResultsSummaryResponse>(
            '/examinations/results/my/summary/',
          )

        return response.data
      },
  },

  /* ======================================================================== */
  /* EXAMS                                                                     */
  /* ======================================================================== */

  exams: {
    list: async (
      params?: ExamListParams,
    ) => {
      const response =
        await apiClient.get<{
          count: number
          next: string | null
          previous: string | null
          results: Exam[]
        }>('/examinations/exams/', {
          params,
        })

      return response.data
    },

    create: async (
      data: ExamCreateData,
    ): Promise<Exam> => {
      const response =
        await apiClient.post<Exam>(
          '/examinations/exams/',
          data,
        )

      return response.data
    },

    update: async (
      id: number,
      data: ExamUpdateData,
    ): Promise<Exam> => {
      const response =
        await apiClient.patch<Exam>(
          `/examinations/exams/${id}/`,
          data,
        )

      return response.data
    },

    delete: async (
      id: number,
    ): Promise<void> => {
      await apiClient.delete(
        `/examinations/exams/${id}/`,
      )
    },

    publish: async (
      id: number,
    ): Promise<Exam> => {
      const response =
        await apiClient.post<Exam>(
          `/examinations/exams/${id}/publish/`,
        )

      return response.data
    },

    unpublish: async (
      id: number,
    ): Promise<Exam> => {
      const response =
        await apiClient.post<Exam>(
          `/examinations/exams/${id}/unpublish/`,
        )

      return response.data
    },
  },

  /* ======================================================================== */
  /* ADMIN RESULTS                                                             */
  /* ======================================================================== */

  adminResults: {
    list: async (
      params?: AdminResultListParams,
    ) => {
      const response =
        await apiClient.get<{
          count: number
          next: string | null
          previous: string | null
          results: AdminStudentResult[]
        }>(
          '/examinations/results/',
          {
            params,
          },
        )

      return response.data
    },

    create: async (
      data: AdminStudentResultCreateData,
    ): Promise<AdminStudentResult> => {
      const response =
        await apiClient.post<AdminStudentResult>(
          '/examinations/results/',
          data,
        )

      return response.data
    },

    update: async (
      id: number,
      data: AdminStudentResultCreateData,
    ): Promise<AdminStudentResult> => {
      const response =
        await apiClient.patch<AdminStudentResult>(
          `/examinations/results/${id}/`,
          data,
        )

      return response.data
    },

    delete: async (
      id: number,
    ): Promise<void> => {
      await apiClient.delete(
        `/examinations/results/${id}/`,
      )
    },
  },
}