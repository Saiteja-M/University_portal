export type StudyYear = 1 | 2 | 3 | 4

export type OtpChannel = 'EMAIL' | 'SMS'

export interface RegistrationProgram {
  id: number
  name: string
  code?: string
}

export interface RegistrationAcademicYear {
  id: number
  name: string
  start_date?: string
  end_date?: string
  is_current?: boolean
}

export interface RegistrationOptions {
  programs: RegistrationProgram[]
  academic_years: RegistrationAcademicYear[]
}

export interface StudentRegistrationFormData {
  username: string
  student_id: string
  mobile_number: string
  email: string
  study_year: StudyYear
  program_id: number
  academic_year_id: number
}

export interface RegistrationVerificationResult {
  registration_token: string
  student_id: string
  expires_at: string
  otp_expires_at: string
}

export interface RegistrationCompletionData {
  registration_token: string
  otp: string
  password: string
  password_confirm: string
}

export interface PasswordResetRequestData {
  student_id: string
  channel: OtpChannel
}

export interface PasswordResetRequestResult {
  reset_token: string
  student_id: string
  expires_at: string
  otp_expires_at: string
}

export interface PasswordResetCompletionData {
  reset_token: string
  otp: string
  password: string
  password_confirm: string
}