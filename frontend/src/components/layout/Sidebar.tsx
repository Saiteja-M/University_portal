import { NavLink } from 'react-router-dom'
import { useCurrentUser } from '../../features/auth/useCurrentUser'

interface NavItem {
  label: string
  path: string
  icon: string
}

const facultyItems: NavItem[] = [
  { label: 'Dashboard', path: '/faculty/dashboard', icon: '⌂' },
  { label: 'My Courses', path: '/faculty/courses', icon: '▣' },
  { label: 'My Students', path: '/faculty/students', icon: '♙' },
  { label: 'Attendance', path: '/faculty/attendance', icon: '✓' },
  { label: 'Timetable', path: '/faculty/timetable', icon: '▦' },
  { label: 'Assignments', path: '/faculty/assignments', icon: '✓' },
  { label: 'Exams', path: '/faculty/exams', icon: '▤' },
  { label: 'Results', path: '/faculty/results', icon: '▥' },
  { label: 'Notifications', path: '/faculty/notifications', icon: '●' },
  { label: 'My Profile', path: '/faculty/profile', icon: '◉' },
]

const adminItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '⌂' },
  { label: 'Academics', path: '/academics', icon: '▣' },
  { label: 'Courses', path: '/academics/courses', icon: '▤' },
  { label: 'Timetable', path: '/student/timetable', icon: '▦' },
  { label: 'Assignments', path: '/academics/assignments', icon: '✓' },
  { label: 'Students', path: '/students', icon: '♙' },
  { label: 'Faculty', path: '/faculty', icon: '◉' },
  { label: 'Examinations', path: '/examinations', icon: '📝' },
]

const studentItems: NavItem[] = [
  { label: 'Dashboard', path: '/student/dashboard', icon: '⌂' },
  { label: 'My Profile', path: '/student/profile', icon: '◉' },
  { label: 'My Courses', path: '/student/courses', icon: '▣' },
  { label: 'Attendance', path: '/student/attendance', icon: '✓' },
  { label: 'Assignments', path: '/student/assignments', icon: '✓' },
  { label: 'Timetable', path: '/academics/timetable', icon: '▦' },
  { label: 'Examinations', path: '/student/results', icon: '📝' },
]

const hodItems: NavItem[] = [
  { label: 'Dashboard', path: '/faculty/dashboard', icon: '⌂' },
  { label: 'Academics', path: '/academics', icon: '▣' },
  { label: 'Courses', path: '/academics/courses', icon: '▤' },
  { label: 'Students', path: '/students', icon: '♙' },
  { label: 'Faculty', path: '/faculty', icon: '◉' },
  { label: 'Attendance', path: '/faculty/attendance', icon: '✓' },
  { label: 'Examinations', path: '/examinations', icon: '📝' },
]

export function Sidebar() {
  const { data: user, isLoading } = useCurrentUser()

  const roles = user?.roles ?? []

  // Use explicit role checks instead of assuming every non-faculty user is admin.
  const isAdmin = roles.includes('ADMIN')
  const isHod = roles.includes('HOD')
  const isFaculty = roles.includes('FACULTY')
  const isStudent = roles.includes('STUDENT')

  const items = isAdmin
    ? adminItems
    : isHod
      ? hodItems
      : isFaculty
        ? facultyItems
        : isStudent
          ? studentItems
          : []

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-slate-950 text-white lg:flex">
      {/* Brand */}
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold shadow-lg">
            U
          </div>

          <div>
            <h1 className="text-base font-bold tracking-wide">
              University Portal
            </h1>

            <p className="text-xs text-slate-400">
              Academic Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Main Menu
        </p>

        <div className="space-y-1">
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-slate-400">
              Loading menu...
            </p>
          ) : items.length > 0 ? (
            items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/faculty' || item.path === '/students'}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 items-center justify-center text-base"
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </NavLink>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-slate-400">
              No menu available for this account.
            </p>
          )}
        </div>
      </nav>

      {/* User information */}
      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-xs text-slate-400">Signed in as</p>

          <p className="mt-1 truncate text-sm font-semibold">
            {user?.username ?? 'User'}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {roles.length > 0 ? roles.join(', ') : 'Role unavailable'}
          </p>
        </div>
      </div>
    </aside>
  )
}
