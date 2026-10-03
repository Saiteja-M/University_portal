import { useMemo, useState } from 'react'



import {

  useAdminResults,

  useCreateAdminResult,

  useDeleteAdminResult,

  useExams,

  usePublishExam,

  useUnpublishExam,

  useUpdateAdminResult,

} from '../hooks/useExaminations'



import type {

  ExamType,

  ResultStatus,

} from '../types/examinations'



import {

  useStudents,

} from '../../students/hooks/useStudents'



import {

  useCourses,

} from '../../academics/hooks/useAcademics'



import type {

  Student,

} from '../../students/types/students'



import type {

  Course,

} from '../../academics/types/academics'



interface ExamItem {

  id: number

  name: string

  exam_type: ExamType

  semester: number

  semester_number: number

  academic_year_name: string

  start_date: string

  end_date: string

  max_marks: number

  is_published: boolean

  is_active: boolean

}



interface ResultItem {

  id: number

  student: number

  student_name?: string

  student_id?: string

  exam: number

  course: number

  course_code?: string

  course_name?: string

  exam_name?: string

  exam_type?: ExamType

  marks: number

  grade: string

  grade_point: number | null

  status: ResultStatus

  remarks?: string

}



interface ResultForm {

  student: number

  exam: number

  course: number

  marks: number

  grade: string

  grade_point: number | null

  status: ResultStatus

  remarks: string

}




const emptyForm: ResultForm = {

  student: 0,

  exam: 0,

  course: 0,

  marks: 0,

  grade: '',

  grade_point: null,

  status: 'PASS',

  remarks: '',

}







const resultStatuses: ResultStatus[] = [

  'PASS',

  'FAIL',

  'ABSENT',

  'WITHHELD',

]



function getStudentDisplayName(

  student: Student,

): string {

  const fullName =

    `${student.first_name} ${student.last_name}`.trim()



  if (fullName) {

    return `${student.student_id} — ${fullName}`

  }



  return student.student_id

}



function getResultsArray(

  data: unknown,

): ResultItem[] {

  if (Array.isArray(data)) {

    return data as ResultItem[]

  }



  if (

    typeof data === 'object' &&

    data !== null &&

    'results' in data

  ) {

    const value = (

      data as {

        results?: unknown

      }

    ).results



    return Array.isArray(value)

      ? (value as ResultItem[])

      : []

  }



  return []

}



function getExamsArray(

  data: unknown,

): ExamItem[] {

  if (Array.isArray(data)) {

    return data as ExamItem[]

  }



  if (

    typeof data === 'object' &&

    data !== null &&

    'results' in data

  ) {

    const value = (

      data as {

        results?: unknown

      }

    ).results



    return Array.isArray(value)

      ? (value as ExamItem[])

      : []

  }



  return []

}



function getStudentsArray(

  data: unknown,

): Student[] {

  if (Array.isArray(data)) {

    return data as Student[]

  }



  if (

    typeof data === 'object' &&

    data !== null &&

    'results' in data

  ) {

    const value = (

      data as {

        results?: unknown

      }

    ).results



    return Array.isArray(value)

      ? (value as Student[])

      : []

  }



  return []

}



function getCoursesArray(

  data: unknown,

): Course[] {

  if (Array.isArray(data)) {

    return data as Course[]

  }



  if (

    typeof data === 'object' &&

    data !== null &&

    'results' in data

  ) {

    const value = (

      data as {

        results?: unknown

      }

    ).results



    return Array.isArray(value)

      ? (value as Course[])

      : []

  }



  return []

}







export function ExaminationResultsAdminPage() {

  const [selectedExam, setSelectedExam] =

    useState<number | undefined>(undefined)



  const [search, setSearch] =

    useState('')



  const [statusFilter, setStatusFilter] =

    useState<ResultStatus | ''>('')



  const [showModal, setShowModal] =

    useState(false)



  const [editingResult, setEditingResult] =

    useState<ResultItem | null>(null)



  const [form, setForm] =

    useState<ResultForm>(emptyForm)



  const [formError, setFormError] =

    useState('')



  const [successMessage, setSuccessMessage] =

    useState('')



  const examsQuery = useExams({

    ordering: '-start_date',

  })



  const resultsQuery = useAdminResults(

    selectedExam

      ? {

          exam: selectedExam,

        }

      : undefined,

  )



  const studentsQuery = useStudents({

    ordering: 'student_id',

  })



  const coursesQuery = useCourses()



  const createResult =

    useCreateAdminResult()



  const updateResult =

    useUpdateAdminResult()



  const deleteResult =

    useDeleteAdminResult()



  
  const publishExam = usePublishExam()

  const unpublishExam = useUnpublishExam()
const exams = useMemo(

    () => getExamsArray(examsQuery.data),

    [examsQuery.data],

  )



  const results = useMemo(

    () => getResultsArray(resultsQuery.data),

    [resultsQuery.data],

  )



  const students = useMemo(

    () => getStudentsArray(studentsQuery.data),

    [studentsQuery.data],

  )



  const courses = useMemo(

    () => getCoursesArray(coursesQuery.data),

    [coursesQuery.data],

  )



  const filteredResults = useMemo(() => {

    const normalizedSearch =

      search.trim().toLowerCase()



    return results.filter(

      (result: ResultItem) => {

        const matchesSearch =

          !normalizedSearch ||

          result.student_id

            ?.toLowerCase()

            .includes(normalizedSearch) ||

          result.student_name

            ?.toLowerCase()

            .includes(normalizedSearch) ||

          result.course_code

            ?.toLowerCase()

            .includes(normalizedSearch) ||

          result.course_name

            ?.toLowerCase()

            .includes(normalizedSearch)



        const matchesStatus =

          !statusFilter ||

          result.status === statusFilter



        return (

          matchesSearch &&

          matchesStatus

        )

      },

    )

  }, [

    results,

    search,

    statusFilter,

  ])



  const selectedExamData =

    exams.find(

      (exam: ExamItem) =>

        exam.id === selectedExam,

    )



  
  const handleToggleExamPublication = async () => {
    if (!selectedExamData) return

    try {
      if (selectedExamData.is_published) {
        await unpublishExam.mutateAsync(selectedExamData.id)
        setSuccessMessage('Examination unpublished successfully.')
      } else {
        await publishExam.mutateAsync(selectedExamData.id)
        setSuccessMessage('Examination published successfully.')
      }

      setFormError('')
    } catch (error: unknown) {
      console.error('Examination publication update failed:', error)
      setFormError(
        selectedExamData.is_published
          ? 'Failed to unpublish examination.'
          : 'Failed to publish examination.',
      )
    }
  }
const availableCourses = useMemo(() => {

    if (!form.exam) {

      return courses

    }



    const exam =

      exams.find(

        (item: ExamItem) =>

          item.id === form.exam,

      )



    if (!exam) {

      return courses

    }



    return courses.filter(

      (course: Course) =>

        course.semester === exam.semester,

    )

  }, [

    courses,

    exams,

    form.exam,

  ])



  const resetForm = () => {

    setForm(emptyForm)

    setEditingResult(null)

    setFormError('')

  }



  const openCreateModal = () => {

    resetForm()



    if (selectedExam) {

      setForm(

        (current: ResultForm) => ({

          ...current,

          exam: selectedExam,

        }),

      )

    }



    setShowModal(true)

  }



  const openEditModal = (

    result: ResultItem,

  ) => {

    setEditingResult(result)



    setForm({

      student: result.student,

      exam: result.exam,

      course: result.course,

      marks: Number(result.marks) || 0,

      grade: result.grade || '',

      grade_point:

        result.grade_point === null

          ? null

          : Number(result.grade_point),

      status: result.status,

      remarks: result.remarks || '',

    })



    setFormError('')

    setShowModal(true)

  }



  const closeModal = () => {

    if (

      createResult.isPending ||

      updateResult.isPending

    ) {

      return

    }



    setShowModal(false)

    resetForm()

  }



  const handleFormChange = (

    field: keyof ResultForm,

    value: string | number | null,

  ) => {

    setForm(

      (current: ResultForm) => ({

        ...current,

        [field]: value,

      }),

    )



    setFormError('')

    setSuccessMessage('')

  }



  const handleSave = async () => {

    setFormError('')

    setSuccessMessage('')



    if (!form.student) {

      setFormError(

        'Please select a student.',

      )

      return

    }



    if (!form.exam) {

      setFormError(

        'Please select an examination.',

      )

      return

    }



    if (!form.course) {

      setFormError(

        'Please select a course.',

      )

      return

    }



    if (

      form.marks < 0

    ) {

      setFormError(

        'Marks cannot be negative.',

      )

      return

    }



    const selectedExamForValidation =

      exams.find(

        (exam: ExamItem) =>

          exam.id === form.exam,

      )



    if (

      selectedExamForValidation &&

      form.marks >

        selectedExamForValidation.max_marks

    ) {

      setFormError(

        `Marks cannot exceed ${selectedExamForValidation.max_marks}.`,

      )

      return

    }



    try {

      if (editingResult) {

        await updateResult.mutateAsync({

          id: editingResult.id,

          data: {

            student: form.student,

            exam: form.exam,

            course: form.course,

            marks: form.marks,

            grade: form.grade.trim(),

            grade_point:

              form.grade_point,

            status: form.status,

            remarks:

              form.remarks.trim(),

          },

        })



        setSuccessMessage(

          'Result updated successfully.',

        )

      } else {

        await createResult.mutateAsync({

          student: form.student,

          exam: form.exam,

          course: form.course,

          marks: form.marks,

          grade: form.grade.trim(),

          grade_point:

            form.grade_point,

          status: form.status,

          remarks:

            form.remarks.trim(),

        })



        setSuccessMessage(

          'Result created successfully.',

        )

      }



      setShowModal(false)

      resetForm()

    } catch (error: unknown) {

      console.error(

        'Result save failed:',

        error,

      )



      setFormError(

        'Unable to save the result. Please check the entered data and try again.',

      )

    }

  }



  const handleDelete = async (

    result: ResultItem,

  ) => {

    const confirmed =

      window.confirm(

        'Are you sure you want to delete this result?',

      )



    if (!confirmed) {

      return

    }



    try {

      await deleteResult.mutateAsync(

        result.id,

      )



      setSuccessMessage(

        'Result deleted successfully.',

      )

    } catch (error: unknown) {

      console.error(

        'Result deletion failed:',

        error,

      )



      setFormError(

        'Unable to delete the result.',

      )

    }

  }



  const isLoading =

    examsQuery.isLoading ||

    resultsQuery.isLoading ||

    studentsQuery.isLoading ||

    coursesQuery.isLoading



  const hasError =

    examsQuery.isError ||

    resultsQuery.isError ||

    studentsQuery.isError ||

    coursesQuery.isError



  return (

    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">

        {/* Header */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">

                  ✓

                </div>



                <div>

                  <h1 className="text-2xl font-bold text-slate-900">

                    Examination Results

                  </h1>



                  <p className="mt-1 text-sm text-slate-500">

                    Create, update and manage student examination results.

                  </p>

                </div>

              </div>

            </div>



            <button

              type="button"

              onClick={openCreateModal}

              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"

            >

              + Add Result

            </button>

          </div>

        </section>



        {/* Messages */}

        {successMessage && (

          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">

            {successMessage}

          </div>

        )}



        {formError && !showModal && (

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

            {formError}

          </div>

        )}



        {/* Filters */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="grid gap-4 lg:grid-cols-3">

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">

                Examination

              </label>



              <select

                value={selectedExam ?? ''}

                onChange={(

                  event: React.ChangeEvent<HTMLSelectElement>,

                ) => {

                  const value =

                    event.target.value



                  setSelectedExam(

                    value

                      ? Number(value)

                      : undefined,

                  )



                  setSuccessMessage('')

                  setFormError('')

                }}

                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

              >

                <option value="">

                  All examinations

                </option>



                {exams.map(

                  (exam: ExamItem) => (

                    <option

                      key={exam.id}

                      value={exam.id}

                    >

                      {exam.name} — Semester{' '}

                      {exam.semester_number}

                    </option>

                  ),

                )}

              </select>

            </div>



            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">

                Search

              </label>



              <input

                type="search"

                value={search}

                onChange={(

                  event: React.ChangeEvent<HTMLInputElement>,

                ) =>

                  setSearch(

                    event.target.value,

                  )

                }

                placeholder="Student ID, name or course..."

                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

              />

            </div>



            <div>

              <label className="mb-2 block text-sm font-medium text-slate-700">

                Result Status

              </label>



              <select

                value={statusFilter}

                onChange={(

                  event: React.ChangeEvent<HTMLSelectElement>,

                ) =>

                  setStatusFilter(

                    event.target

                      .value as ResultStatus | '',

                  )

                }

                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

              >

                <option value="">

                  All statuses

                </option>



                {resultStatuses.map(

                  (status: ResultStatus) => (

                    <option

                      key={status}

                      value={status}

                    >

                      {status}

                    </option>

                  ),

                )}

              </select>

            </div>

          </div>

        </section>



        {/* Selected exam information */}
{selectedExamData && (
  <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid flex-1 gap-4 md:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
            Examination
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {selectedExamData.name}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
            Type
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {selectedExamData.exam_type}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
            Semester
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            Semester {selectedExamData.semester_number}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
            Publication
          </p>

          <p
            className={`mt-1 font-semibold ${
              selectedExamData.is_published
                ? 'text-green-700'
                : 'text-amber-700'
            }`}
          >
            {selectedExamData.is_published
              ? 'Published'
              : 'Not Published'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          void handleToggleExamPublication()
        }
        disabled={
          publishExam.isPending ||
          unpublishExam.isPending
        }
        className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
          selectedExamData.is_published
            ? 'bg-amber-600 hover:bg-amber-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {publishExam.isPending ||
        unpublishExam.isPending
          ? 'Processing...'
          : selectedExamData.is_published
            ? 'Unpublish Examination'
            : 'Publish Examination'}
      </button>
    </div>
  </section>
)}
        

        {/* Loading */}

        {isLoading && (

          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />



            <p className="mt-4 font-medium text-slate-700">

              Loading examination data...

            </p>

          </section>

        )}



        {/* Error */}

        {!isLoading && hasError && (

          <section className="rounded-2xl border border-red-200 bg-red-50 p-6">

            <h2 className="font-semibold text-red-800">

              Unable to load examination data

            </h2>



            <p className="mt-2 text-sm text-red-700">

              Please verify that the examination API is available and that your account has permission to access it.

            </p>

          </section>

        )}



        {/* Results table */}

        {!isLoading && !hasError && (

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <h2 className="font-semibold text-slate-900">

                  Result Records

                </h2>



                <p className="mt-1 text-xs text-slate-500">

                  {filteredResults.length} result

                  {filteredResults.length === 1

                    ? ''

                    : 's'}

                </p>

              </div>

            </div>



            {filteredResults.length === 0 ? (

              <div className="p-12 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">

                  📄

                </div>



                <h3 className="mt-4 font-semibold text-slate-900">

                  No results found

                </h3>



                <p className="mt-1 text-sm text-slate-500">

                  Select an examination or add a new result.

                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="min-w-full text-left text-sm">

                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">

                    <tr>

                      <th className="px-5 py-3">

                        Student

                      </th>



                      <th className="px-5 py-3">

                        Examination

                      </th>



                      <th className="px-5 py-3">

                        Course

                      </th>



                      <th className="px-5 py-3">

                        Marks

                      </th>



                      <th className="px-5 py-3">

                        Grade

                      </th>



                      <th className="px-5 py-3">

                        Grade Point

                      </th>



                      <th className="px-5 py-3">

                        Status

                      </th>



                      <th className="px-5 py-3 text-right">

                        Actions

                      </th>

                    </tr>

                  </thead>



                  <tbody className="divide-y divide-slate-100">

                    {filteredResults.map(

                      (result: ResultItem) => (

                        <tr

                          key={result.id}

                          className="hover:bg-slate-50"

                        >

                          <td className="px-5 py-4">

                            <div className="font-medium text-slate-900">

                              {result.student_id ||

                                `Student #${result.student}`}

                            </div>



                            {result.student_name && (

                              <div className="mt-0.5 text-xs text-slate-500">

                                {result.student_name}

                              </div>

                            )}

                          </td>



                          <td className="px-5 py-4">

                            <div className="font-medium text-slate-900">

                              {result.exam_name ||

                                `Exam #${result.exam}`}

                            </div>



                            {result.exam_type && (

                              <div className="mt-0.5 text-xs text-slate-500">

                                {result.exam_type}

                              </div>

                            )}

                          </td>



                          <td className="px-5 py-4">

                            <div className="font-medium text-slate-900">

                              {result.course_code ||

                                `Course #${result.course}`}

                            </div>



                            {result.course_name && (

                              <div className="mt-0.5 text-xs text-slate-500">

                                {result.course_name}

                              </div>

                            )}

                          </td>



                          <td className="px-5 py-4 font-semibold text-slate-900">

                            {result.marks}

                          </td>



                          <td className="px-5 py-4 font-semibold text-slate-900">

                            {result.grade || '—'}

                          </td>



                          <td className="px-5 py-4">

                            {result.grade_point ??

                              '—'}

                          </td>



                          <td className="px-5 py-4">

                            <span

                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${

                                result.status ===

                                'PASS'

                                  ? 'bg-green-100 text-green-700'

                                  : result.status ===

                                      'FAIL'

                                    ? 'bg-red-100 text-red-700'

                                    : result.status ===

                                        'ABSENT'

                                      ? 'bg-amber-100 text-amber-700'

                                      : 'bg-slate-100 text-slate-700'

                              }`}

                            >

                              {result.status}

                            </span>

                          </td>



                          <td className="px-5 py-4">

                            <div className="flex justify-end gap-2">

                              <button

                                type="button"

                                onClick={() =>

                                  openEditModal(

                                    result,

                                  )

                                }

                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"

                              >

                                Edit

                              </button>



                              <button

                                type="button"

                                onClick={() =>

                                  void handleDelete(

                                    result,

                                  )

                                }

                                disabled={

                                  deleteResult.isPending

                                }

                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"

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

      </div>



      {/* Result modal */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-900">

                  {editingResult

                    ? 'Edit Result'

                    : 'Add Result'}

                </h2>



                <p className="mt-1 text-xs text-slate-500">

                  Enter the student's examination result.

                </p>

              </div>



              <button

                type="button"

                onClick={closeModal}

                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"

              >

                ×

              </button>

            </div>



            <div className="space-y-5 p-6">

              {formError && (

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                  {formError}

                </div>

              )}



              {/* Student */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">

                  Student

                </label>



                <select

                  value={

                    form.student || ''

                  }

                  onChange={(

                    event: React.ChangeEvent<HTMLSelectElement>,

                  ) =>

                    handleFormChange(

                      'student',

                      event.target.value

                        ? Number(

                            event.target.value,

                          )

                        : 0,

                    )

                  }

                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                >

                  <option value="">

                    Select student

                  </option>



                  {students.map(

                    (

                      student: Student,

                    ) => (

                      <option

                        key={student.id}

                        value={student.id}

                      >

                        {getStudentDisplayName(

                          student,

                        )}

                      </option>

                    ),

                  )}

                </select>

              </div>



              {/* Examination */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">

                  Examination

                </label>



                <select

                  value={

                    form.exam || ''

                  }

                  onChange={(

                    event: React.ChangeEvent<HTMLSelectElement>,

                  ) =>

                    handleFormChange(

                      'exam',

                      event.target.value

                        ? Number(

                            event.target.value,

                          )

                        : 0,

                    )

                  }

                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                >

                  <option value="">

                    Select examination

                  </option>



                  {exams.map(

                    (

                      exam: ExamItem,

                    ) => (

                      <option

                        key={exam.id}

                        value={exam.id}

                      >

                        {exam.name} — Semester{' '}

                        {exam.semester_number}

                      </option>

                    ),

                  )}

                </select>

              </div>



              {/* Course */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">

                  Course

                </label>



                <select

                  value={

                    form.course || ''

                  }

                  onChange={(

                    event: React.ChangeEvent<HTMLSelectElement>,

                  ) =>

                    handleFormChange(

                      'course',

                      event.target.value

                        ? Number(

                            event.target.value,

                          )

                        : 0,

                    )

                  }

                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                >

                  <option value="">

                    Select course

                  </option>



                  {availableCourses.map(

                    (

                      course: Course,

                    ) => (

                      <option

                        key={course.id}

                        value={course.id}

                      >

                        {course.code} —{' '}

                        {course.name}

                      </option>

                    ),

                  )}

                </select>

              </div>



              <div className="grid gap-5 md:grid-cols-2">

                {/* Marks */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">

                    Marks

                  </label>



                  <input

                    type="number"

                    min={0}

                    max={

                      exams.find(

                        (

                          exam: ExamItem,

                        ) =>

                          exam.id ===

                          form.exam,

                      )?.max_marks

                    }

                    value={form.marks}

                    onChange={(

                      event: React.ChangeEvent<HTMLInputElement>,

                    ) =>

                      handleFormChange(

                        'marks',

                        Number(

                          event.target.value,

                        ),

                      )

                    }

                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                  />

                </div>



                {/* Grade */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">

                    Grade

                  </label>



                  <input

                    type="text"

                    value={form.grade}

                    onChange={(

                      event: React.ChangeEvent<HTMLInputElement>,

                    ) =>

                      handleFormChange(

                        'grade',

                        event.target.value.toUpperCase(),

                      )

                    }

                    placeholder="Example: A"

                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                  />

                </div>



                {/* Grade point */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">

                    Grade Point

                  </label>



                  <input

                    type="number"

                    min={0}

                    max={10}

                    step={0.01}

                    value={

                      form.grade_point ?? ''

                    }

                    onChange={(

                      event: React.ChangeEvent<HTMLInputElement>,

                    ) => {

                      const value =

                        event.target.value



                      handleFormChange(

                        'grade_point',

                        value === ''

                          ? null

                          : Number(value),

                      )

                    }}

                    placeholder="0–10"

                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                  />

                </div>



                {/* Status */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700">

                    Status

                  </label>



                  <select

                    value={form.status}

                    onChange={(

                      event: React.ChangeEvent<HTMLSelectElement>,

                    ) =>

                      handleFormChange(

                        'status',

                        event.target

                          .value as ResultStatus,

                      )

                    }

                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                  >

                    {resultStatuses.map(

                      (

                        status: ResultStatus,

                      ) => (

                        <option

                          key={status}

                          value={status}

                        >

                          {status}

                        </option>

                      ),

                    )}

                  </select>

                </div>

              </div>



              {/* Remarks */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">

                  Remarks

                </label>



                <textarea

                  value={form.remarks}

                  onChange={(

                    event: React.ChangeEvent<HTMLTextAreaElement>,

                  ) =>

                    handleFormChange(

                      'remarks',

                      event.target.value,

                    )

                  }

                  rows={3}

                  placeholder="Optional remarks..."

                  className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                />

              </div>

            </div>



            {/* Modal actions */}

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

              <button

                type="button"

                onClick={closeModal}

                disabled={

                  createResult.isPending ||

                  updateResult.isPending

                }

                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"

              >

                Cancel

              </button>



              <button

                type="button"

                onClick={() =>

                  void handleSave()

                }

                disabled={

                  createResult.isPending ||

                  updateResult.isPending

                }

                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"

              >

                {createResult.isPending ||

                updateResult.isPending

                  ? 'Saving...'

                  : editingResult

                    ? 'Update Result'

                    : 'Save Result'}

              </button>

            </div>

          </div>

        </div>

      )}

    </main>

  )

}