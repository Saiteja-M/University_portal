import { apiClient } from '../../lib/axios'

export interface CurrentUserProfile {
  user_type: string
  phone_number: string
  employee_or_student_id: string
}

export interface CurrentUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_superuser: boolean
  roles: string[]
  faculty_id: number | null
  profile: CurrentUserProfile | null
}
export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>(
    '/auth/me/',
  )

  return response.data
}