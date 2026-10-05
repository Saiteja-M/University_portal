const EMPTY_REGULATIONS: never[] = []

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  usePrograms,
  useRegulations,
  useCreateRegulation,
  useUpdateRegulation,
  useDeleteRegulation,
} from '../hooks'

import type { Program, Regulation } from '../types'

interface RegulationFormData {
  program: number | ''
  code: string
  name: string
  start_year: number | ''
  end_year: number | ''
  is_active: boolean
}

const initialForm: RegulationFormData = {
  program: '',
  code: '',
  name: '',
  start_year: '',
  end_year: '',
  is_active: true,
}

export default function RegulationsPage() {
  const {
    data: regulationsData,
    isLoading: regulationsLoading,
    isError: regulationsError,
  } = useRegulations()

  const {
    data: programsData,
    isLoading: programsLoading,
  } = usePrograms()

  const createRegulation = useCreateRegulation()
  const updateRegulation = useUpdateRegulation()
  const deleteRegulation = useDeleteRegulation()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegulation, setEditingRegulation] =
    useState<Regulation | null>(null)

  const [form, setForm] =
    useState<RegulationFormData>(initialForm)

  const [formError, setFormError] = useState('')

  const regulations = regulationsData?.results ?? EMPTY_REGULATIONS
  const programs = programsData?.results ?? []

  const filteredRegulations = useMemo(() => {
    const query = search.trim().toLowerCase()

    return regulations.filter((regulation) => {
      const matchesSearch =
        !query ||
        regulation.code.toLowerCase().includes(query) ||
        regulation.name.toLowerCase().includes(query) ||
        regulation.program_name.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && regulation.is_active) ||
        (statusFilter === 'INACTIVE' && !regulation.is_active)

      return matchesSearch && matchesStatus
    })
  }, [regulations, search, statusFilter])

  const totalRegulations = regulations.length

  const activeRegulations = regulations.filter(
    (regulation) => regulation.is_active,
  ).length

  const inactiveRegulations = regulations.filter(
    (regulation) => !regulation.is_active,
  ).length

  const openCreateModal = () => {
    setEditingRegulation(null)
    setForm(initialForm)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (regulation: Regulation) => {
    setEditingRegulation(regulation)

    setForm({
      program: regulation.program,
      code: regulation.code,
      name: regulation.name,
      start_year: regulation.start_year,
      end_year: regulation.end_year ?? '',
      is_active: regulation.is_active,
    })

    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (
      createRegulation.isPending ||
      updateRegulation.isPending
    ) {
      return
    }

    setIsModalOpen(false)
    setEditingRegulation(null)
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

    if (!form.code.trim()) {
      setFormError('Regulation code is required.')
      return
    }

    if (!form.name.trim()) {
      setFormError('Regulation name is required.')
      return
    }

    if (!form.start_year) {
      setFormError('Start year is required.')
      return
    }

    if (
      Number(form.start_year) < 2000 ||
      Number(form.start_year) > 2100
    ) {
      setFormError('Start year must be between 2000 and 2100.')
      return
    }

    if (
      form.end_year !== '' &&
      (Number(form.end_year) < 2000 ||
        Number(form.end_year) > 2100)
    ) {
      setFormError('End year must be between 2000 and 2100.')
      return
    }

    if (
      form.end_year !== '' &&
      Number(form.end_year) < Number(form.start_year)
    ) {
      setFormError('End year cannot be earlier than start year.')
      return
    }

    const payload = {
      program: Number(form.program),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      start_year: Number(form.start_year),
      end_year:
        form.end_year === ''
          ? null
          : Number(form.end_year),
      is_active: form.is_active,
    }

    try {
      if (editingRegulation) {
        await updateRegulation.mutateAsync({
          id: editingRegulation.id,
          data: payload,
        })
      } else {
        await createRegulation.mutateAsync(payload)
      }

      closeModal()
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.code?.[0] ||
        error?.response?.data?.name?.[0] ||
        error?.response?.data?.program?.[0] ||
        error?.response?.data?.start_year?.[0] ||
        'Unable to save the regulation. Please check the entered details.'

      setFormError(String(detail))
    }
  }

  const handleDelete = async (
    regulation: Regulation,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${regulation.name}"?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteRegulation.mutateAsync(regulation.id)
    } catch (error: any) {
      window.alert(
        error?.response?.data?.detail ||
          'Unable to delete this regulation.',
      )
    }
  }

  if (regulationsLoading || programsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">
              Loading regulations...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (regulationsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-700">
              Unable to load regulations
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
              Regulations
            </h1>

            <p className="mt-2 text-gray-600">
              Manage academic regulations associated with
              university programs.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Regulation
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Regulations
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalRegulations}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {activeRegulations}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Inactive
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-500">
              {inactiveRegulations}
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
              placeholder="Search by code, name, or program..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Code
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Regulation
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Program
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Validity
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
                {filteredRegulations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No regulations found.
                    </td>
                  </tr>
                ) : (
                  filteredRegulations.map(
                    (regulation) => (
                      <tr
                        key={regulation.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {regulation.code}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {regulation.name}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {regulation.program_name}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {regulation.start_year}
                          {' — '}
                          {regulation.end_year ?? 'Present'}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              regulation.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {regulation.is_active
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(regulation)
                              }
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(regulation)
                              }
                              disabled={
                                deleteRegulation.isPending
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
            Showing {filteredRegulations.length} of{' '}
            {totalRegulations} regulations
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRegulation
                    ? 'Edit Regulation'
                    : 'Add Regulation'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingRegulation
                    ? 'Update the regulation details.'
                    : 'Create a new academic regulation.'}
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

              {/* Code */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Regulation Code{' '}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="Example: R25"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Regulation Name{' '}
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
                  placeholder="Example: JNTUH R25 Regulation"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Years */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Start Year{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={form.start_year}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        start_year:
                          event.target.value === ''
                            ? ''
                            : Number(event.target.value),
                      }))
                    }
                    placeholder="2025"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    End Year
                  </label>

                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={form.end_year}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        end_year:
                          event.target.value === ''
                            ? ''
                            : Number(event.target.value),
                      }))
                    }
                    placeholder="Leave blank if current"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Active */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />

                <span className="text-sm font-medium text-gray-700">
                  Active Regulation
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    createRegulation.isPending ||
                    updateRegulation.isPending
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createRegulation.isPending ||
                    updateRegulation.isPending
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createRegulation.isPending ||
                  updateRegulation.isPending
                    ? 'Saving...'
                    : editingRegulation
                      ? 'Update Regulation'
                      : 'Create Regulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}