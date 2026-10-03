import {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useFaculty,
  useFacultyCourseAssignments,
  useCreateFacultyCourseAssignment,
  useDeleteFacultyCourseAssignment,
} from "../hooks/useFaculty";

import type {
  Faculty,
  FacultyCourseAssignment,
} from "../types/faculty.types";

/* =========================================================
   Types
========================================================= */

interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

interface AssignmentFormState {
  faculty: string;
  course: string;
  academic_year: string;
  semester: string;
  section: string;
  assigned_date: string;
  is_active: boolean;
}

/* =========================================================
   Helpers
========================================================= */

function normalizeResults<T>(
  data: T[] | PaginatedResponse<T> | undefined,
): T[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "results" in data &&
    Array.isArray(
      (data as PaginatedResponse<T>).results,
    )
  ) {
    return (data as PaginatedResponse<T>).results;
  }

  return [];
}

/* =========================================================
   Page
========================================================= */

export default function FacultyAssignmentsPage() {
  const navigate = useNavigate();

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [facultyFilter, setFacultyFilter] =
    useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [form, setForm] =
    useState<AssignmentFormState>({
      faculty: "",
      course: "",
      academic_year: "",
      semester: "",
      section: "",
      assigned_date:
        new Date()
          .toISOString()
          .split("T")[0] ?? "",
      is_active: true,
    });

  /* -------------------------------------------------------
     Queries
  ------------------------------------------------------- */

  const facultyQuery = useFaculty({
    status: "ACTIVE",
    is_active: true,
  });

  const assignmentQuery =
    useFacultyCourseAssignments();

  /* -------------------------------------------------------
     Mutations
  ------------------------------------------------------- */

  const createAssignment =
    useCreateFacultyCourseAssignment();

  const deleteAssignment =
    useDeleteFacultyCourseAssignment();

  /* -------------------------------------------------------
     Normalize API responses
  ------------------------------------------------------- */

  const faculty: Faculty[] = useMemo(
    () =>
      normalizeResults<Faculty>(
        facultyQuery.data,
      ),
    [facultyQuery.data],
  );

  const assignments: FacultyCourseAssignment[] =
    useMemo(
      () =>
        normalizeResults<FacultyCourseAssignment>(
          assignmentQuery.data,
        ),
      [assignmentQuery.data],
    );

  /* -------------------------------------------------------
     Filter assignments
  ------------------------------------------------------- */

  const filteredAssignments =
    useMemo<FacultyCourseAssignment[]>(() => {
      const query =
        search.trim().toLowerCase();

      return assignments.filter(
        (
          assignment: FacultyCourseAssignment,
        ) => {
          const facultyName =
            assignment.faculty_name
              ?.toLowerCase() ?? "";

          const employeeId =
            assignment.faculty_employee_id
              ?.toLowerCase() ?? "";

          const courseName =
            assignment.course_name
              ?.toLowerCase() ?? "";

          const courseCode =
            assignment.course_code
              ?.toLowerCase() ?? "";

          const matchesSearch =
            !query ||
            facultyName.includes(query) ||
            employeeId.includes(query) ||
            courseName.includes(query) ||
            courseCode.includes(query);

          const matchesFaculty =
            !facultyFilter ||
            String(assignment.faculty) ===
              facultyFilter;

          const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" &&
              assignment.is_active) ||
            (statusFilter === "INACTIVE" &&
              !assignment.is_active);

          return (
            matchesSearch &&
            matchesFaculty &&
            matchesStatus
          );
        },
      );
    }, [
      assignments,
      search,
      facultyFilter,
      statusFilter,
    ]);

  /* -------------------------------------------------------
     Statistics
  ------------------------------------------------------- */

  const activeAssignments =
    assignments.filter(
      (
        assignment: FacultyCourseAssignment,
      ) => assignment.is_active,
    ).length;

  const inactiveAssignments =
    assignments.filter(
      (
        assignment: FacultyCourseAssignment,
      ) => !assignment.is_active,
    ).length;

  /* -------------------------------------------------------
     Form handlers
  ------------------------------------------------------- */

  const updateForm = (
    field: keyof AssignmentFormState,
    value: string | boolean,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !form.faculty ||
      !form.course ||
      !form.academic_year ||
      !form.semester ||
      !form.assigned_date
    ) {
      return;
    }

    await createAssignment.mutateAsync({
      faculty: Number(form.faculty),
      course: Number(form.course),
      academic_year:
        Number(form.academic_year),
      semester: Number(form.semester),
      section: form.section,
      assigned_date:
        form.assigned_date,
      is_active: form.is_active,
    });

    setForm({
      faculty: "",
      course: "",
      academic_year: "",
      semester: "",
      section: "",
      assigned_date:
        new Date()
          .toISOString()
          .split("T")[0] ?? "",
      is_active: true,
    });

    setShowCreateForm(false);
  };

  const handleDelete = async (
    assignment: FacultyCourseAssignment,
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this course assignment?",
      );

    if (!confirmed) {
      return;
    }

    await deleteAssignment.mutateAsync(
      assignment.id,
    );
  };

  /* -------------------------------------------------------
     Loading state
  ------------------------------------------------------- */

  if (
    facultyQuery.isLoading ||
    assignmentQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-sm text-gray-600">
            Loading faculty assignments...
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     Error state
  ------------------------------------------------------- */

  if (
    facultyQuery.isError ||
    assignmentQuery.isError
  ) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-800">
            Unable to load faculty assignments
          </h2>

          <p className="mt-2 text-sm text-red-700">
            Please refresh the page and try again.
          </p>

          <button
            type="button"
            onClick={() => {
              void facultyQuery.refetch();
              void assignmentQuery.refetch();
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===================================================
          Header
      =================================================== */}

      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link
                  to="/faculty"
                  className="hover:text-blue-600"
                >
                  Faculty
                </Link>

                <span>/</span>

                <span>Course Assignments</span>
              </div>

              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                Faculty Course Assignments
              </h1>

              <p className="mt-1 text-sm text-gray-600">
                Manage faculty teaching assignments,
                courses, semesters, and sections.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate("/faculty")
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Faculty
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowCreateForm(
                    (previous) => !previous,
                  )
                }
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                {showCreateForm
                  ? "Close Form"
                  : "New Assignment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* =================================================
            Statistics
        ================================================= */}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Assignments
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {assignments.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Active Assignments
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {activeAssignments}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Inactive Assignments
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-500">
              {inactiveAssignments}
            </p>
          </div>
        </div>

        {/* =================================================
            Create Assignment
        ================================================= */}

        {showCreateForm && (
          <section className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Create Course Assignment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Assign a faculty member to a course,
                academic year, and semester.
              </p>
            </div>

            <form
              onSubmit={handleCreate}
              className="grid gap-5 p-6 md:grid-cols-2"
            >
              {/* Faculty */}

              <div>
                <label
                  htmlFor="faculty"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Faculty
                </label>

                <select
                  id="faculty"
                  value={form.faculty}
                  onChange={(event) =>
                    updateForm(
                      "faculty",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="">
                    Select faculty
                  </option>

                  {faculty.map(
                    (
                      member: Faculty,
                    ) => (
                      <option
                        key={member.id}
                        value={member.id}
                      >
                        {member.employee_id} —{" "}
                        {member.profile
                          ? `${member.profile.first_name} ${member.profile.last_name}`
                          : member.faculty_id}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Course */}

              <div>
                <label
                  htmlFor="course"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Course ID
                </label>

                <input
                  id="course"
                  type="number"
                  min="1"
                  value={form.course}
                  onChange={(event) =>
                    updateForm(
                      "course",
                      event.target.value,
                    )
                  }
                  placeholder="Enter course ID"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Academic Year */}

              <div>
                <label
                  htmlFor="academic_year"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Academic Year ID
                </label>

                <input
                  id="academic_year"
                  type="number"
                  min="1"
                  value={form.academic_year}
                  onChange={(event) =>
                    updateForm(
                      "academic_year",
                      event.target.value,
                    )
                  }
                  placeholder="Enter academic year ID"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Semester */}

              <div>
                <label
                  htmlFor="semester"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Semester ID
                </label>

                <input
                  id="semester"
                  type="number"
                  min="1"
                  value={form.semester}
                  onChange={(event) =>
                    updateForm(
                      "semester",
                      event.target.value,
                    )
                  }
                  placeholder="Enter semester ID"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Section */}

              <div>
                <label
                  htmlFor="section"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Section
                </label>

                <input
                  id="section"
                  type="text"
                  value={form.section}
                  onChange={(event) =>
                    updateForm(
                      "section",
                      event.target.value,
                    )
                  }
                  placeholder="Example: AIML-J"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Assigned Date */}

              <div>
                <label
                  htmlFor="assigned_date"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Assigned Date
                </label>

                <input
                  id="assigned_date"
                  type="date"
                  value={form.assigned_date}
                  onChange={(event) =>
                    updateForm(
                      "assigned_date",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {/* Active */}

              <div className="flex items-center gap-3 md:col-span-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateForm(
                      "is_active",
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />

                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-gray-700"
                >
                  Assignment is active
                </label>
              </div>

              {/* Submit */}

              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateForm(false)
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    createAssignment.isPending
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createAssignment.isPending
                    ? "Creating..."
                    : "Create Assignment"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* =================================================
            Filters
        ================================================= */}

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}

            <div>
              <label
                htmlFor="assignment-search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Search
              </label>

              <input
                id="assignment-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Faculty, employee ID, course..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Faculty */}

            <div>
              <label
                htmlFor="faculty-filter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Faculty
              </label>

              <select
                id="faculty-filter"
                value={facultyFilter}
                onChange={(event) =>
                  setFacultyFilter(
                    event.target.value,
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Faculty
                </option>

                {faculty.map(
                  (
                    member: Faculty,
                  ) => (
                    <option
                      key={member.id}
                      value={member.id}
                    >
                      {member.employee_id}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Status */}

            <div>
              <label
                htmlFor="status-filter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "ALL"
                      | "ACTIVE"
                      | "INACTIVE",
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">
                  All
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* =================================================
            Assignment Table
        ================================================= */}

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Course Assignments
              </h2>

              <p className="text-sm text-gray-500">
                Showing{" "}
                {filteredAssignments.length}{" "}
                assignment
                {filteredAssignments.length !==
                1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>

          {filteredAssignments.length ===
          0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <span className="text-xl">
                  📚
                </span>
              </div>

              <h3 className="text-base font-semibold text-gray-900">
                No assignments found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your filters or
                create a new assignment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Faculty
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Course
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Academic Year
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Semester
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Section
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Assigned
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
                  {filteredAssignments.map(
                    (
                      assignment: FacultyCourseAssignment,
                    ) => (
                      <tr
                        key={assignment.id}
                        className="hover:bg-gray-50"
                      >
                        {/* Faculty */}

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.faculty_name ||
                              assignment.faculty_employee_id ||
                              `Faculty #${assignment.faculty}`}
                          </div>

                          {assignment.faculty_employee_id && (
                            <div className="text-xs text-gray-500">
                              {
                                assignment.faculty_employee_id
                              }
                            </div>
                          )}
                        </td>

                        {/* Course */}

                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.course_name ||
                              "Unnamed Course"}
                          </div>

                          <div className="text-xs text-gray-500">
                            {assignment.course_code ||
                              `Course #${assignment.course}`}
                          </div>
                        </td>

                        {/* Academic Year */}

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {assignment.academic_year}
                        </td>

                        {/* Semester */}

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {assignment.semester}
                        </td>

                        {/* Section */}

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {assignment.section ||
                            "—"}
                        </td>

                        {/* Assigned Date */}

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                          {assignment.assigned_date}
                        </td>

                        {/* Status */}

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={
                              assignment.is_active
                                ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                                : "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                            }
                          >
                            {assignment.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                assignment,
                              )
                            }
                            disabled={
                              deleteAssignment.isPending
                            }
                            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}