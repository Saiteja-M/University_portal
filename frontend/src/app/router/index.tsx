import StudentCourseOfferingsPage from '../../features/students/pages/StudentCourseOfferingsPage'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from 'react-router-dom'

// ---------------------------------------------------------
// Authentication
// ---------------------------------------------------------

import { useAuthStore } from '../store/authStore'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'

import { PortalHomePage } from '../../features/auth/PortalHomePage'
import { PortalLoginPage } from '../../features/auth/PortalLoginPage'
import { useCurrentUser } from '../../features/auth/useCurrentUser'

// ---------------------------------------------------------
// Layout
// ---------------------------------------------------------

import { AppShell } from '../../components/layout/AppShell'

// ---------------------------------------------------------
// Admin / General Dashboard
// ---------------------------------------------------------

import { useHealth } from '../../hooks/useHealth'

// ---------------------------------------------------------
// Faculty
// ---------------------------------------------------------

import FacultyDashboardPage from '../../features/faculty/pages/FacultyDashboardPage'
import FacultyAssignmentsPage from '../../features/faculty/pages/FacultyAssignmentsPage'
import FacultyAttendancePage from '../../features/attendance/pages/FacultyAttendancePage'
import FacultyCreatePage from '../../features/faculty/pages/FacultyCreatePage'

// ---------------------------------------------------------
// Academics
// ---------------------------------------------------------

import AcademicsDashboardPage from '../../features/academics/pages/AcademicsDashboardPage'
import DepartmentsPage from '../../features/academics/pages/DepartmentsPage'
import ProgramsPage from '../../features/academics/pages/ProgramsPage'
import RegulationsPage from '../../features/academics/pages/RegulationsPage'
import AcademicYearsPage from '../../features/academics/pages/AcademicYearsPage'
import SemestersPage from '../../features/academics/pages/SemestersPage'
import CoursesPage from '../../features/academics/pages/CoursesPage'
import CourseCreatePage from '../../features/academics/pages/CourseCreatePage'
import CourseOfferingsPage from '../../features/academics/pages/CourseOfferingsPage'
import TimetablePage from '../../features/timetable/pages/TimetablePage'

// ---------------------------------------------------------
// Students
// ---------------------------------------------------------

import { StudentsPage } from '../../features/students/StudentsPage'
import { StudentDetailsPage } from '../../features/students/StudentDetailsPage'
import StudentCoursesPage from '../../features/students/StudentCoursesPage'
import { StudentCreatePage } from '../../features/students/StudentCreatePage'
import { StudentEditPage } from '../../features/students/StudentEditPage'
import StudentProfilePage from '../../features/students/StudentProfilePage'
import FacultyPage from '../../features/faculty/pages/FacultyPage'
import FacultyModulePage from '../../features/faculty/pages/FacultyModulePage'

import StudentAdminProfilePage from '../../features/students/StudentAdminProfilePage'

import { StudentDashboardPage } from '../../features/students/StudentDashboardPage'
import StudentRegisterPage from '../../features/student-auth/pages/StudentRegisterPage'
import StudentOtpPage from '../../features/student-auth/pages/StudentOtpPage'
import StudentCoursessPage from '../../features/students/StudentCoursessPage'
import StudentResultsPage from '../../features/students/StudentResultsPage'
import StudentAttendancePage from '../../features/attendance/pages/FacultyAttendancePage'
import { ExaminationResultsAdminPage } from '../../features/examinations/pages/ExaminationResultsAdminPage'
import { ExaminationsAdminPage } from '../../features/examinations/pages/ExaminationsAdminPage'// =========================================================
// APPLICATION LAYOUT
// =========================================================

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  )
}

// =========================================================
// ADMIN DASHBOARD
// =========================================================

function AdminDashboardPage() {
  const logout = useAuthStore(
    (state) => state.logout,
  )

  const { data: user } = useCurrentUser()
  const healthQuery = useHealth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              University Portal
            </h1>

            <p className="text-sm text-gray-500">
              Administration Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.username ?? 'Administrator'}
              </p>

              <p className="text-xs text-gray-500">
                {user?.email ?? ''}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Administration
          </h2>

          <p className="mt-2 text-gray-600">
            Manage university academics, students, faculty,
            and core operations.
          </p>
        </section>

        {/* System Status */}
        <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                System Status
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Backend API health status
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  healthQuery.isSuccess
                    ? 'bg-green-500'
                    : healthQuery.isLoading
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />

              <span className="text-sm font-medium text-gray-700">
                {healthQuery.isLoading
                  ? 'Checking...'
                  : healthQuery.isSuccess
                    ? 'Online'
                    : 'Offline'}
              </span>
            </div>
          </div>
        </section>

        {/* Administration Modules */}
        <section>
          <h3 className="mb-4 text-xl font-semibold text-gray-900">
            Management Modules
          </h3>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Academics */}
            <a
              href="/academics"
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                Academics
              </h4>

              <p className="mt-2 text-sm text-gray-600">
                Manage departments, programs, academic years,
                semesters, regulations, and academic structure.
              </p>
            </a>

            {/* Courses */}
            <a
              href="/academics/courses"
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                Courses
              </h4>

              <p className="mt-2 text-sm text-gray-600">
                Manage courses, credits, semesters, programs,
                and regulations.
              </p>
            </a>

            {/* Students */}
            <a
              href="/students"
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                Students
              </h4>

              <p className="mt-2 text-sm text-gray-600">
                Manage student records, profiles, guardians,
                enrollment, and academic information.
              </p>
            </a>

            {/* Faculty */}
            <a
              href="/faculty/dashboard"
              className="rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                Faculty
              </h4>

              <p className="mt-2 text-sm text-gray-600">
                Manage faculty members, assignments, and
                teaching operations.
              </p>
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}

// =========================================================
// ROUTE HELPERS
// =========================================================

function AdminRoute({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleRoute
      allowedRoles={['ADMIN']}
      fallbackPath="/"
    >
      {children}
    </RoleRoute>
  )
}

function FacultyRoute({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleRoute
      allowedRoles={[
        'FACULTY',
        'HOD',
        'ADMIN',
      ]}
      fallbackPath="/"
    >
      {children}
    </RoleRoute>
  )
}

function StudentRoute({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleRoute
      allowedRoles={['STUDENT']}
      fallbackPath="/"
    >
      {children}
    </RoleRoute>
  )
}

// =========================================================
// ROUTER
// =========================================================

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,

    children: [
      // =====================================================
      // PUBLIC PORTAL
      // =====================================================

      {
        index: true,
        element: <PortalHomePage />,
      },

      // =====================================================
      // AUTHENTICATION
      // =====================================================

      {
        path: 'admin/login',
        element: (
          <PortalLoginPage portal="ADMIN" />
        ),
      },

      {
        path: 'faculty/login',
        element: (
          <PortalLoginPage portal="FACULTY" />
        ),
      },

      {
        path: 'student/login',
        element: (
          <PortalLoginPage portal="STUDENT" />
        ),
      },

      // =====================================================
      // ADMIN
      // =====================================================

      {
        path: 'admin/dashboard',
        element: (
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        ),
      },

      // =====================================================
      // FACULTY
      // =====================================================

      {
        path: 'faculty',
        element: (
          <Navigate
            to="/faculty/dashboard"
            replace
          />
        ),
      },

      {
        path: 'faculty/dashboard',
        element: (
          <FacultyRoute>
            <AppShell>
              <FacultyDashboardPage />
            </AppShell>
          </FacultyRoute>
        ),
      },

      {
        path: 'faculty/assignments',
        element: (
          <FacultyRoute>
            <AppShell>
              <FacultyAssignmentsPage />
            </AppShell>
          </FacultyRoute>
        ),
      },

      {
        path: 'faculty/attendance',
        element: (
          <FacultyRoute>
            <AppShell>
              <FacultyAttendancePage />
            </AppShell>
          </FacultyRoute>
        ),
      },

      // =====================================================
      // ACADEMICS
      // =====================================================

      {
        path: 'academics',
        element: (
          <ProtectedRoute>
            <AcademicsDashboardPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'academics/departments',
        element: (
          <ProtectedRoute>
            <DepartmentsPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'academics/programs',
        element: (
          <ProtectedRoute>
            <ProgramsPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'academics/regulations',
        element: (
          <ProtectedRoute>
            <RegulationsPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'academics/academic-years',
        element: (
          <ProtectedRoute>
            <AcademicYearsPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'academics/semesters',
        element: (
          <ProtectedRoute>
            <SemestersPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'academics/courses',
        element: (
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'academics/courses/new',
        element: (
          <ProtectedRoute>
            <CourseCreatePage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'students/course-offerings',
        element: (
          <ProtectedRoute>
            <StudentCourseOfferingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'academics/course-offerings',
        element: (
          <ProtectedRoute>
            <CourseOfferingsPage />
          </ProtectedRoute>
        ),
      },

      // =====================================================
      // STUDENT MANAGEMENT
      // =====================================================

      {
        path: 'students',
        element: (
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'students/new',
        element: (
          <ProtectedRoute>
            <StudentCreatePage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'students/:id',
        element: (
          <ProtectedRoute>
            <StudentDetailsPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'students/:id/edit',
        element: (
          <ProtectedRoute>
            <StudentEditPage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'students/:id/profile',
        element: (
          <ProtectedRoute>
            <StudentProfilePage />
          </ProtectedRoute>
        ),
      },

      // =====================================================
      // STUDENT PORTAL
      // =====================================================

      {
        path: 'student/dashboard',
        element: (
          <StudentRoute>
            <StudentDashboardPage />
          </StudentRoute>
        ),
      },
    ],
  },
  {
  path: '/student/register',
  element: <StudentRegisterPage />,
},
{
  path: '/student/register/otp',
  element: <StudentOtpPage />,
},
{
  path: 'student/courses',
  element: (
    <RoleRoute allowedRoles={['STUDENT']}>
      <StudentCoursesPage />
    </RoleRoute>
  ),
},
{
  path: 'student/attendance',
  element: (
    <StudentRoute>
      <StudentAttendancePage />
    </StudentRoute>
  ),
},
{
  path: 'students/:id/profile',
  element: (
    <ProtectedRoute>
      <StudentAdminProfilePage />
    </ProtectedRoute>
  ),
},
{
  path: 'students/:id/profile',
  element: (
    <ProtectedRoute>
      <StudentAdminProfilePage />
    </ProtectedRoute>
  ),
},
{
  path: 'student/profile',
  element: (
    <StudentRoute>
      <StudentProfilePage />
    </StudentRoute>
  ),
},

{
  path: 'student/courses',
  element: (
    <StudentRoute>
      <StudentCoursessPage />
    </StudentRoute>
  ),
},

{
  path: 'student/attendance',
  element: (
    <StudentRoute>
      <StudentAttendancePage />
    </StudentRoute>
  ),
},

{
  path: 'student/results',
  element: (
    <StudentRoute>
      <StudentResultsPage />
    </StudentRoute>
  ),
},

  // =========================================================
  // FALLBACK
  // =========================================================

  {
    path: '*',
    element: (
      <Navigate
        to="/"
        replace
      />
    ),
  },
  {
  path: 'examinations/results',
  element: (
    <RoleRoute allowedRoles={['ADMIN', 'HOD']}>
      <ExaminationResultsAdminPage />
    </RoleRoute>
  ),
},
{
  path: 'examinations',
  element: (
    <ProtectedRoute>
      <ExaminationsAdminPage />
    </ProtectedRoute>
  ),
},
{
  path: 'faculty/create',
  element: (
    <FacultyRoute>
      <AppShell>
        <FacultyCreatePage />
      </AppShell>
    </FacultyRoute>
  ),
},

// =====================================================
// FACULTY ROUTES
// =====================================================

{
  path: 'faculty',
  element: (
    <AdminRoute>
      <AppShell>
        <FacultyPage />
      </AppShell>
    </AdminRoute>
  ),
},

{
  path: 'faculty/dashboard',
  element: (
    <FacultyRoute>
      <AppShell>
        <FacultyDashboardPage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/assignments',
  element: (
    <FacultyRoute>
      <AppShell>
        <FacultyAssignmentsPage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/attendance',
  element: (
    <FacultyRoute>
      <AppShell>
        <FacultyAttendancePage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/courses',
  element: (
    <FacultyRoute>
      <AppShell>
        <CoursesPage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/students',
  element: (
    <FacultyRoute>
      <AppShell>
        <StudentsPage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/timetable',
  element: (
    <FacultyRoute>
      <AppShell>
        <FacultyModulePage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/exams',
  element: (
    <FacultyRoute>
      <AppShell>
        <FacultyModulePage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/results',
  element: (
    <FacultyRoute>
      <AppShell>
        <FacultyModulePage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/notifications',
  element: (
    <FacultyRoute>
      <AppShell>
        <FacultyModulePage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/profile',
  element: (
    <FacultyRoute>
      <AppShell>
        <FacultyModulePage />
      </AppShell>
    </FacultyRoute>
  ),
},

{
  path: 'faculty/create',
  element: (
    <AdminRoute>
      <AppShell>
        <FacultyCreatePage />
      </AppShell>
    </AdminRoute>
  ),
},

])