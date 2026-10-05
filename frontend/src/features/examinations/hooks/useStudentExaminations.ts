import { useQuery } from '@tanstack/react-query'
import { studentExaminationsApi } from '../api/examinationsApi'

export const studentExaminationKeys = {
  all: ['student-examinations'] as const,
}

export function useMyExaminations() {
  return useQuery({
    queryKey: studentExaminationKeys.all,
    queryFn: studentExaminationsApi.list,
  })
}
