import { apiClient } from '../../../lib/axios'
import type { Exam } from '../types/adminExaminations'

export interface StudentExamListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Exam[]
}

export const studentExaminationsApi = {
  list: async (): Promise<StudentExamListResponse> => {
    const response = await apiClient.get<StudentExamListResponse>(
      '/examinations/student/exams/',
    )
    return response.data
  },
}
