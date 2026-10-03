import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

import {
  useCreateStudentProfile,
  useMyStudent,
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

const emptyForm = (): FormState => ({
  date_of_birth: '',
  gender: 'OTHER',
  blood_group: '',
  phone_number: '',
  alternate_phone_number: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
})

export default function StudentProfilePage() {
  const studentQuery = useMyStudent()

  const createProfile = useCreateStudentProfile()
  const updateProfile = useUpdateStudentProfile()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [message, setMessage] = useState('')

  const student = studentQuery.data
  const profile = student?.profile ?? null

  useEffect(() => {
    if (!editing) {
      setForm(
        profile
          ? {
              date_of_birth: profile.date_of_birth ?? '',
              gender: profile.gender,
              blood_group: profile.blood_group ?? '',
              phone_number: profile.phone_number ?? '',
              alternate_phone_number:
                profile.alternate_phone_number ?? '',
              address: profile.address ?? '',
              city: profile.city ?? '',
              state: profile.state ?? '',
              postal_code: profile.postal_code ?? '',
            }
          : emptyForm(),
      )
    }
  }, [profile, editing])

  const changed = useMemo(() => {
    if (!profile) {
      return true
    }

    return (
      JSON.stringify(form) !==
      JSON.stringify({
        date_of_birth: profile.date_of_birth ?? '',
        gender: profile.gender,
        blood_group: profile.blood_group ?? '',
        phone_number: profile.phone_number ?? '',
        alternate_phone_number:
          profile.alternate_phone_number ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        postal_code: profile.postal_code ?? '',
      })
    )
  }, [profile, form])

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const startEditing = () => {
    setMessage('')
    setEditing(true)
  }

  const cancelEditing = () => {
    setMessage('')
    setEditing(false)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')

    if (!student) {
      return
    }

    if (!form.date_of_birth) {
      setMessage('Date of birth is required.')
      return
    }

    try {
      if (profile) {
        await updateProfile.mutateAsync({
          id: profile.id,
          data: form,
        })
      } else {
        await createProfile.mutateAsync({
          student: student.id,
          ...form,
        })
      }

      setEditing(false)
      setMessage('Profile updated successfully.')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data

        if (
          responseData &&
          typeof responseData === 'object'
        ) {
          setMessage(
            Object.values(responseData)
              .flat()
              .map(String)
              .join(' '),
          )
        } else {
          setMessage(
            'Unable to save your profile. Please try again.',
          )
        }
      } else {
        setMessage(
          'Unable to save your profile. Please try again.',
        )
      }
    }
  }

  if (studentQuery.isLoading) {
    return <ProfileLoading />
  }

  if (studentQuery.isError || !student) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              !
            </div>

            <h1 className="mt-5 text-xl font-bold text-slate-900">
              Unable to load your profile
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              We could not retrieve your student information.
              Please refresh the page or contact the university
              administration if the problem continues.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => void studentQuery.refetch()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Try Again
              </button>

              <Link
                to="/student/dashboard"
                className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const fullName =
    `${student.first_name} ${student.last_name}`.trim()

  const initials =
    `${student.first_name?.[0] ?? ''}${student.last_name?.[0] ?? ''}`
      .toUpperCase()

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Student Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your personal and academic information.
            </p>
          </div>

          <Link
            to="/student/dashboard"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Profile Hero */}
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600" />

          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-blue-100 text-2xl font-bold text-blue-700 shadow-sm">
                  {initials || 'ST'}
                </div>

                <div className="pb-1">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {fullName || 'Student'}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {student.student_id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  {student.status}
                </span>

                {!editing && (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Success / error message */}
        {message && (
          <div
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
              message.includes('successfully')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Main */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Academic Information */}
          <section className="rounded-2xl border bg-white shadow-sm lg:col-span-1">
            <div className="border-b px-6 py-5">
              <h2 className="font-bold text-slate-900">
                Academic Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Official university enrollment details
              </p>
            </div>

            <div className="space-y-5 p-6">
              <Detail
                label="Student ID"
                value={student.student_id}
              />

              <Detail
                label="Admission Number"
                value={student.admission_number}
              />

              <Detail
                label="Program"
                value={student.program_name}
              />

              <Detail
                label="Department"
                value={student.department_name}
              />

              <Detail
                label="Academic Year"
                value={student.academic_year ?? '—'}
              />

              <Detail
                label="Semester"
                value={
                  student.semester
                    ? `Semester ${student.semester}`
                    : '—'
                }
              />

              <Detail
                label="Year of Study"
                value={
                  student.year_of_study
                    ? `Year ${student.year_of_study}`
                    : '—'
                }
              />

              <Detail
                label="Admission Date"
                value={formatDate(student.admission_date)}
              />
            </div>
          </section>

          {/* Personal Information */}
          <section className="rounded-2xl border bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Personal Information
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Personal details associated with your student account
                </p>
              </div>
            </div>

            {!editing ? (
              <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
                <Detail
                  label="Full Name"
                  value={fullName || '—'}
                />

                <Detail
                  label="Email Address"
                  value={student.email || '—'}
                />

                <Detail
                  label="Date of Birth"
                  value={
                    profile?.date_of_birth
                      ? formatDate(profile.date_of_birth)
                      : 'Not provided'
                  }
                />

                <Detail
                  label="Gender"
                  value={
                    profile?.gender
                      ? formatEnum(profile.gender)
                      : 'Not provided'
                  }
                />

                <Detail
                  label="Blood Group"
                  value={
                    profile?.blood_group || 'Not provided'
                  }
                />

                <Detail
                  label="Phone Number"
                  value={
                    profile?.phone_number ||
                    'Not provided'
                  }
                />

                <Detail
                  label="Alternate Phone"
                  value={
                    profile?.alternate_phone_number ||
                    'Not provided'
                  }
                />

                <Detail
                  label="City"
                  value={profile?.city || 'Not provided'}
                />

                <Detail
                  label="State"
                  value={profile?.state || 'Not provided'}
                />

                <Detail
                  label="Postal Code"
                  value={
                    profile?.postal_code || 'Not provided'
                  }
                />

                <div className="sm:col-span-2">
                  <Detail
                    label="Address"
                    value={
                      profile?.address || 'Not provided'
                    }
                  />
                </div>
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="p-6"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Date of Birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={(value) =>
                      updateField(
                        'date_of_birth',
                        value,
                      )
                    }
                    required
                  />

                  <SelectField
                    label="Gender"
                    value={form.gender}
                    onChange={(value) =>
                      updateField(
                        'gender',
                        value as Gender,
                      )
                    }
                    options={[
                      ['MALE', 'Male'],
                      ['FEMALE', 'Female'],
                      ['OTHER', 'Other'],
                    ]}
                  />

                  <SelectField
                    label="Blood Group"
                    value={form.blood_group}
                    onChange={(value) =>
                      updateField(
                        'blood_group',
                        value as BloodGroup | '',
                      )
                    }
                    options={[
                      ['', 'Select blood group'],
                      ['A+', 'A+'],
                      ['A-', 'A-'],
                      ['B+', 'B+'],
                      ['B-', 'B-'],
                      ['AB+', 'AB+'],
                      ['AB-', 'AB-'],
                      ['O+', 'O+'],
                      ['O-', 'O-'],
                    ]}
                  />

                  <Field
                    label="Phone Number"
                    value={form.phone_number}
                    onChange={(value) =>
                      updateField(
                        'phone_number',
                        value,
                      )
                    }
                  />

                  <Field
                    label="Alternate Phone"
                    value={
                      form.alternate_phone_number
                    }
                    onChange={(value) =>
                      updateField(
                        'alternate_phone_number',
                        value,
                      )
                    }
                  />

                  <Field
                    label="City"
                    value={form.city}
                    onChange={(value) =>
                      updateField('city', value)
                    }
                  />

                  <Field
                    label="State"
                    value={form.state}
                    onChange={(value) =>
                      updateField('state', value)
                    }
                  />

                  <Field
                    label="Postal Code"
                    value={form.postal_code}
                    onChange={(value) =>
                      updateField(
                        'postal_code',
                        value,
                      )
                    }
                  />

                  <div className="sm:col-span-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">
                        Address
                      </span>

                      <textarea
                        value={form.address}
                        onChange={(event) =>
                          updateField(
                            'address',
                            event.target.value,
                          )
                        }
                        rows={4}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Enter your residential address"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-7 flex justify-end gap-3 border-t pt-5">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-lg border bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      createProfile.isPending ||
                      updateProfile.isPending ||
                      (!changed && Boolean(profile))
                    }
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createProfile.isPending ||
                    updateProfile.isPending
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* Account Information */}
        <section className="mt-6 rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="font-bold text-slate-900">
              Account Information
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Information associated with your university account
            </p>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-3">
            <Detail
              label="Username"
              value={student.username}
            />

            <Detail
              label="Institutional Email"
              value={student.email}
            />

            <Detail
              label="Account Status"
              value={student.status}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800">
        {value || '—'}
      </p>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
  options: [string, string][]
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

function ProfileLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="animate-pulse">
          <div className="h-32 rounded-2xl bg-slate-200" />

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="h-96 rounded-2xl bg-slate-200" />
            <div className="h-96 rounded-2xl bg-slate-200 lg:col-span-2" />
          </div>
        </div>
      </div>
    </main>
  )
}

function formatDate(value: string) {
  if (!value) {
    return '—'
  }

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

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    )
}