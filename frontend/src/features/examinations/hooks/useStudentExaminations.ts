import { useMyExaminations as useExaminations } from './useExaminations'

export const studentExaminationKeys = {
  all: ['examinations', 'my-examinations'] as const,
}

export function useMyExaminations() {
  return useExaminations()
}
