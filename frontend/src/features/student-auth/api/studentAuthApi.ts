import { apiClient } from '../../../lib/axios'

import type {
  RegistrationOptions,
  StudentRegistrationFormData,
  RegistrationVerificationResult,
  RegistrationCompletionData,
  PasswordResetRequestData,
  PasswordResetRequestResult,
  PasswordResetCompletionData,
} from '../types'

export async function getRegistrationOptions() {
  const response =
    await apiClient.get<RegistrationOptions>(
      '/auth/student/registration/options/',
    )

  return response.data
}

export async function verifyStudentRegistration(
  data: StudentRegistrationFormData,
) {
  const response =
    await apiClient.post<RegistrationVerificationResult>(
      '/auth/student/registration/verify/',
      data,
    )

  return response.data
}

export async function completeStudentRegistration(
  data: RegistrationCompletionData,
) {
  const response =
    await apiClient.post<{ detail: string }>(
      '/auth/student/registration/complete/',
      data,
    )

  return response.data
}

export async function requestPasswordReset(
  data: PasswordResetRequestData,
) {
  const response =
    await apiClient.post<PasswordResetRequestResult>(
      '/auth/student/password-reset/request/',
      data,
    )

  return response.data
}

export async function confirmPasswordReset(
  data: PasswordResetCompletionData,
) {
  const response =
    await apiClient.post<{ detail: string }>(
      '/auth/student/password-reset/confirm/',
      data,
    )

  return response.data
}