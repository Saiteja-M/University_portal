import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
} from '../hooks'

import type { AcademicYear } from '../types'

interface AcademicYearFormData {
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

const initialForm: AcademicYearFormData = {
  name: '',
  start_date: '',
  end_date: '',
  is_current: false,
}

export default function AcademicYearsPage() {
  const {
    data: academicYearsData,
    isLoading,
    isError,
  } = useAcademicYears()

  const createAcademicYear = useCreateAcademicYear()
  const updateAcademicYear = useUpdateAcademicYear()
  const deleteAcademicYear = useDeleteAcademicYear()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'CURRENT' | 'PREVIOUS'
  >('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAcademicYear, setEditingAcademicYear] =
    useState<AcademicYear | null>(null)

  const [form, setForm] =
    useState<AcademicYearFormData>(initialForm)

  const [formError, setFormError] = useState('')

  const academicYears = academicYearsData?.results ?? []

  const filteredAcademicYears = useMemo(() => {
    const query = search.trim().toLowerCase()

    return academicYears.filter((academicYear) => {
      const matchesSearch =
        !query ||
        academicYear.name.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'CURRENT' &&
          academicYear.is_current) ||
        (statusFilter === 'PREVIOUS' &&
          !academicYear.is_current)

      return matchesSearch && matchesStatus
    })
  }, [academicYears, search, statusFilter])

  const totalYears = academicYears.length

  const currentYears = academicYears.filter(
    (academicYear) => academicYear.is_current,
  ).length

  const previousYears = academicYears.filter(
    (academicYear) => !academicYear.is_current,
  ).length

  const openCreateModal = () => {
    setEditingAcademicYear(null)
    setForm(initialForm)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (academicYear: AcademicYear) => {
    setEditingAcademicYear(academicYear)

    setForm({
      name: academicYear.name,
      start_date: academicYear.start_date,
      end_date: academicYear.end_date,
      is_current: academicYear.is_current,
    })

    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (
      createAcademicYear.isPending ||
      updateAcademicYear.isPending
    ) {
      return
    }

    setIsModalOpen(false)
    setEditingAcademicYear(null)
    setForm(initialForm)
    setFormError('')
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setFormError('')

    if (!form.name.trim()) {
      setFormError('Academic year name is required.')
      return
    }

    if (!form.start_date) {
      setFormError('Start date is required.')
      return
    }

    if (!form.end_date) {
      setFormError('End date is required.')
      return
    }

    if (form.end_date < form.start_date) {
      setFormError(
        'End date cannot be earlier than start date.',
      )
      return
    }

    const payload = {
      name: form.name.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      is_current: form.is_current,
    }

    try {
      if (editingAcademicYear) {
        await updateAcademicYear.mutateAsync({
          id: editingAcademicYear.id,
          data: payload,
        })
      } else {
        await createAcademicYear.mutateAsync(payload)
      }

      closeModal()
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.name?.[0] ||
        error?.response?.data?.start_date?.[0] ||
        error?.response?.data?.end_date?.[0] ||
        error?.response?.data?.is_current?.[0] ||
        'Unable to save the academic year. Please check the entered details.'

      setFormError(String(detail))
    }
  }

  const handleDelete = async (
    academicYear: AcademicYear,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${academicYear.name}"?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteAcademicYear.mutateAsync(
        academicYear.id,
      )
    } catch (error: any) {
      window.alert(
        error?.response?.data?.detail ||
          'Unable to delete this academic year.',
      )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              Loading academic years...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-700">
              Unable to load academic years
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
              Academic Years
            </h1>

            <p className="mt-2 text-gray-600">
              Manage university academic sessions and
              current academic year status.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Academic Year
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Academic Years
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalYears}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Current
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {currentYears}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Previous
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-500">
              {previousYears}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search academic year..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | 'ALL'
                    | 'CURRENT'
                    | 'PREVIOUS',
                )
              }
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="ALL">All Years</option>
              <option value="CURRENT">Current</option>
              <option value="PREVIOUS">Previous</option>
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
                    Academic Year
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Start Date
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    End Date
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
                {filteredAcademicYears.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No academic years found.
                    </td>
                  </tr>
                ) : (
                  filteredAcademicYears.map(
                    (academicYear) => (
                      <tr
                        key={academicYear.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {academicYear.name}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {academicYear.start_date}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {academicYear.end_date}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              academicYear.is_current
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {academicYear.is_current
                              ? 'Current'
                              : 'Previous'}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  academicYear,
                                )
                              }
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  academicYear,
                                )
                              }
                              disabled={
                                deleteAcademicYear.isPending
                              }
                              className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-3 text-sm text-gray-500">
            Showing {filteredAcademicYears.length} of{' '}
            {totalYears} academic years
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
                  {editingAcademicYear
                    ? 'Edit Academic Year'
                    : 'Add Academic Year'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingAcademicYear
                    ? 'Update the academic year details.'
                    : 'Create a new academic year.'}
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

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Academic Year Name{' '}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Example: 2026-27"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Start Date{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        start_date:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    End Date{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        end_date:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Current */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.is_current}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_current:
                        event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />

                <span className="text-sm font-medium text-gray-700">
                  Current Academic Year
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    createAcademicYear.isPending ||
                    updateAcademicYear.isPending
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createAcademicYear.isPending ||
                    updateAcademicYear.isPending
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createAcademicYear.isPending ||
                  updateAcademicYear.isPending
                    ? 'Saving...'
                    : editingAcademicYear
                      ? 'Update Academic Year'
                      : 'Create Academic Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}