import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { RoleRoute } from './RoleRoute'
import { PortalHomePage } from '../../features/auth/PortalHomePage'
import { PortalLoginPage } from '../../features/auth/PortalLoginPage'
import { useCurrentUser } from '../../features/auth/useCurrentUser'
import { AppShell } from '../../components/layout/AppShell'
import { useHealth } from '../../hooks/useHealth'
import AcademicsDashboardPage from '../../features/academics/pages/AcademicsDashboardPage'
import DepartmentsPage from '../../features/academics/pages/DepartmentsPage'
import ProgramsPage from '../../features/academics/pages/ProgramsPage'
import RegulationsPage from '../../features/academics/pages/RegulationsPage'
import AcademicYearsPage from '../../features/academics/pages/AcademicYearsPage'
import SemestersPage from '../../features/academics/pages/SemestersPage'
import CoursesPage from '../../features/academics/pages/CoursesPage'
import CourseCreatePage from '../../features/academics/pages/CourseCreatePage'
import CourseOfferingsPage from '../../features/academics/pages/CourseOfferingsPage'
import FacultyPage from '../../features/faculty/pages/FacultyPage'
import FacultyCreatePage from '../../features/faculty/pages/FacultyCreatePage'
import FacultyDashboardPage from '../../features/faculty/pages/FacultyDashboardPage'
import FacultyAssignmentsPage from '../../features/faculty/pages/FacultyAssignmentsPage'
import FacultyCoursesPage from '../../features/faculty/pages/FacultyCoursesPage'
import FacultyStudentsPage from '../../features/faculty/pages/FacultyStudentsPage'
import FacultyAttendancePage from '../../features/faculty/pages/FacultyAttendancePage'
import FacultyExaminationsPage from '../../features/faculty/pages/FacultyExaminationsPage'
import { StudentsPage } from '../../features/students/StudentsPage'
import { StudentDetailsPage } from '../../features/students/StudentDetailsPage'
import { StudentCreatePage } from '../../features/students/StudentCreatePage'
import { StudentEditPage } from '../../features/students/StudentEditPage'
import StudentProfilePage from '../../features/students/StudentProfilePage'
import StudentAdminProfilePage from '../../features/students/StudentAdminProfilePage'
import StudentCoursessPage from '../../features/students/StudentCoursessPage'
import StudentResultsPage from '../../features/students/StudentResultsPage'
import StudentCourseOfferingsPage from '../../features/students/pages/StudentCourseOfferingsPage'
import { StudentDashboardPage } from '../../features/students/StudentDashboardPage'
import StudentRegisterPage from '../../features/student-auth/pages/StudentRegisterPage'
import StudentOtpPage from '../../features/student-auth/pages/StudentOtpPage'
import MyTimetablePage from '../../features/timetable/pages/MyTimetablePage'
import TimetablePage from '../../features/timetable/pages/TimetablePage'
import AssignmentsPage from '../../features/assignments/pages/AssignmentsPage'
import { ExaminationResultsAdminPage } from '../../features/examinations/pages/ExaminationResultsAdminPage'
import { ExaminationsAdminPage } from '../../features/examinations/pages/ExaminationsAdminPage'
import StudentExaminationsPage from '../../features/examinations/pages/StudentExaminationsPage'
import StudentAttendancePage from '../../features/attendance/pages/FacultyAttendancePage'

function AppLayout() {
  return <div className="min-h-screen bg-gray-50"><Outlet /></div>
}

function AdminDashboardPage() {
  const logout = useAuthStore(state => state.logout)
  const { data: user } = useCurrentUser()
  const healthQuery = useHealth()
  return <div className="min-h-screen bg-gray-50">
    <header className="border-b bg-white shadow-sm"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <div><h1 className="text-2xl font-bold text-gray-900">University Portal</h1><p className="text-sm text-gray-500">Administration Dashboard</p></div>
      <div className="flex items-center gap-4"><div className="text-right"><p className="text-sm font-medium text-gray-900">{user?.username ?? 'Administrator'}</p><p className="text-xs text-gray-500">{user?.email ?? ''}</p></div><button onClick={logout} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100">Logout</button></div>
    </div></header>
    <main className="mx-auto max-w-7xl px-6 py-8"><section className="mb-8"><h2 className="text-3xl font-bold text-gray-900">Administration</h2><p className="mt-2 text-gray-600">Manage university academics, students, faculty, and core operations.</p></section>
      <section className="mb-8 rounded-xl border bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold">System Status</h3><p className="mt-1 text-sm text-gray-500">Backend API health status</p></div><span className="text-sm font-medium">{healthQuery.isLoading ? 'Checking...' : healthQuery.isSuccess ? 'Online' : 'Offline'}</span></div></section>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[['Academics','/academics','Departments, programs, regulations, years and semesters.'],['Courses','/academics/courses','Manage university courses and curriculum structure.'],['Students','/students','Manage student records and academic information.'],['Faculty','/faculty','Manage faculty members and teaching assignments.']].map(([title,path,description])=><a key={path} href={path} className="rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm text-gray-600">{description}</p></a>)}</div>
    </main>
  </div>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute allowedRoles={['ADMIN']} fallbackPath="/">{children}</RoleRoute>
}
function AcademicRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute allowedRoles={['ADMIN','HOD']}>{children}</RoleRoute>
}
function FacultyRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute allowedRoles={['FACULTY']}>{children}</RoleRoute>
}
function StudentRoute({ children }: { children: React.ReactNode }) {
  return <RoleRoute allowedRoles={['STUDENT']} fallbackPath="/">{children}</RoleRoute>
}

export const router = createBrowserRouter([
  { path: '/', element: <AppLayout />, children: [
    { index: true, element: <PortalHomePage /> },
    { path: 'admin/login', element: <PortalLoginPage portal="ADMIN" /> },
    { path: 'faculty/login', element: <PortalLoginPage portal="FACULTY" /> },
    { path: 'student/login', element: <PortalLoginPage portal="STUDENT" /> },
    { path: 'admin/dashboard', element: <AdminRoute><AdminDashboardPage /></AdminRoute> },

    { path: 'academics', element: <AcademicRoute><AppShell><AcademicsDashboardPage /></AppShell></AcademicRoute> },
    { path: 'academics/departments', element: <AcademicRoute><AppShell><DepartmentsPage /></AppShell></AcademicRoute> },
    { path: 'academics/programs', element: <AcademicRoute><AppShell><ProgramsPage /></AppShell></AcademicRoute> },
    { path: 'academics/regulations', element: <AcademicRoute><AppShell><RegulationsPage /></AppShell></AcademicRoute> },
    { path: 'academics/academic-years', element: <AcademicRoute><AppShell><AcademicYearsPage /></AppShell></AcademicRoute> },
    { path: 'academics/semesters', element: <AcademicRoute><AppShell><SemestersPage /></AppShell></AcademicRoute> },
    { path: 'academics/courses', element: <AcademicRoute><AppShell><CoursesPage /></AppShell></AcademicRoute> },
    { path: 'academics/courses/new', element: <AdminRoute><AppShell><CourseCreatePage /></AppShell></AdminRoute> },
    { path: 'academics/course-offerings', element: <AcademicRoute><AppShell><CourseOfferingsPage /></AppShell></AcademicRoute> },
    { path: 'academics/timetable', element: <AcademicRoute><AppShell><TimetablePage /></AppShell></AcademicRoute> },
    { path: 'academics/assignments', element: <AcademicRoute><AppShell><AssignmentsPage /></AppShell></AcademicRoute> },

    { path: 'students', element: <AdminRoute><AppShell><StudentsPage /></AppShell></AdminRoute> },
    { path: 'students/new', element: <AdminRoute><AppShell><StudentCreatePage /></AppShell></AdminRoute> },
    { path: 'students/:id', element: <AdminRoute><AppShell><StudentDetailsPage /></AppShell></AdminRoute> },
    { path: 'students/:id/edit', element: <AdminRoute><AppShell><StudentEditPage /></AppShell></AdminRoute> },
    { path: 'students/:id/profile', element: <AdminRoute><AppShell><StudentAdminProfilePage /></AppShell></AdminRoute> },
    { path: 'students/course-offerings', element: <AdminRoute><AppShell><StudentCourseOfferingsPage /></AppShell></AdminRoute> },

    { path: 'faculty', element: <AdminRoute><AppShell><FacultyPage /></AppShell></AdminRoute> },
    { path: 'faculty/create', element: <AdminRoute><AppShell><FacultyCreatePage /></AppShell></AdminRoute> },
    { path: 'faculty/dashboard', element: <FacultyRoute><AppShell><FacultyDashboardPage /></AppShell></FacultyRoute> },
    { path: 'faculty/courses', element: <FacultyRoute><AppShell><FacultyCoursesPage /></AppShell></FacultyRoute> },
    { path: 'faculty/students', element: <FacultyRoute><AppShell><FacultyStudentsPage /></AppShell></FacultyRoute> },
    { path: 'faculty/attendance', element: <FacultyRoute><AppShell><FacultyAttendancePage /></AppShell></FacultyRoute> },
    { path: 'faculty/assignments', element: <FacultyRoute><AppShell><FacultyAssignmentsPage /></AppShell></FacultyRoute> },
    { path: 'faculty/timetable', element: <FacultyRoute><AppShell><MyTimetablePage role="FACULTY" /></AppShell></FacultyRoute> },
    { path: 'faculty/exams', element: <FacultyRoute><AppShell><FacultyExaminationsPage /></AppShell></FacultyRoute> },
    { path: 'faculty/results', element: <Navigate to="/faculty/exams" replace /> },

    { path: 'student/register', element: <StudentRegisterPage /> },
    { path: 'student/register/otp', element: <StudentOtpPage /> },
    { path: 'student/dashboard', element: <StudentRoute><AppShell><StudentDashboardPage /></AppShell></StudentRoute> },
    { path: 'student/profile', element: <StudentRoute><AppShell><StudentProfilePage /></AppShell></StudentRoute> },
    { path: 'student/courses', element: <StudentRoute><AppShell><StudentCoursessPage /></AppShell></StudentRoute> },
    { path: 'student/attendance', element: <StudentRoute><AppShell><StudentAttendancePage /></AppShell></StudentRoute> },
    { path: 'student/timetable', element: <StudentRoute><AppShell><MyTimetablePage role="STUDENT" /></AppShell></StudentRoute> },
    { path: 'student/assignments', element: <StudentRoute><AppShell><AssignmentsPage /></AppShell></StudentRoute> },
    { path: 'student/examinations', element: <StudentRoute><AppShell><StudentExaminationsPage /></AppShell></StudentRoute> },
    { path: 'student/results', element: <StudentRoute><AppShell><StudentResultsPage /></AppShell></StudentRoute> },

    { path: 'examinations', element: <AcademicRoute><AppShell><ExaminationsAdminPage /></AppShell></AcademicRoute> },
    { path: 'examinations/results', element: <AcademicRoute><AppShell><ExaminationResultsAdminPage /></AppShell></AcademicRoute> },

    { path: '*', element: <Navigate to="/" replace /> },
  ]},
])
