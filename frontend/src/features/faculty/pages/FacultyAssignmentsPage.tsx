import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useCreateFacultyCourseAssignment,
  useDeleteFacultyCourseAssignment,
  useFaculty,
  useFacultyCourseAssignments,
} from "../hooks/useFaculty";
import { useCourseOfferings } from "../../academics/hooks/useAcademics";
import type { Faculty, FacultyCourseAssignment } from "../types/faculty";
import type { CourseOffering } from "../../academics/types/academics";

interface PaginatedResponse<T> { results: T[] }
interface AssignmentFormState {
  faculty: string;
  offering: string;
  assigned_date: string;
  is_active: boolean;
}
function normalizeResults<T>(data: T[] | PaginatedResponse<T> | undefined): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

export default function FacultyAssignmentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<AssignmentFormState>({
    faculty: "",
    offering: "",
    assigned_date: new Date().toISOString().split("T")[0] ?? "",
    is_active: true,
  });

  const facultyQuery = useFaculty({ status: "ACTIVE", is_active: true });
  const offeringQuery = useCourseOfferings({ is_active: true });
  const assignmentQuery = useFacultyCourseAssignments();
  const createAssignment = useCreateFacultyCourseAssignment();
  const deleteAssignment = useDeleteFacultyCourseAssignment();

  const faculty = useMemo(() => normalizeResults<Faculty>(facultyQuery.data), [facultyQuery.data]);
  const offerings = useMemo(() => normalizeResults<CourseOffering>(offeringQuery.data), [offeringQuery.data]);
  const assignments = useMemo(() => normalizeResults<FacultyCourseAssignment>(assignmentQuery.data), [assignmentQuery.data]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const matchesSearch =
        !query ||
        assignment.faculty_name?.toLowerCase().includes(query) ||
        assignment.faculty_employee_id?.toLowerCase().includes(query) ||
        assignment.course_name?.toLowerCase().includes(query) ||
        assignment.course_code?.toLowerCase().includes(query) ||
        assignment.section?.toLowerCase().includes(query);
      const matchesFaculty = !facultyFilter || String(assignment.faculty) === facultyFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && assignment.is_active) ||
        (statusFilter === "INACTIVE" && !assignment.is_active);
      return Boolean(matchesSearch && matchesFaculty && matchesStatus);
    });
  }, [assignments, search, facultyFilter, statusFilter]);

  const selectedOffering = offerings.find((offering) => String(offering.id) === form.offering);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.faculty || !form.offering) {
      window.alert("Select both faculty and course offering.");
      return;
    }
    try {
      await createAssignment.mutateAsync({
        faculty: Number(form.faculty),
        offering: Number(form.offering),
        assigned_date: form.assigned_date,
        is_active: form.is_active,
      });
      setForm({
        faculty: "",
        offering: "",
        assigned_date: new Date().toISOString().split("T")[0] ?? "",
        is_active: true,
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error(error);
      window.alert("Unable to create the faculty assignment. Check the API response for validation details.");
    }
  };

  const handleDelete = async (assignment: FacultyCourseAssignment) => {
    if (!window.confirm("Remove " + assignment.faculty_name + " from " + assignment.course_code + " - " + assignment.section + "?")) return;
    try {
      await deleteAssignment.mutateAsync(assignment.id);
    } catch (error) {
      console.error(error);
      window.alert("Unable to delete the faculty assignment.");
    }
  };

  const isLoading = facultyQuery.isLoading || offeringQuery.isLoading || assignmentQuery.isLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 text-sm text-gray-500">
              <Link to="/academics" className="hover:text-blue-600">Academics</Link> / Faculty Assignment
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Faculty Course Assignments</h1>
            <p className="mt-1 text-sm text-gray-600">Assign faculty directly to an existing course offering.</p>
          </div>
          <button type="button" onClick={() => setShowCreateForm((value) => !value)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            {showCreateForm ? "Close Form" : "Assign Faculty"}
          </button>
        </div>

        {showCreateForm && (
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Assign Faculty to Course Offering</h2>
            <p className="mt-1 text-sm text-gray-500">Course, academic year, semester, program, and section now come from the selected offering.</p>
            <form onSubmit={handleCreate} className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="assignment-faculty" className="mb-2 block text-sm font-medium text-gray-700">Faculty</label>
                <select id="assignment-faculty" value={form.faculty}
                  onChange={(event) => setForm((current) => ({ ...current, faculty: event.target.value }))}
                  required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm">
                  <option value="">Select faculty</option>
                  {faculty.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.employee_id} — {member.profile?.full_name || member.faculty_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assignment-offering" className="mb-2 block text-sm font-medium text-gray-700">Course Offering</label>
                <select id="assignment-offering" value={form.offering}
                  onChange={(event) => setForm((current) => ({ ...current, offering: event.target.value }))}
                  required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm">
                  <option value="">Select course offering</option>
                  {offerings.map((offering) => (
                    <option key={offering.id} value={offering.id}>
                      {offering.course_code} — {offering.course_name} — Sem {offering.semester_number} — {offering.section}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOffering && (
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 md:col-span-2">
                  <div className="font-semibold">{selectedOffering.course_code} — {selectedOffering.course_name}</div>
                  <div className="mt-1">
                    {selectedOffering.program_name} · {selectedOffering.academic_year_name} · Semester {selectedOffering.semester_number} · Section {selectedOffering.section} · Capacity {selectedOffering.capacity}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="assignment-date" className="mb-2 block text-sm font-medium text-gray-700">Assigned Date</label>
                <input id="assignment-date" type="date" value={form.assigned_date}
                  onChange={(event) => setForm((current) => ({ ...current, assigned_date: event.target.value }))}
                  required className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
              </div>

              <label className="flex items-center gap-3 pt-8 text-sm font-medium text-gray-700">
                <input type="checkbox" checked={form.is_active}
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300" />
                Assignment is active
              </label>

              <div className="flex justify-end gap-3 md:col-span-2">
                <button type="button" onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={createAssignment.isPending}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                  {createAssignment.isPending ? "Assigning..." : "Assign Faculty"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="assignment-search" className="mb-2 block text-sm font-medium text-gray-700">Search</label>
              <input id="assignment-search" type="search" value={search}
                onChange={(event) => setSearch(event.target.value)} placeholder="Faculty, course, section..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label htmlFor="faculty-filter" className="mb-2 block text-sm font-medium text-gray-700">Faculty</label>
              <select id="faculty-filter" value={facultyFilter} onChange={(event) => setFacultyFilter(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm">
                <option value="">All Faculty</option>
                {faculty.map((member) => <option key={member.id} value={member.id}>{member.employee_id}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status-filter" className="mb-2 block text-sm font-medium text-gray-700">Status</label>
              <select id="status-filter" value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm">
                <option value="ALL">All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Faculty</h2>
            <p className="text-sm text-gray-500">
              {isLoading ? "Loading..." : "Showing " + filteredAssignments.length + " assignment(s)"}
            </p>
          </div>
          {!isLoading && filteredAssignments.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-500">No faculty assignments found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"><tr>
                  {["Faculty", "Course Offering", "Academic Year", "Semester", "Section", "Assigned", "Status", "Actions"].map((heading) => (
                    <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{assignment.faculty_name || assignment.faculty_employee_id}</div>
                        <div className="text-xs text-gray-500">{assignment.faculty_employee_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{assignment.course_code} — {assignment.course_name}</div>
                        <div className="text-xs text-gray-500">{assignment.program_name}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{assignment.academic_year_name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{assignment.semester_number}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{assignment.section || "—"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{assignment.assigned_date}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={assignment.is_active
                          ? "inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700"
                          : "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"}>
                          {assignment.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button type="button" onClick={() => void handleDelete(assignment)}
                          disabled={deleteAssignment.isPending}
                          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
