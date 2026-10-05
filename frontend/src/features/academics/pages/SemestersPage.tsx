const EMPTY_SEMESTERS: never[] = []
const EMPTY_PROGRAMS: never[] = []
const EMPTY_ACADEMIC_YEARS: never[] = []

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  usePrograms,
  useAcademicYears,
  useSemesters,
  useCreateSemester,
  useUpdateSemester,
  useDeleteSemester,
} from '../hooks'

import type {
  AcademicYear,
  Program,
  Semester,
  SemesterType,
} from '../types'

interface SemesterFormData {
  program: number | ''
  academic_year: number | ''
  number: number | ''
  semester_type: SemesterType
  is_active: boolean
}

const initialForm: SemesterFormData = {
  program: '',
  academic_year: '',
  number: '',
  semester_type: 'ODD',
  is_active: true,
}

export default function SemestersPage() {
  const {
    data: semestersData,
    isLoading: semestersLoading,
    isError: semestersError,
  } = useSemesters()

  const {
    data: programsData,
    isLoading: programsLoading,
  } = usePrograms()

  const {
    data: academicYearsData,
    isLoading: academicYearsLoading,
  } = useAcademicYears()

  const createSemester = useCreateSemester()
  const updateSemester = useUpdateSemester()
  const deleteSemester = useDeleteSemester()

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL')

  const [typeFilter, setTypeFilter] = useState<
    'ALL' | SemesterType
  >('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)

  const [editingSemester, setEditingSemester] =
    useState<Semester | null>(null)

  const [form, setForm] =
    useState<SemesterFormData>(initialForm)

  const [formError, setFormError] = useState('')

  const semesters = semestersData?.results ?? EMPTY_SEMESTERS
  const programs = programsData?.results ?? EMPTY_PROGRAMS
  const academicYears = academicYearsData?.results ?? EMPTY_ACADEMIC_YEARS

  const filteredSemesters = useMemo(() => {
    const query = search.trim().toLowerCase()

    return semesters.filter((semester) => {
      const matchesSearch =
        !query ||
        semester.program_name.toLowerCase().includes(query) ||
        semester.academic_year_name
          .toLowerCase()
          .includes(query) ||
        String(semester.number).includes(query) ||
        semester.semester_type
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && semester.is_active) ||
        (statusFilter === 'INACTIVE' && !semester.is_active)

      const matchesType =
        typeFilter === 'ALL' ||
        semester.semester_type === typeFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      )
    })
  }, [
    semesters,
    search,
    statusFilter,
    typeFilter,
  ])

  const totalSemesters = semesters.length

  const activeSemesters = semesters.filter(
    (semester) => semester.is_active,
  ).length

  
  const oddSemesters = semesters.filter(
    (semester) => semester.semester_type === 'ODD',
  ).length

  const evenSemesters = semesters.filter(
    (semester) => semester.semester_type === 'EVEN',
  ).length

  const openCreateModal = () => {
    setEditingSemester(null)
    setForm(initialForm)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (semester: Semester) => {
    setEditingSemester(semester)

    setForm({
      program: semester.program,
      academic_year: semester.academic_year,
      number: semester.number,
      semester_type: semester.semester_type,
      is_active: semester.is_active,
    })

    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (
      createSemester.isPending ||
      updateSemester.isPending
    ) {
      return
    }

    setIsModalOpen(false)
    setEditingSemester(null)
    setForm(initialForm)
    setFormError('')
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setFormError('')

    if (!form.program) {
      setFormError('Please select a program.')
      return
    }

    if (!form.academic_year) {
      setFormError('Please select an academic year.')
      return
    }

    if (!form.number) {
      setFormError('Semester number is required.')
      return
    }

    const semesterNumber = Number(form.number)

    if (semesterNumber < 1 || semesterNumber > 12) {
      setFormError(
        'Semester number must be between 1 and 12.',
      )
      return
    }

    /*
     * Odd/even validation.
     *
     * Semester 1, 3, 5, 7... → ODD
     * Semester 2, 4, 6, 8... → EVEN
     */
    const expectedType =
      semesterNumber % 2 === 0 ? 'EVEN' : 'ODD'

    if (form.semester_type !== expectedType) {
      setFormError(
        `Semester ${semesterNumber} must use ${expectedType} semester type.`,
      )
      return
    }

    /*
     * Verify that the selected program and academic year
     * combination is sensible before submitting.
     */
    const selectedProgram = programs.find(
      (program) => program.id === Number(form.program),
    )

    const selectedAcademicYear = academicYears.find(
      (academicYear) =>
        academicYear.id === Number(form.academic_year),
    )

    if (!selectedProgram) {
      setFormError('Selected program could not be found.')
      return
    }

    if (!selectedAcademicYear) {
      setFormError(
        'Selected academic year could not be found.',
      )
      return
    }

    const payload = {
      program: Number(form.program),
      academic_year: Number(form.academic_year),
      number: semesterNumber,
      semester_type: form.semester_type,
      is_active: form.is_active,
    }

    try {
      if (editingSemester) {
        await updateSemester.mutateAsync({
          id: editingSemester.id,
          data: payload,
        })
      } else {
        await createSemester.mutateAsync(payload)
      }

      closeModal()
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.program?.[0] ||
        error?.response?.data?.academic_year?.[0] ||
        error?.response?.data?.number?.[0] ||
        error?.response?.data?.semester_type?.[0] ||
        error?.response?.data?.non_field_errors?.[0] ||
        'Unable to save the semester. Please check the entered details.'

      setFormError(String(detail))
    }
  }

  const handleDelete = async (
    semester: Semester,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Semester ${semester.number} of ${semester.program_name}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteSemester.mutateAsync(semester.id)
    } catch (error: any) {
      window.alert(
        error?.response?.data?.detail ||
          'Unable to delete this semester.',
      )
    }
  }

  if (
    semestersLoading ||
    programsLoading ||
    academicYearsLoading
  ) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              Loading semesters...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (semestersError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-700">
              Unable to load semesters
            </h2>

            <p className="mt-2 text-sm text-red-600">
              Please make sure the backend server is running
              and try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Academics
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Semesters
            </h1>

            <p className="mt-2 text-gray-600">
              Manage semesters for academic programs and
              academic years.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Semester
          </button>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Semesters
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalSemesters}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {activeSemesters}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Odd Semesters
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {oddSemesters}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Even Semesters
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {evenSemesters}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search program, year, or semester..."
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | 'ALL'
                    | 'ACTIVE'
                    | 'INACTIVE',
                )
              }
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as
                    | 'ALL'
                    | SemesterType,
                )
              }
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="ODD">Odd</option>
              <option value="EVEN">Even</option>
            </select>

          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Program
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Academic Year
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Semester
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredSemesters.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No semesters found.
                    </td>
                  </tr>
                ) : (
                  filteredSemesters.map((semester) => (
                    <tr
                      key={semester.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {semester.program_name}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {semester.academic_year_name}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          Semester {semester.number}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {semester.semester_type}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            semester.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {semester.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(semester)
                            }
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(semester)
                            }
                            disabled={
                              deleteSemester.isPending
                            }
                            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-3 text-sm text-gray-500">
            Showing {filteredSemesters.length} of{' '}
            {totalSemesters} semesters
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingSemester
                    ? 'Edit Semester'
                    : 'Add Semester'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingSemester
                    ? 'Update the semester details.'
                    : 'Create a new academic semester.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Program */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Program{' '}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  value={form.program}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      program:
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select program
                  </option>

                  {programs.map((program: Program) => (
                    <option
                      key={program.id}
                      value={program.id}
                    >
                      {program.code} — {program.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Academic Year{' '}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  value={form.academic_year}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      academic_year:
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    Select academic year
                  </option>

                  {academicYears.map(
                    (academicYear: AcademicYear) => (
                      <option
                        key={academicYear.id}
                        value={academicYear.id}
                      >
                        {academicYear.name}
                        {academicYear.is_current
                          ? ' — Current'
                          : ''}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Semester Number */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Semester Number{' '}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  min={1}
                  max={12}
                  value={form.number}
                  onChange={(event) => {
                    const value =
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value)

                    setForm((current) => ({
                      ...current,
                      number: value,
                      semester_type:
                        value !== '' &&
                        Number(value) % 2 === 0
                          ? 'EVEN'
                          : 'ODD',
                    }))
                  }}
                  placeholder="Example: 1"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-gray-500">
                  Odd semester numbers use ODD type and
                  even numbers use EVEN type.
                </p>
              </div>

              {/* Semester Type */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Semester Type
                </label>

                <select
                  value={form.semester_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      semester_type:
                        event.target.value as SemesterType,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ODD">
                    ODD
                  </option>

                  <option value="EVEN">
                    EVEN
                  </option>
                </select>
              </div>

              {/* Active */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_active:
                        event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />

                <span className="text-sm font-medium text-gray-700">
                  Active Semester
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    createSemester.isPending ||
                    updateSemester.isPending
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createSemester.isPending ||
                    updateSemester.isPending
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createSemester.isPending ||
                  updateSemester.isPending
                    ? 'Saving...'
                    : editingSemester
                      ? 'Update Semester'
                      : 'Create Semester'}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}