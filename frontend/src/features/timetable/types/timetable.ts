export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface TimetableSlot {
  id: number; offering: number; faculty: number; day_of_week: DayOfWeek; day_name: string
  period: number; start_time: string; end_time: string; room: string; building: string
  is_active: boolean; course_code: string; course_name: string; section: string
  academic_year_name: string; semester_number: number; program_name: string; faculty_name: string
}
export interface TimetableCreateData {
  offering: number; faculty: number; day_of_week: DayOfWeek; period: number
  start_time: string; end_time: string; room: string; building?: string; is_active?: boolean
}
export type TimetableUpdateData = Partial<TimetableCreateData>
