import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  useAcademicYears,
  useCreateCourse,
  usePrograms,
  useRegulations,
  useSemesters,
} from '../hooks'

const courseCreateSchema = z.object({
  program: z.string().min(1, 'Select a program.'),
  academic_year: z.string().min(1, 'Select an academic year.'),
  semester: z.string().min(1, 'Select a semester.'),
  regulation: z.string().min(1, 'Select a regulation.'),
  code: z.string().min(1, 'Course code is required.'),
  name: z.string().min(1, 'Course name is required.'),
  credits: z
    .string()
    .min(1, 'Credits are required.')
    .refine(
      (value) => {
        const number = Number(value)
        return Number.isFinite(number) && number >= 0 && number <= 30
      },
      {
        message: 'Credits must be between 0 and 30.',
      },
    ),
  is_active: z.boolean(),
})

type CourseCreateForm = z.infer<typeof courseCreateSchema>

export default function CourseCreatePage() {
  const navigate = useNavigate()
  const createCourseMutation = useCreateCourse()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      is_active: true,
    },
  })

  const selectedProgram = watch('program')
  const selectedAcademicYear = watch('academic_year')

  const programsQuery = usePrograms({ is_active: true })

  const academicYearsQuery = useAcademicYears()

  const regulationsQuery = useRegulations({
    is_active: true,
    ...(selectedProgram
      ? { program: Number(selectedProgram) }
      : {}),
  })

  const semestersQuery = useSemesters({
    is_active: true,
    ...(selectedProgram
      ? { program: Number(selectedProgram) }
      : {}),
    ...(selectedAcademicYear
      ? { academic_year: Number(selectedAcademicYear) }
      : {}),
  })

  useEffect(() => {
    setValue('semester', '')
    setValue('regulation', '')
  }, [selectedProgram, selectedAcademicYear, setValue])

  const onSubmit = async (data: CourseCreateForm) => {
    try {
      await createCourseMutation.mutateAsync({
        semester: Number(data.semester),
        regulation: Number(data.regulation),
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        credits: Number(data.credits),
        is_active: data.is_active,
      })

      navigate('/academics/courses')
    } catch {
      // Mutation error is displayed below.
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Course</h1>

        <p className="mt-1 text-sm text-gray-600">
          Add a course to an academic semester and regulation.
        </p>
      </div>

      {createCourseMutation.isError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to create course. Please check the entered details and try
          again.
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm"
      >
        {/* Program */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Program
          </label>

          <select
            {...register('program')}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select program</option>

            {programsQuery.data?.results.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code} â€” {program.name}
              </option>
            ))}
          </select>

          {errors.program && (
            <p className="mt-1 text-sm text-red-600">
              {errors.program.message}
            </p>
          )}
        </div>

        {/* Academic Year */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Academic Year
          </label>

          <select
            {...register('academic_year')}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Select academic year</option>

            {academicYearsQuery.data?.results.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>

          {errors.academic_year && (
            <p className="mt-1 text-sm text-red-600">
              {errors.academic_year.message}
            </p>
          )}
        </div>

        {/* Regulation */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Regulation
          </label>

          <select
            {...register('regulation')}
            disabled={!selectedProgram}
            className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
          >
            <option value="">
              {selectedProgram
                ? 'Select regulation'
                : 'Select program first'}
            </option>

            {regulationsQuery.data?.results.map((regulation) => (
              <option key={regulation.id} value={regulation.id}>
                {regulation.code} â€” {regulation.name}
              </option>
            ))}
          </select>

          {errors.regulation && (
            <p className="mt-1 text-sm text-red-600">
              {errors.regulation.message}
            </p>
          )}
        </div>

        {/* Semester */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Semester
          </label>

          <select
            {...register('semester')}
            disabled={!selectedProgram || !selectedAcademicYear}
            className="w-full rounded-lg border px-3 py-2 disabled:bg-gray-100"
          >
            <option value="">
              {!selectedProgram
                ? 'Select program first'
                : !selectedAcademicYear
                  ? 'Select academic year first'
                  : 'Select semester'}
            </option>

            {semestersQuery.data?.results.map((semester) => (
              <option key={semester.id} value={semester.id}>
                Semester {semester.number} ({semester.semester_type})
              </option>
            ))}
          </select>

          {errors.semester && (
            <p className="mt-1 text-sm text-red-600">
              {errors.semester.message}
            </p>
          )}
        </div>

        {/* Course Code */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Course Code
          </label>

          <input
            {...register('code')}
            placeholder="Example: CS301"
            className="w-full rounded-lg border px-3 py-2"
          />

          {errors.code && (
            <p className="mt-1 text-sm text-red-600">
              {errors.code.message}
            </p>
          )}
        </div>

        {/* Course Name */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Course Name
          </label>

          <input
            {...register('name')}
            placeholder="Example: Data Structures"
            className="w-full rounded-lg border px-3 py-2"
          />

          {errors.name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Credits */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Credits
          </label>

          <input
            type="number"
            min="0"
            max="30"
            step="1"
            {...register('credits')}
            className="w-full rounded-lg border px-3 py-2"
          />

          {errors.credits && (
            <p className="mt-1 text-sm text-red-600">
              {errors.credits.message}
            </p>
          )}
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            {...register('is_active')}
          />

          <label
            htmlFor="is_active"
            className="text-sm font-medium"
          >
            Active
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-6">
          <button
            type="button"
            onClick={() => navigate('/academics/courses')}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={createCourseMutation.isPending}
            className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
          >
            {createCourseMutation.isPending
              ? 'Creating...'
              : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  )
}
