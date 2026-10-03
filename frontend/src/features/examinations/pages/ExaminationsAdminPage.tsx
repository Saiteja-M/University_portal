import { useMemo, useState } from 'react'

import {
  useCreateExam,
  useDeleteExam,
  useExams,
  usePublishExam,
  useUnpublishExam,
  useUpdateExam,
} from '../hooks/useExaminations'

import type {
  Exam,
  ExamCreateData,
  ExamUpdateData,
} from '../types/adminExaminations'

import type { ExamType } from '../types/examinations'

import { useSemesters } from '../../academics/hooks/useAcademics'

type ExamForm = {
  name: string
  exam_type: ExamType
  semester: number
  start_date: string
  end_date: string
  max_marks: number
  is_active: boolean
}

const emptyForm: ExamForm = {
  name: '',
  exam_type: 'MID_I',
  semester: 0,
  start_date: '',
  end_date: '',
  max_marks: 100,
  is_active: true,
}

const examTypes: { value: ExamType; label: string }[] = [
  { value: 'MID_I', label: 'Mid-I' },
  { value: 'MID_II', label: 'Mid-II' },
  { value: 'SEMESTER', label: 'Semester End' },
  { value: 'LAB', label: 'Laboratory' },
  { value: 'INTERNAL', label: 'Internal Assessment' },
]

function formatDate(value: string) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString()
}

function getExamTypeLabel(type: ExamType) {
  return (
    examTypes.find((item) => item.value === type)?.label ?? type
  )
}

export function ExaminationsAdminPage() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const [form, setForm] = useState<ExamForm>(emptyForm)
  const [error, setError] = useState('')

  const examsQuery = useExams()
  const semestersQuery = useSemesters()

  const createExam = useCreateExam()
  const updateExam = useUpdateExam()
  const deleteExam = useDeleteExam()
  const publishExam = usePublishExam()
  const unpublishExam = useUnpublishExam()

  const exams = examsQuery.data?.results ?? []
  const semesters = semestersQuery.data?.results ?? []

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return exams
    }

    return exams.filter((exam) => {
      return (
        exam.name.toLowerCase().includes(query) ||
        exam.exam_type.toLowerCase().includes(query) ||
        String(exam.semester_number).includes(query)
      )
    })
  }, [exams, search])

  const openCreate = () => {
    setEditingExam(null)
    setForm({
      ...emptyForm,
      semester: semesters[0]?.id ?? 0,
    })
    setError('')
    setShowForm(true)
  }

  const openEdit = (exam: Exam) => {
    setEditingExam(exam)
    setForm({
      name: exam.name,
      exam_type: exam.exam_type,
      semester: exam.semester,
      start_date: exam.start_date,
      end_date: exam.end_date,
      max_marks: exam.max_marks,
      is_active: exam.is_active,
    })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (
      createExam.isPending ||
      updateExam.isPending
    ) {
      return
    }

    setShowForm(false)
    setEditingExam(null)
    setForm(emptyForm)
    setError('')
  }

  const updateField = <K extends keyof ExamForm>(
    field: K,
    value: ExamForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Exam name is required.')
      return
    }

    if (!form.semester) {
      setError('Please select a semester.')
      return
    }

    if (!form.start_date || !form.end_date) {
      setError('Start date and end date are required.')
      return
    }

    if (form.end_date < form.start_date) {
      setError('End date cannot be before start date.')
      return
    }

    if (form.max_marks <= 0) {
      setError('Maximum marks must be greater than zero.')
      return
    }

    try {
      if (editingExam) {
        const data: ExamUpdateData = {
          name: form.name.trim(),
          exam_type: form.exam_type,
          semester: form.semester,
          start_date: form.start_date,
          end_date: form.end_date,
          max_marks: form.max_marks,
          is_active: form.is_active,
        }

        await updateExam.mutateAsync({
          id: editingExam.id,
          data,
        })
      } else {
        const data: ExamCreateData = {
          name: form.name.trim(),
          exam_type: form.exam_type,
          semester: form.semester,
          start_date: form.start_date,
          end_date: form.end_date,
          max_marks: form.max_marks,
          is_active: form.is_active,
        }

        await createExam.mutateAsync(data)
      }

      closeForm()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to save examination.'

      setError(message)
    }
  }

  const handleDelete = async (exam: Exam) => {
    const confirmed = window.confirm(
      `Delete "${exam.name}"? This action cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteExam.mutateAsync(exam.id)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to delete examination.'

      window.alert(message)
    }
  }

  const handlePublishToggle = async (exam: Exam) => {
    try {
      if (exam.is_published) {
        await unpublishExam.mutateAsync(exam.id)
      } else {
        await publishExam.mutateAsync(exam.id)
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to update publication status.'

      window.alert(message)
    }
  }

  if (examsQuery.isLoading || semestersQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6">
          Loading examinations...
        </div>
      </div>
    )
  }

  if (examsQuery.isError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          Unable to load examinations.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Examination Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create, manage, publish and monitor academic examinations.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          + Create Examination
        </button>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search examinations..."
          className="w-full rounded-lg border px-4 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Examination
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Type
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Semester
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Dates
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Marks
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  Status
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredExams.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No examinations found.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id}>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {exam.name}
                      </div>

                      <div className="text-xs text-gray-500">
                        Academic Year:{' '}
                        {exam.academic_year_name}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {getExamTypeLabel(exam.exam_type)}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      Semester {exam.semester_number}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      <div>
                        {formatDate(exam.start_date)}
                      </div>

                      <div className="text-xs text-gray-500">
                        to {formatDate(exam.end_date)}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {exam.max_marks}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          exam.is_published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {exam.is_published
                          ? 'Published'
                          : 'Unpublished'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(exam)}
                          disabled={exam.is_published}
                          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handlePublishToggle(exam)
                          }
                          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                          {exam.is_published
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(exam)
                          }
                          disabled={
                            exam.is_published ||
                            deleteExam.isPending
                          }
                          className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingExam
                    ? 'Edit Examination'
                    : 'Create Examination'}
                </h2>

                <p className="text-sm text-gray-500">
                  Configure examination details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="text-xl text-gray-500 hover:text-gray-900"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Exam Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField('name', event.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Mid-I Examination"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Exam Type
                  </label>

                  <select
                    value={form.exam_type}
                    onChange={(event) =>
                      updateField(
                        'exam_type',
                        event.target.value as ExamType,
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    {examTypes.map((type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Semester
                  </label>

                  <select
                    value={form.semester}
                    onChange={(event) =>
                      updateField(
                        'semester',
                        Number(event.target.value),
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value={0}>
                      Select semester
                    </option>

                    {semesters.map((semester) => (
                      <option
                        key={semester.id}
                        value={semester.id}
                      >
                        Semester {semester.number} —{' '}
                        {semester.academic_year_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      updateField(
                        'start_date',
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(event) =>
                      updateField(
                        'end_date',
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Maximum Marks
                </label>

                <input
                  type="number"
                  min={1}
                  value={form.max_marks}
                  onChange={(event) =>
                    updateField(
                      'max_marks',
                      Number(event.target.value),
                    )
                  }
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateField(
                      'is_active',
                      event.target.checked,
                    )
                  }
                />

                <span className="text-sm">
                  Examination is active
                </span>
              </label>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border px-4 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createExam.isPending ||
                    updateExam.isPending
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createExam.isPending ||
                  updateExam.isPending
                    ? 'Saving...'
                    : editingExam
                      ? 'Update Examination'
                      : 'Create Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}