import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'

import {
  useAcademicYears,
  usePrograms,
  useSemesters,
} from '../academics/hooks'
import { useCreateStudent } from './hooks/useStudents'

const statuses = [
  'ACTIVE',
  'INACTIVE',
  'GRADUATED',
  'SUSPENDED',
  'DROPPED',
] as const

const enrollmentStatuses = [
  'ACTIVE',
  'COMPLETED',
  'WITHDRAWN',
] as const

const genders = [
  'MALE',
  'FEMALE',
  'OTHER',
] as const

const bloodGroups = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const

const schema = z
  .object({
    // ============================================================
    // ACCOUNT
    // ============================================================

    create_first_name: z
      .string()
      .trim()
      .min(1, 'First name is required'),

    create_last_name: z
      .string()
      .trim()
      .min(1, 'Last name is required'),

    create_institutional_email: z
      .string()
      .trim()
      .email('Enter a valid email address'),

    // ============================================================
    // PERSONAL / STUDENT PROFILE
    // ============================================================

    create_date_of_birth: z
      .string()
      .min(1, 'Date of birth is required'),

    create_gender: z.enum(genders, {
      error: 'Gender is required',
    }),

    create_blood_group: z
      .string()
      .optional(),

    create_phone_number: z
      .string()
      .trim()
      .min(10, 'Enter a valid mobile number')
      .max(20, 'Mobile number is too long'),

    create_alternate_phone_number: z
      .string()
      .trim()
      .optional(),

    create_address: z
      .string()
      .trim()
      .optional(),

    create_city: z
      .string()
      .trim()
      .optional(),

    create_state: z
      .string()
      .trim()
      .optional(),

    create_postal_code: z
      .string()
      .trim()
      .optional(),

    // ============================================================
    // STUDENT ACADEMIC IDENTITY
    // ============================================================

    student_id: z
      .string()
      .trim()
      .min(1, 'Student ID is required'),

    admission_number: z
      .string()
      .trim()
      .min(1, 'Admission number is required'),

    program: z
      .number()
      .int()
      .positive('Please select a programme'),

    admission_date: z
      .string()
      .min(1, 'Admission date is required'),

    status: z.enum(statuses),

    // ============================================================
    // INITIAL ENROLLMENT
    // ============================================================

    enrollment_academic_year: z
      .number()
      .int()
      .positive()
      .optional(),

    enrollment_semester: z
      .number()
      .int()
      .positive()
      .optional(),

    enrollment_date: z
      .string()
      .optional(),

    enrollment_status: z
      .enum(enrollmentStatuses)
      .optional(),
  })
  .refine(
    (data) => {
      const hasAcademicYear =
        data.enrollment_academic_year !== undefined

      const hasSemester =
        data.enrollment_semester !== undefined

      return hasAcademicYear === hasSemester
    },
    {
      message:
        'Academic year and semester must be selected together',
      path: ['enrollment_semester'],
    },
  )

type FormData = z.infer<typeof schema>

export function StudentCreatePage() {
  const navigate = useNavigate()

  const createStudent = useCreateStudent()

  // ============================================================
  // ACADEMIC DATA
  // ============================================================

  const programs = usePrograms({
    is_active: true,
  })

  const academicYears = useAcademicYears()

  // ============================================================
  // FORM
  // ============================================================

  const form = useForm<FormData>({
    resolver: zodResolver(schema),

    defaultValues: {
      create_first_name: '',
      create_last_name: '',
      create_institutional_email: '',

      create_date_of_birth: '',
      create_gender: undefined,
      create_blood_group: '',
      create_phone_number: '',
      create_alternate_phone_number: '',
      create_address: '',
      create_city: '',
      create_state: '',
      create_postal_code: '',

      student_id: '',
      admission_number: '',
      admission_date: '',
      status: 'ACTIVE',

      enrollment_status: 'ACTIVE',
      enrollment_date: new Date()
        .toISOString()
        .slice(0, 10),
    },
  })

  const selectedProgram = useWatch({
    control: form.control,
    name: 'program',
  })

  const selectedAcademicYear = useWatch({
    control: form.control,
    name: 'enrollment_academic_year',
  })

  // ============================================================
  // SEMESTERS
  // ============================================================

  const semesters = useSemesters({
    ...(selectedProgram !== undefined
      ? {
          program: selectedProgram,
        }
      : {}),

    ...(selectedAcademicYear !== undefined
      ? {
          academic_year: selectedAcademicYear,
        }
      : {}),

    is_active: true,
  })

  const academicYearOptions =
    academicYears.data?.results ?? []

  const semesterOptions =
    semesters.data?.results ?? []

  // ============================================================
  // PROGRAMME CHANGE
  // ============================================================

  const handleProgramChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value

    const programId =
      value === '' ? undefined : Number(value)

    form.setValue(
      'program',
      programId as number,
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    )

    form.setValue(
      'enrollment_academic_year',
      undefined,
      {
        shouldValidate: true,
      },
    )

    form.setValue(
      'enrollment_semester',
      undefined,
      {
        shouldValidate: true,
      },
    )
  }

  // ============================================================
  // ACADEMIC YEAR CHANGE
  // ============================================================

  const handleAcademicYearChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value

    const academicYearId =
      value === '' ? undefined : Number(value)

    form.setValue(
      'enrollment_academic_year',
      academicYearId,
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    )

    form.setValue(
      'enrollment_semester',
      undefined,
      {
        shouldValidate: true,
      },
    )
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  const submit = (data: FormData) => {
    /*
     * IMPORTANT:
     *
     * The backend expects the create_* profile fields.
     * They are intentionally sent as part of the same
     * student creation request.
     */

    createStudent.mutate(data, {
      onSuccess: (student) => {
        navigate(`/students/${student.id}`)
      },
    })
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* ====================================================== */}
        {/* PAGE HEADER                                             */}
        {/* ====================================================== */}

        <div>
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            ← Back to Students
          </button>

          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            Add New Student
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create the official student record, personal profile, academic identity,
            and initial enrollment. Portal credentials are created by the student
            after OTP verification.
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(submit)}
          className="mt-6 space-y-6"
        >

          {/* ==================================================== */}
          {/* STUDENT IDENTITY                                       */}
          {/* ==================================================== */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Student Identity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the official student identity details. No username or
                password is created here. The student will activate the portal
                account after OTP verification.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FormInput
                label="First Name"
                required
                {...form.register('create_first_name')}
                error={form.formState.errors.create_first_name?.message}
              />

              <FormInput
                label="Last Name"
                required
                {...form.register('create_last_name')}
                error={form.formState.errors.create_last_name?.message}
              />

              <FormInput
                label="Institutional / Student Email"
                type="email"
                required
                className="md:col-span-2"
                placeholder="student@example.com"
                {...form.register('create_institutional_email')}
                error={
                  form.formState.errors.create_institutional_email?.message
                }
              />
            </div>

            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <strong>Account activation:</strong> the student will use this
              email during registration, receive an OTP, and create their own
              password.
            </div>
          </section>

          {/* ==================================================== */}
          {/* PERSONAL INFORMATION                                  */}
          {/* ==================================================== */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                These details are stored in the student profile
                and are used during student portal registration.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <FormInput
                label="Date of Birth"
                type="date"
                required
                {...form.register(
                  'create_date_of_birth',
                )}
                error={
                  form.formState.errors
                    .create_date_of_birth?.message
                }
              />

              <FormSelect
                label="Gender"
                required
                {...form.register('create_gender')}
                error={
                  form.formState.errors
                    .create_gender?.message
                }
              >
                <option value="">
                  Select gender
                </option>

                {genders.map((gender) => (
                  <option
                    key={gender}
                    value={gender}
                  >
                    {gender}
                  </option>
                ))}
              </FormSelect>

              <FormSelect
                label="Blood Group"
                {...form.register(
                  'create_blood_group',
                )}
                error={
                  form.formState.errors
                    .create_blood_group?.message
                }
              >
                <option value="">
                  Select blood group
                </option>

                {bloodGroups.map((group) => (
                  <option
                    key={group}
                    value={group}
                  >
                    {group}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Mobile Number"
                type="tel"
                required
                placeholder="10-digit mobile number"
                {...form.register(
                  'create_phone_number',
                )}
                error={
                  form.formState.errors
                    .create_phone_number?.message
                }
              />

              <FormInput
                label="Alternate Mobile Number"
                type="tel"
                {...form.register(
                  'create_alternate_phone_number',
                )}
                error={
                  form.formState.errors
                    .create_alternate_phone_number
                    ?.message
                }
              />

              <FormInput
                label="City"
                {...form.register('create_city')}
                error={
                  form.formState.errors
                    .create_city?.message
                }
              />

              <FormInput
                label="State"
                {...form.register('create_state')}
                error={
                  form.formState.errors
                    .create_state?.message
                }
              />

              <FormInput
                label="Postal Code"
                {...form.register(
                  'create_postal_code',
                )}
                error={
                  form.formState.errors
                    .create_postal_code?.message
                }
              />

              <FormInput
                label="Address"
                className="md:col-span-2"
                {...form.register('create_address')}
                error={
                  form.formState.errors
                    .create_address?.message
                }
              />

            </div>
          </section>

          {/* ==================================================== */}
          {/* ACADEMIC INFORMATION                                 */}
          {/* ==================================================== */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Academic Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Institutional academic identity and admission
                information.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              <FormInput
                label="Student ID"
                required
                placeholder="Example: 24AIML001"
                {...form.register('student_id')}
                error={
                  form.formState.errors
                    .student_id?.message
                }
              />

              <FormInput
                label="Admission Number"
                required
                {...form.register(
                  'admission_number',
                )}
                error={
                  form.formState.errors
                    .admission_number?.message
                }
              />

              {/* Programme */}

              <FormSelect
                label="Programme"
                required
                value={selectedProgram ?? ''}
                onChange={handleProgramChange}
                error={
                  form.formState.errors
                    .program?.message
                }
              >
                <option value="">
                  Select programme
                </option>

                {programs.data?.results.map(
                  (program) => (
                    <option
                      key={program.id}
                      value={program.id}
                    >
                      {program.code} — {program.name}
                    </option>
                  ),
                )}
              </FormSelect>

              <FormInput
                label="Admission Date"
                type="date"
                required
                {...form.register(
                  'admission_date',
                )}
                error={
                  form.formState.errors
                    .admission_date?.message
                }
              />

              {/* Status */}

              <FormSelect
                label="Status"
                required
                {...form.register('status')}
                error={
                  form.formState.errors
                    .status?.message
                }
              >
                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </FormSelect>

            </div>
          </section>

          {/* ==================================================== */}
          {/* INITIAL ENROLLMENT                                    */}
          {/* ==================================================== */}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Initial Enrollment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Optional. If selected, the initial enrollment
                will be created together with the student.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              {/* Academic Year */}

              <FormSelect
                label="Academic Year"
                value={selectedAcademicYear ?? ''}
                onChange={handleAcademicYearChange}
                error={
                  form.formState.errors
                    .enrollment_academic_year
                    ?.message
                }
              >
                <option value="">
                  No enrollment
                </option>

                {academicYearOptions.map(
                  (year) => (
                    <option
                      key={year.id}
                      value={year.id}
                    >
                      {year.name}
                      {year.is_current
                        ? ' — Current'
                        : ''}
                    </option>
                  ),
                )}
              </FormSelect>

              {/* Semester */}

              <FormSelect
                label="Semester"
                disabled={
                  selectedProgram === undefined ||
                  selectedAcademicYear ===
                    undefined
                }
                {...form.register(
                  'enrollment_semester',
                  {
                    setValueAs: (value) =>
                      value === ''
                        ? undefined
                        : Number(value),
                  },
                )}
                error={
                  form.formState.errors
                    .enrollment_semester
                    ?.message
                }
              >
                <option value="">
                  {selectedProgram === undefined
                    ? 'Select programme first'
                    : selectedAcademicYear ===
                        undefined
                      ? 'Select academic year first'
                      : semesters.isLoading
                        ? 'Loading semesters...'
                        : semesterOptions.length === 0
                          ? 'No semesters available'
                          : 'Select semester'}
                </option>

                {semesterOptions.map(
                  (semester) => (
                    <option
                      key={semester.id}
                      value={semester.id}
                    >
                      Semester {semester.number} —{' '}
                      {semester.semester_type}
                    </option>
                  ),
                )}
              </FormSelect>

              {/* Enrollment Date */}

              <FormInput
                label="Enrollment Date"
                type="date"
                {...form.register(
                  'enrollment_date',
                )}
                error={
                  form.formState.errors
                    .enrollment_date?.message
                }
              />

              {/* Enrollment Status */}

              <FormSelect
                label="Enrollment Status"
                {...form.register(
                  'enrollment_status',
                )}
                error={
                  form.formState.errors
                    .enrollment_status?.message
                }
              >
                {enrollmentStatuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ),
                )}
              </FormSelect>

            </div>

            {semesters.isError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Unable to load semesters for the
                selected programme and academic year.
              </div>
            )}

          </section>

          {/* ==================================================== */}
          {/* CREATE ERROR                                          */}
          {/* ==================================================== */}

          {createStudent.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

              <p className="font-semibold">
                Unable to create student
              </p>

              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">
                {axios.isAxiosError(
                  createStudent.error,
                )
                  ? JSON.stringify(
                      createStudent.error.response
                        ?.data,
                      null,
                      2,
                    )
                  : 'Unable to create student.'}
              </pre>

            </div>
          )}

          {/* ==================================================== */}
          {/* ACTIONS                                               */}
          {/* ==================================================== */}

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={() =>
                navigate('/students')
              }
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createStudent.isPending}
              className="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createStudent.isPending
                ? 'Creating...'
                : 'Create Student'}
            </button>

          </div>

        </form>
      </div>
    </div>
  )
}

/* ========================================================================== */
/* FORM INPUT                                                                  */
/* ========================================================================== */

type FormInputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label: string
    error?: string
  }

function FormInput({
  label,
  error,
  className = '',
  ...props
}: FormInputProps) {
  return (
    <label className={className}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {props.required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        {...props}
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />

      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </label>
  )
}

/* ========================================================================== */
/* FORM SELECT                                                                 */
/* ========================================================================== */

type FormSelectProps =
  SelectHTMLAttributes<HTMLSelectElement> & {
    label: string
    error?: string
  }

function FormSelect({
  label,
  error,
  className = '',
  children,
  ...props
}: FormSelectProps) {
  return (
    <label className={className}>
      <span className="text-sm font-medium text-slate-700">
        {label}
        {props.required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <select
        {...props}
        className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>

      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </label>
  )
}