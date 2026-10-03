import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment,
} from '../hooks'

import type { Department } from '../types'

type DepartmentForm = {
  code: string
  name: string
  description: string
  is_active: boolean
}

const emptyForm: DepartmentForm = {
  code: '',
  name: '',
  description: '',
  is_active: true,
}

export default function DepartmentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null)

  const [form, setForm] = useState<DepartmentForm>(emptyForm)
  const [formError, setFormError] = useState('')

  const departmentsQuery = useDepartments()

  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()

  const departments = departmentsQuery.data?.results ?? []

  const filteredDepartments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return departments.filter((department) => {
      const matchesSearch =
        !normalizedSearch ||
        department.code.toLowerCase().includes(normalizedSearch) ||
        department.name.toLowerCase().includes(normalizedSearch) ||
        department.description
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && department.is_active) ||
        (statusFilter === 'INACTIVE' &&
          !department.is_active)

      return matchesSearch && matchesStatus
    })
  }, [departments, search, statusFilter])

  const activeCount = departments.filter(
    (department) => department.is_active,
  ).length

  const inactiveCount =
    departments.length - activeCount

  const openCreateForm = () => {
    setEditingDepartment(null)
    setForm(emptyForm)
    setFormError('')
    setIsFormOpen(true)
  }

  const openEditForm = (department: Department) => {
    setEditingDepartment(department)

    setForm({
      code: department.code,
      name: department.name,
      description: department.description,
      is_active: department.is_active,
    })

    setFormError('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (
      createDepartment.isPending ||
      updateDepartment.isPending
    ) {
      return
    }

    setIsFormOpen(false)
    setEditingDepartment(null)
    setForm(emptyForm)
    setFormError('')
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const code = form.code.trim().toUpperCase()
    const name = form.name.trim()
    const description = form.description.trim()

    if (!code) {
      setFormError('Department code is required.')
      return
    }

    if (!name) {
      setFormError('Department name is required.')
      return
    }

    if (editingDepartment) {
      updateDepartment.mutate(
        {
          id: editingDepartment.id,
          data: {
            code,
            name,
            description,
            is_active: form.is_active,
          },
        },
        {
          onSuccess: () => {
            closeForm()
          },
          onError: (error) => {
            setFormError(
              getApiErrorMessage(
                error,
                'Unable to update department.',
              ),
            )
          },
        },
      )

      return
    }

    createDepartment.mutate(
      {
        code,
        name,
        description,
        is_active: form.is_active,
      },
      {
        onSuccess: () => {
          closeForm()
        },
        onError: (error) => {
          setFormError(
            getApiErrorMessage(
              error,
              'Unable to create department.',
            ),
          )
        },
      },
    )
  }

  const handleDelete = (department: Department) => {
    const confirmed = window.confirm(
      `Delete department "${department.name}"?\n\nThis action cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    deleteDepartment.mutate(department.id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Academics
              </p>

              <h1 className="mt-1 text-3xl font-bold text-gray-900">
                Departments
              </h1>

              <p className="mt-2 text-sm text-gray-600">
                Create and manage academic departments across
                the university.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Add Department
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total Departments"
            value={departments.length}
          />

          <SummaryCard
            label="Active"
            value={activeCount}
          />

          <SummaryCard
            label="Inactive"
            value={inactiveCount}
          />
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div>
              <label
                htmlFor="department-search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Search
              </label>

              <input
                id="department-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by code, name, or description..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="department-status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="department-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | 'ALL'
                      | 'ACTIVE'
                      | 'INACTIVE',
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">All Departments</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        {/* API loading */}
        {departmentsQuery.isLoading && (
          <section className="mt-6 rounded-xl border bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-600">
              Loading departments...
            </p>
          </section>
        )}

        {/* API error */}
        {departmentsQuery.isError && (
          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-800">
              Unable to load departments
            </h2>

            <p className="mt-1 text-sm text-red-700">
              Please check the backend connection and try
              again.
            </p>

            <button
              type="button"
              onClick={() => void departmentsQuery.refetch()}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </section>
        )}

        {/* Table */}
        {!departmentsQuery.isLoading &&
          !departmentsQuery.isError && (
            <section className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Department Directory
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Showing {filteredDepartments.length} of{' '}
                    {departments.length} departments
                  </p>
                </div>
              </div>

              {filteredDepartments.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="font-medium text-gray-900">
                    No departments found
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Try changing your search or filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Code
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Department
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Description
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
                      {filteredDepartments.map(
                        (department) => (
                          <tr
                            key={department.id}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="whitespace-nowrap px-6 py-4">
                              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                                {department.code}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900">
                                {department.name}
                              </p>
                            </td>

                            <td className="max-w-md px-6 py-4">
                              <p className="truncate text-sm text-gray-600">
                                {department.description ||
                                  'No description'}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-6 py-4">
                              <StatusBadge
                                active={department.is_active}
                              />
                            </td>

                            <td className="whitespace-nowrap px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditForm(
                                      department,
                                    )
                                  }
                                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      department,
                                    )
                                  }
                                  disabled={
                                    deleteDepartment.isPending
                                  }
                                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
      </main>

      {/* Department form modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="department-form-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="border-b px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    id="department-form-title"
                    className="text-xl font-bold text-gray-900"
                  >
                    {editingDepartment
                      ? 'Edit Department'
                      : 'Add Department'}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {editingDepartment
                      ? 'Update department information.'
                      : 'Create a new academic department.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-6">
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="department-code"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Department Code
                  </label>

                  <input
                    id="department-code"
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                    placeholder="e.g. CSE"
                    maxLength={20}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm uppercase outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="department-name"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Department Name
                  </label>

                  <input
                    id="department-name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Computer Science and Engineering"
                    maxLength={150}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="department-description"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="department-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Optional department description"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <label className="flex items-center gap-3">
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
                    Department is active
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={
                    createDepartment.isPending ||
                    updateDepartment.isPending
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createDepartment.isPending ||
                    updateDepartment.isPending
                  }
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createDepartment.isPending ||
                  updateDepartment.isPending
                    ? 'Saving...'
                    : editingDepartment
                      ? 'Save Changes'
                      : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700'
          : 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600'
      }
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function getApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
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

    const data = response?.data

    if (
      typeof data === 'object' &&
      data !== null
    ) {
      const detail = (
        data as {
          detail?: unknown
        }
      ).detail

      if (typeof detail === 'string') {
        return detail
      }

      const messages = Object.values(
        data as Record<string, unknown>,
      ).flatMap((value) =>
        Array.isArray(value)
          ? value.filter(
              (item): item is string =>
                typeof item === 'string',
            )
          : typeof value === 'string'
            ? [value]
            : [],
      )

      if (messages.length > 0) {
        return messages.join(' ')
      }
    }
  }

  return fallback
}