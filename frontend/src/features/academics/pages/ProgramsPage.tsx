import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  useDepartments,
  usePrograms,
  useCreateProgram,
  useUpdateProgram,
  useDeleteProgram,
} from '../hooks'

import type {
  Department,
  Program,
} from '../types'

interface ProgramFormData {
  department: number | ''
  code: string
  name: string
  duration_years: number
  is_active: boolean
}

const initialForm: ProgramFormData = {
  department: '',
  code: '',
  name: '',
  duration_years: 4,
  is_active: true,
}

export default function ProgramsPage() {
  const {
    data: programsData,
    isLoading: programsLoading,
    isError: programsError,
  } = usePrograms()

  const {
    data: departmentsData,
    isLoading: departmentsLoading,
  } = useDepartments()

  const createProgram = useCreateProgram()
  const updateProgram = useUpdateProgram()
  const deleteProgram = useDeleteProgram()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)

  const [form, setForm] = useState<ProgramFormData>(initialForm)
  const [formError, setFormError] = useState('')

  const programs = programsData?.results ?? []
  const departments = departmentsData?.results ?? []

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLowerCase()

    return programs.filter((program) => {
      const matchesSearch =
        !query ||
        program.code.toLowerCase().includes(query) ||
        program.name.toLowerCase().includes(query) ||
        program.department_name.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && program.is_active) ||
        (statusFilter === 'INACTIVE' && !program.is_active)

      return matchesSearch && matchesStatus
    })
  }, [programs, search, statusFilter])

  const totalPrograms = programs.length
  const activePrograms = programs.filter((program) => program.is_active).length
  const inactivePrograms = programs.filter((program) => !program.is_active).length

  const openCreateModal = () => {
    setEditingProgram(null)
    setForm(initialForm)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (program: Program) => {
    setEditingProgram(program)

    setForm({
      department: program.department,
      code: program.code,
      name: program.name,
      duration_years: program.duration_years,
      is_active: program.is_active,
    })

    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (createProgram.isPending || updateProgram.isPending) {
      return
    }

    setIsModalOpen(false)
    setEditingProgram(null)
    setForm(initialForm)
    setFormError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    if (!form.department) {
      setFormError('Please select a department.')
      return
    }

    if (!form.code.trim()) {
      setFormError('Program code is required.')
      return
    }

    if (!form.name.trim()) {
      setFormError('Program name is required.')
      return
    }

    if (form.duration_years < 1 || form.duration_years > 10) {
      setFormError('Duration must be between 1 and 10 years.')
      return
    }

    const payload = {
      department: Number(form.department),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      duration_years: Number(form.duration_years),
      is_active: form.is_active,
    }

    try {
      if (editingProgram) {
        await updateProgram.mutateAsync({
          id: editingProgram.id,
          data: payload,
        })
      } else {
        await createProgram.mutateAsync(payload)
      }

      closeModal()
    } catch (error: any) {
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.code?.[0] ||
        error?.response?.data?.name?.[0] ||
        error?.response?.data?.department?.[0] ||
        'Unable to save the program. Please check the entered details.'

      setFormError(String(detail))
    }
  }

  const handleDelete = async (program: Program) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${program.name}"?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteProgram.mutateAsync(program.id)
    } catch (error: any) {
      window.alert(
        error?.response?.data?.detail ||
          'Unable to delete this program.',
      )
    }
  }

  if (programsLoading || departmentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-600">Loading programs...</p>
          </div>
        </div>
      </div>
    )
  }

  if (programsError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-700">
              Unable to load programs
            </h2>

            <p className="mt-2 text-sm text-red-600">
              Please make sure the backend server is running and try again.
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
              Programs
            </h1>

            <p className="mt-2 text-gray-600">
              Manage degree programs and their department relationships.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Program
          </button>
        </div>

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Programs</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalPrograms}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {activePrograms}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="mt-2 text-3xl font-bold text-gray-500">
              {inactivePrograms}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code, program name, or department..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE',
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

        {/* Programs Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Code
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Program
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Department
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Duration
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
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      No programs found.
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((program) => (
                    <tr
                      key={program.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {program.code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {program.name}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {program.department_name}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {program.duration_years} years
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            program.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {program.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(program)}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(program)}
                            disabled={deleteProgram.isPending}
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
            Showing {filteredPrograms.length} of {totalPrograms} programs
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProgram ? 'Edit Program' : 'Add Program'}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingProgram
                    ? 'Update the program details.'
                    : 'Create a new academic program.'}
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

            <form onSubmit={handleSubmit} className="space-y-5 p-6">

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              {/* Department */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Department <span className="text-red-500">*</span>
                </label>

                <select
                  value={form.department}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      department:
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select department</option>

                  {departments.map((department: Department) => (
                    <option
                      key={department.id}
                      value={department.id}
                    >
                      {department.code} — {department.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Code */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Program Code <span className="text-red-500">*</span>
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
                  placeholder="Example: CSE"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Program Name <span className="text-red-500">*</span>
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
                  placeholder="Example: Computer Science and Engineering"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Duration (Years)
                </label>

                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.duration_years}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      duration_years: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
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
                  Active Program
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    createProgram.isPending ||
                    updateProgram.isPending
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createProgram.isPending ||
                    updateProgram.isPending
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createProgram.isPending || updateProgram.isPending
                    ? 'Saving...'
                    : editingProgram
                      ? 'Update Program'
                      : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}