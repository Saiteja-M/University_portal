import { useMutation, useQuery } from '@tanstack/react-query'

import {
  completeStudentRegistration,
  confirmPasswordReset,
  getRegistrationOptions,
  requestPasswordReset,
  verifyStudentRegistration,
} from '../api/studentAuthApi'

import type {
  PasswordResetCompletionData,
  PasswordResetRequestData,
  StudentRegistrationFormData,
  RegistrationCompletionData,
} from '../types'

export function useRegistrationOptions() {
  return useQuery({
    queryKey: ['student-registration-options'],
    queryFn: getRegistrationOptions,
    staleTime: 5 * 60 * 1000,
  })
}

export function useVerifyStudentRegistration() {
  return useMutation({
    mutationFn: (data: StudentRegistrationFormData) =>
      verifyStudentRegistration(data),
  })
}

export function useCompleteStudentRegistration() {
  return useMutation({
    mutationFn: (data: RegistrationCompletionData) =>
      completeStudentRegistration(data),
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (data: PasswordResetRequestData) =>
      requestPasswordReset(data),
  })
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (data: PasswordResetCompletionData) =>
      confirmPasswordReset(data),
  })
}