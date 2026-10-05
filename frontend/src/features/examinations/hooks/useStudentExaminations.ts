import { useQuery } from '@tanstack/react-query'
import { examinationsApi } from '../api/examinationsApi'
import type { ExamListParams } from '../types/adminExaminations'

export const studentExaminationKeys = {
  all: ['student-examinations'] as const,
}

export function useMyExaminations(params?: ExamListParams) {
  return useQuery({
    queryKey: [...studentExaminationKeys.all, params],
    queryFn: () => examinationsApi.student.exams(params),
  })
}
