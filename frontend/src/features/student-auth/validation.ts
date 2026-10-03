import type { StudentRegistrationFormData } from './types'

export type ValidationErrors = Partial<
  Record<keyof StudentRegistrationFormData, string>
>

export function validateStudentRegistration(
  form: StudentRegistrationFormData,
): ValidationErrors {
  const errors: ValidationErrors = {}

  const username = form.username.trim()

  if (!username) {
    errors.username = 'Username is required.'
  } else if (username.length < 4) {
    errors.username =
      'Username must be at least 4 characters.'
  } else if (username.length > 30) {
    errors.username =
      'Username must not exceed 30 characters.'
  } else if (
    !/^[a-z0-9._-]+$/.test(username)
  ) {
    errors.username =
      'Username can contain only lowercase letters, numbers, dot, underscore and hyphen.'
  }

  if (!form.student_id.trim()) {
    errors.student_id =
      'Student ID is required.'
  }

  if (!form.mobile_number.trim()) {
    errors.mobile_number =
      'Mobile number is required.'
  }

  if (!/^\d{10}$/.test(form.mobile_number.trim())) {
    errors.mobile_number =
      'Enter a valid 10-digit mobile number.'
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.'
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      form.email.trim(),
    )
  ) {
    errors.email = 'Enter a valid email address.'
  }

  if (
    ![1, 2, 3, 4].includes(form.study_year)
  ) {
    errors.study_year =
      'Please select a valid study year.'
  }

  if (form.program_id <= 0) {
    errors.program_id =
      'Please select your programme.'
  }

  if (form.academic_year_id <= 0) {
    errors.academic_year_id =
      'Please select an academic year.'
  }

  return errors
}