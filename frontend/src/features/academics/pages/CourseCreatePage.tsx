import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  useAcademicYears,
  useCreateCourse,
  usePrograms,
  useRegulations,
  useSemesters,
} from '../hooks'
import type { CourseCategory } from '../types'

const courseCreateSchema = z.object({
  program: z.string().min(1, 'Select a program.'),
  academic_year: z.string().min(1, 'Select an academic year.'),
  semester: z.string().min(1, 'Select a semester.'),
  regulation: z.string().min(1, 'Select a regulation.'),
  code: z
    .string()
    .trim()
    .min(1, 'Course code is required.')
    .max(30, 'Course code must be 30 characters or fewer.'),
  name: z
    .string()
    .trim()
    .min(1, 'Course name is required.')
    .max(200, 'Course name must be 200 characters or fewer.'),
  credits: z
    .string()
    .min(1, 'Credits are required.')
    .refine(
      (value) => {
        const number = Number(value)
        return Number.isInteger(number) && number >= 0 && number <= 30
      },
      'Credits must be a whole number between 0 and 30.',
    ),
  lecture_hours: z.string().refine(
    (value) => {
      const number = Number(value)
      return Number.isInteger(number) && number >= 0 && number <= 20
    },
    'Lecture hours must be a whole number between 0 and 20.',
  ),
  tutorial_hours: z.string().refine(
    (value) => {
      const number = Number(value)
      return Number.isInteger(number) && number >= 0 && number <= 20
    },
    'Tutorial hours must be a whole number between 0 and 20.',
  ),
  practical_hours: z.string().refine(
    (value) => {
      const number = Number(value)
      return Number.isInteger(number) && number >= 0 && number <= 30
    },
    'Practical hours must be a whole number between 0 and 30.',
  ),
  course_category: z.enum([
    'THEORY',
    'LABORATORY',
    'PROJECT',
    'SEMINAR',
    'OTHER',
  ]),
  is_active: z.boolean(),
})

type CourseCreateForm = z.infer<typeof courseCreateSchema>

const courseCategories: Array<{ value: CourseCategory; label: string }> = [
  { value: 'THEORY', label: 'Theory' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'SEMINAR', label: 'Seminar' },
  { value: 'OTHER', label: 'Other' },
]

export default function CourseCreatePage() {
  const navigate = useNavigate()
  const createCourseMutation = useCreateCourse()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<CourseCreateForm>({
    resolver: zodResolver(courseCreateSchema),
    defaultValues: {
      program: '',
      academic_year: '',
      semester: '',
      regulation: '',
      code: '',
      name: '',
      credits: '',
      lecture_hours: '0',
      tutorial_hours: '0',
      practical_hours: '0',
      course_category: 'THEORY',
      is_active: true,
    },
  })

  const selectedProgram = useWatch({ control, name: 'program' })
  const selectedAcademicYear = useWatch({ control, name: 'academic_year' })

  const programsQuery = usePrograms({ is_active: true })
  const academicYearsQuery = useAcademicYears()
  const regulationsQuery = useRegulations({
    is_active: true,
    ...(selectedProgram ? { program: Number(selectedProgram) } : {}),
  })
  const semestersQuery = useSemesters({
    is_active: true,
    ...(selectedProgram ? { program: Number(selectedProgram) } : {}),
    ...(selectedAcademicYear
      ? { academic_year: Number(selectedAcademicYear) }
      : {}),
  })

  useEffect(() => {
    resetField('semester', { defaultValue: '' })
    resetField('regulation', { defaultValue: '' })
  }, [selectedProgram, selectedAcademicYear, resetField])

  const onSubmit = async (data: CourseCreateForm) => {
    try {
      await createCourseMutation.mutateAsync({
        semester: Number(data.semester),
        regulation: Number(data.regulation),
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        credits: Number(data.credits),
        lecture_hours: Number(data.lecture_hours),
        tutorial_hours: Number(data.tutorial_hours),
        practical_hours: Number(data.practical_hours),
        course_category: data.course_category,
        is_active: data.is_active,
      })

      navigate('/academics/courses')
    } catch {
      // API error is shown below.
    }
  }

  const programs = programsQuery.data?.results ?? []
  const academicYears = academicYearsQuery.data?.results ?? []
  const regulations = regulationsQuery.data?.results ?? []
  const semesters = semestersQuery.data?.results ?? []

  const programState =
    programsQuery.isLoading
      ? 'loading'
      : programsQuery.isError
        ? 'error'
        : programs.length === 0
          ? 'empty'
          : 'ready'

  const yearState =
    academicYearsQuery.isLoading
      ? 'loading'
      : academicYearsQuery.isError
        ? 'error'
        : academicYears.length === 0
          ? 'empty'
          : 'ready'

  const regulationState =
    regulationsQuery.isLoading && selectedProgram
      ? 'loading'
      : regulationsQuery.isError
        ? 'error'
        : regulations.length === 0 && selectedProgram
          ? 'empty'
          : 'ready'

  const semesterState =
    semestersQuery.isLoading && selectedProgram && selectedAcademicYear
      ? 'loading'
      : semestersQuery.isError
        ? 'error'
        : semesters.length === 0 && selectedProgram && selectedAcademicYear
          ? 'empty'
          : 'ready'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">Academics</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Create Course
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Add curriculum details for a program, academic year, semester,
            and regulation.
          </p>
        </div>

        {createCourseMutation.isError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Course could not be created.</p>
            <p className="mt-1">
              {getApiErrorMessage(createCourseMutation.error)}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-xl border bg-white p-6 shadow-sm lg:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              label="Program"
              error={errors.program?.message}
              {...register('program')}
            >
              <option value="">
                {programState === 'loading'
                  ? 'Loading programs...'
                  : programState === 'error'
                    ? 'Unable to load programs'
                    : programState === 'empty'
                      ? 'No active programs found'
                      : 'Select program'}
              </option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.code} — {program.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Academic Year"
              error={errors.academic_year?.message}
              {...register('academic_year')}
            >
              <option value="">
                {yearState === 'loading'
                  ? 'Loading academic years...'
                  : yearState === 'error'
                    ? 'Unable to load academic years'
                    : yearState === 'empty'
                      ? 'No academic years found'
                      : 'Select academic year'}
              </option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                  {year.is_current ? ' (Current)' : ''}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Regulation"
              disabled={!selectedProgram || regulationState === 'error'}
              error={errors.regulation?.message}
              {...register('regulation')}
            >
              <option value="">
                {!selectedProgram
                  ? 'Select program first'
                  : regulationState === 'loading'
                    ? 'Loading regulations...'
                    : regulationState === 'error'
                      ? 'Unable to load regulations'
                      : regulationState === 'empty'
                        ? 'No active regulations for this program'
                        : 'Select regulation'}
              </option>
              {regulations.map((regulation) => (
                <option key={regulation.id} value={regulation.id}>
                  {regulation.code} — {regulation.name}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Semester"
              disabled={
                !selectedProgram ||
                !selectedAcademicYear ||
                semesterState === 'error'
              }
              error={errors.semester?.message}
              {...register('semester')}
            >
              <option value="">
                {!selectedProgram
                  ? 'Select program first'
                  : !selectedAcademicYear
                    ? 'Select academic year first'
                    : semesterState === 'loading'
                      ? 'Loading semesters...'
                      : semesterState === 'error'
                        ? 'Unable to load semesters'
                        : semesterState === 'empty'
                          ? 'No semesters for this program and year'
                          : 'Select semester'}
              </option>
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  Semester {semester.number} ({capitalize(semester.semester_type)})
                </option>
              ))}
            </SelectField>

            <InputField
              label="Course Code"
              placeholder="e.g. CS301"
              error={errors.code?.message}
              {...register('code')}
            />

            <InputField
              label="Course Name"
              placeholder="e.g. Data Structures"
              error={errors.name?.message}
              {...register('name')}
            />

            <InputField
              label="Credits"
              type="number"
              min="0"
              max="30"
              step="1"
              placeholder="e.g. 3"
              error={errors.credits?.message}
              {...register('credits')}
            />

            <SelectField
              label="Course Category"
              error={errors.course_category?.message}
              {...register('course_category')}
            >
              {courseCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </SelectField>

            <InputField
              label="Lecture Hours"
              type="number"
              min="0"
              max="20"
              step="1"
              placeholder="e.g. 3"
              error={errors.lecture_hours?.message}
              {...register('lecture_hours')}
            />

            <InputField
              label="Tutorial Hours"
              type="number"
              min="0"
              max="20"
              step="1"
              placeholder="e.g. 1"
              error={errors.tutorial_hours?.message}
              {...register('tutorial_hours')}
            />

            <InputField
              label="Practical Hours"
              type="number"
              min="0"
              max="30"
              step="1"
              placeholder="e.g. 2"
              error={errors.practical_hours?.message}
              {...register('practical_hours')}
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              {...register('is_active')}
            />
            Active course
          </label>

          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              type="button"
              onClick={() => navigate('/academics/courses')}
              disabled={createCourseMutation.isPending}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                createCourseMutation.isPending ||
                programsQuery.isLoading ||
                academicYearsQuery.isLoading
              }
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
}

const SelectField = ({
  label,
  error,
  className = '',
  children,
  ...props
}: SelectFieldProps) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700">
      {label}
    </label>
    <select
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
)

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

const InputField = ({
  label,
  error,
  className = '',
  ...props
}: InputFieldProps) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
)

function capitalize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function getApiErrorMessage(error: unknown) {
  const responseData = (
    error as {
      response?: { data?: Record<string, unknown> }
    }
  )?.response?.data

  if (!responseData) {
    return 'Please check the entered values and try again.'
  }

  const preferredKeys = ['detail', 'non_field_errors', 'semester', 'regulation']

  for (const key of preferredKeys) {
    const value = responseData[key]
    const message = extractErrorMessage(value)
    if (message) return message
  }

  for (const value of Object.values(responseData)) {
    const message = extractErrorMessage(value)
    if (message) return message
  }

  return 'Please check the entered values and try again.'
}

function extractErrorMessage(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === 'string')
    return typeof firstString === 'string' ? firstString : null
  }
  return null
}
