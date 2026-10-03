import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  useCreateStudentProfile,
  useStudent,
  useUpdateStudentProfile,
} from './hooks/useStudents'

import type {
  BloodGroup,
  Gender,
} from './types/students'

type FormState = {
  date_of_birth: string
  gender: Gender
  blood_group: BloodGroup | ''
  phone_number: string
  alternate_phone_number: string
  address: string
  city: string
  state: string
  postal_code: string
}

const EMPTY_FORM: FormState = {
  date_of_birth: '',
  gender: '' as Gender,
  blood_group: '',
  phone_number: '',
  alternate_phone_number: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
}

function formatDate(value?: string | null) {
  if (!value) return 'Not provided'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatEnum(value?: string | null) {
  if (!value) return 'Not provided'

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getInitials(
  firstName?: string,
  lastName?: string,
) {
  const first = firstName?.charAt(0) ?? ''
  const last = lastName?.charAt(0) ?? ''

  return `${first}${last}`.toUpperCase() || 'ST'
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: unknown
        }
      }
    ).response

    if (typeof response?.data === 'string') {
      return response.data
    }

    if (
      typeof response?.data === 'object' &&
      response.data !== null
    ) {
      return Object.entries(response.data)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(', ')}`
          }

          return `${key}: ${String(value)}`
        })
        .join(' | ')
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number | null | undefined
  icon?: typeof User
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {Icon && (
          <Icon className="h-4 w-4 text-blue-600" />
        )}
        {label}
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-900">
        {value === null ||
        value === undefined ||
        value === ''
          ? 'Not provided'
          : value}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{
    value: string
    label: string
  }>
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        <option value="">Select {label}</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof User
  title: string
  description: string
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function StudentAdminProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const studentId = Number(id)

  const studentQuery = useStudent(studentId)

  const createProfile =
    useCreateStudentProfile()

  const updateProfile =
    useUpdateStudentProfile()

  const [isEditing, setIsEditing] =
    useState(false)

  const [message, setMessage] =
    useState<string | null>(null)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM)

  const student = studentQuery.data

  const profile = student?.profile


  useEffect(() => {
    if (!profile) {
      setForm(EMPTY_FORM)
      return
    }

    setForm({
      date_of_birth:
        profile.date_of_birth ?? '',
      gender: profile.gender ?? ('' as Gender),
      blood_group:
        profile.blood_group ??
        '',
      phone_number:
        profile.phone_number ?? '',
      alternate_phone_number:
        profile.alternate_phone_number ??
        '',
      address:
        profile.address ?? '',
      city:
        profile.city ?? '',
      state:
        profile.state ?? '',
      postal_code:
        profile.postal_code ?? '',
    })
  }, [profile])

  const fullName = useMemo(() => {
    return [
      student?.first_name,
      student?.last_name,
    ]
      .filter(Boolean)
      .join(' ') || 'Student'
  }, [student])

  const handleChange = (
    field: keyof FormState,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleCancel = () => {
    if (profile) {
      setForm({
        date_of_birth:
          profile.date_of_birth ?? '',
        gender:
          profile.gender ??
          ('' as Gender),
        blood_group:
          profile.blood_group ?? '',
        phone_number:
          profile.phone_number ?? '',
        alternate_phone_number:
          profile.alternate_phone_number ??
          '',
        address:
          profile.address ?? '',
        city:
          profile.city ?? '',
        state:
          profile.state ?? '',
        postal_code:
          profile.postal_code ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
    }

    setIsEditing(false)
    setMessage(null)
    setErrorMessage(null)
  }

const handleSubmit = async (
  event: FormEvent<HTMLFormElement>,
) => {
  event.preventDefault()

  if (!student) {
    return
  }

  setMessage(null)
  setErrorMessage(null)

  // ---------------------------------------------------------
  // Creating a profile requires date of birth
  // ---------------------------------------------------------
  if (
    profile?.id === undefined &&
    !form.date_of_birth
  ) {
    setErrorMessage(
      'Date of birth is required when creating a student profile.',
    )
    return
  }

  try {
    // -------------------------------------------------------
    // UPDATE EXISTING PROFILE
    // -------------------------------------------------------
    if (profile?.id !== undefined) {
      await updateProfile.mutateAsync({
        id: profile.id,

        data: {
          date_of_birth:
            form.date_of_birth || undefined,

          gender:
            form.gender || undefined,

          blood_group:
            form.blood_group || undefined,

          phone_number:
            form.phone_number || '',

          alternate_phone_number:
            form.alternate_phone_number || '',

          address:
            form.address || '',

          city:
            form.city || '',

          state:
            form.state || '',

          postal_code:
            form.postal_code || '',
        },
      })
    }

    // -------------------------------------------------------
    // CREATE NEW PROFILE
    // -------------------------------------------------------
    else {
      await createProfile.mutateAsync({
        student: student.id,

        date_of_birth:
          form.date_of_birth,

        gender:
          form.gender || undefined,

        blood_group:
          form.blood_group || undefined,

        phone_number:
          form.phone_number || '',

        alternate_phone_number:
          form.alternate_phone_number || '',

        address:
          form.address || '',

        city:
          form.city || '',

        state:
          form.state || '',

        postal_code:
          form.postal_code || '',
      })
    }

    setMessage(
      'Student profile saved successfully.',
    )

    setIsEditing(false)

    await studentQuery.refetch()
  } catch (error) {
    setErrorMessage(
      getErrorMessage(error),
    )
  }
}

const isSaving =
    createProfile.isPending ||
    updateProfile.isPending

  if (!id || !Number.isInteger(studentId) || studentId <= 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <User className="h-7 w-7 text-red-600" />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-gray-900">
            Invalid student ID
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            The student profile URL does not contain
            a valid student identifier.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/students')
            }
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Students
          </button>
        </div>
      </div>
    )
  }

  if (studentQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-lg bg-gray-200" />
          <div className="h-48 rounded-2xl bg-gray-200" />
          <div className="h-72 rounded-2xl bg-gray-200" />
          <div className="h-72 rounded-2xl bg-gray-200" />
        </div>
      </div>
    )
  }

  if (studentQuery.isError || !student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <ShieldCheck className="h-7 w-7 text-red-600" />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-gray-900">
            Unable to load student
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {getErrorMessage(
              studentQuery.error,
            )}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                studentQuery.refetch()
              }
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>

            <Link
              to="/students"
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Students
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
              title="Back to students"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link
                  to="/students"
                  className="hover:text-blue-600"
                >
                  Students
                </Link>

                <span>/</span>

                <span>Profile</span>
              </div>

              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Student Profile
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setMessage(null)
                  setErrorMessage(null)
                  setIsEditing(true)
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>

                <button
                  type="submit"
                  form="student-admin-profile-form"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        {/* Profile Hero */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600" />

          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-2xl font-bold text-blue-700 shadow-md">
                  {getInitials(
                    student.first_name,
                    student.last_name,
                  )}
                </div>

                <div className="pb-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {fullName}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {student.student_id}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                      {formatEnum(student.status)}
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      Student
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Admission No.
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {student.admission_number}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Academic Year
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {student.academic_year ??
                      'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Academic Information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={GraduationCap}
            title="Academic Information"
            description="Official academic information associated with this student."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              label="Student ID"
              value={student.student_id}
              icon={User}
            />

            <Detail
              label="Admission Number"
              value={student.admission_number}
              icon={ShieldCheck}
            />

            <Detail
              label="Program"
              value={student.program_name}
              icon={GraduationCap}
            />

            <Detail
              label="Department"
              value={student.department_name}
              icon={BookOpen}
            />

            <Detail
              label="Academic Year"
              value={student.academic_year}
              icon={CalendarDays}
            />

            <Detail
              label="Semester"
              value={
                student.semester
                  ? `Semester ${student.semester}`
                  : null
              }
              icon={BookOpen}
            />

            <Detail
              label="Year of Study"
              value={
                student.year_of_study
                  ? `Year ${student.year_of_study}`
                  : null
              }
              icon={GraduationCap}
            />

            <Detail
              label="Admission Date"
              value={formatDate(
                student.admission_date,
              )}
              icon={CalendarDays}
            />
          </div>
        </section>

        {/* Profile Form / Personal Information */}
        <form
          id="student-admin-profile-form"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <SectionHeader
            icon={User}
            title="Personal Information"
            description="Personal and contact information maintained by the university."
          />

          {!isEditing ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail
                label="Date of Birth"
                value={formatDate(
                  profile?.date_of_birth,
                )}
                icon={CalendarDays}
              />

              <Detail
                label="Gender"
                value={formatEnum(
                  profile?.gender,
                )}
                icon={User}
              />

              <Detail
                label="Blood Group"
                value={
                  profile?.blood_group ??
                  'Not provided'
                }
                icon={ShieldCheck}
              />

              <Detail
                label="Phone Number"
                value={
                  profile?.phone_number
                }
                icon={Phone}
              />

              <Detail
                label="Alternate Phone"
                value={
                  profile?.alternate_phone_number
                }
                icon={Phone}
              />

              <Detail
                label="Email"
                value={student.email}
                icon={Mail}
              />

              <Detail
                label="Address"
                value={profile?.address}
                icon={MapPin}
              />

              <Detail
                label="City"
                value={profile?.city}
                icon={MapPin}
              />

              <Detail
                label="State"
                value={profile?.state}
                icon={MapPin}
              />

              <Detail
                label="Postal Code"
                value={profile?.postal_code}
                icon={MapPin}
              />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Date of Birth"
                type="date"
                value={form.date_of_birth}
                onChange={(value) =>
                  handleChange(
                    'date_of_birth',
                    value,
                  )
                }
              />

              <SelectField
                label="Gender"
                value={form.gender}
                onChange={(value) =>
                  handleChange(
                    'gender',
                    value,
                  )
                }
                options={[
                  {
                    value: 'MALE',
                    label: 'Male',
                  },
                  {
                    value: 'FEMALE',
                    label: 'Female',
                  },
                  {
                    value: 'OTHER',
                    label: 'Other',
                  },
                ]}
              />

              <SelectField
                label="Blood Group"
                value={form.blood_group}
                onChange={(value) =>
                  handleChange(
                    'blood_group',
                    value,
                  )
                }
                options={[
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                ]}
              />

              <Field
                label="Phone Number"
                value={form.phone_number}
                onChange={(value) =>
                  handleChange(
                    'phone_number',
                    value,
                  )
                }
                placeholder="Enter phone number"
              />

              <Field
                label="Alternate Phone"
                value={
                  form.alternate_phone_number
                }
                onChange={(value) =>
                  handleChange(
                    'alternate_phone_number',
                    value,
                  )
                }
                placeholder="Enter alternate phone"
              />

              <Field
                label="City"
                value={form.city}
                onChange={(value) =>
                  handleChange(
                    'city',
                    value,
                  )
                }
                placeholder="Enter city"
              />

              <Field
                label="State"
                value={form.state}
                onChange={(value) =>
                  handleChange(
                    'state',
                    value,
                  )
                }
                placeholder="Enter state"
              />

              <Field
                label="Postal Code"
                value={form.postal_code}
                onChange={(value) =>
                  handleChange(
                    'postal_code',
                    value,
                  )
                }
                placeholder="Enter postal code"
              />

              <div className="sm:col-span-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    Address
                  </span>

                  <textarea
                    value={form.address}
                    onChange={(event) =>
                      handleChange(
                        'address',
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Enter residential address"
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>
            </div>
          )}
        </form>

        {/* Account Information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={ShieldCheck}
            title="Account Information"
            description="System account and registration information."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              label="Username"
              value={student.username}
              icon={User}
            />

            <Detail
              label="Email"
              value={student.email}
              icon={Mail}
            />

            <Detail
              label="Student Status"
              value={formatEnum(
                student.status,
              )}
              icon={CheckCircle2}
            />

            <Detail
              label="Registered On"
              value={formatDate(
                student.created_at,
              )}
              icon={CalendarDays}
            />
          </div>
        </section>

        {/* Guardian Information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={Users}
            title="Guardian Information"
            description="Parent or guardian details associated with this student."
          />

          {student.guardians?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {student.guardians.map(
                (guardian) => (
                  <div
                    key={guardian.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {guardian.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {guardian.relationship}
                        </p>
                      </div>

                      <Users className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      {guardian.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {guardian.phone_number}
                        </div>
                      )}

                      {guardian.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {guardian.email}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-gray-400" />

              <p className="mt-3 text-sm font-medium text-gray-700">
                No guardian information available
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Guardian details have not been added
                for this student.
              </p>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}