
import { Link, useLocation } from 'react-router-dom'

const moduleDetails: Record<
  string,
  { title: string; description: string; icon: string }
> = {
  '/faculty/timetable': {
    title: 'My Timetable',
    description: 'View your teaching schedule and class timings.',
    icon: '▦',
  },
  '/faculty/exams': {
    title: 'Examinations',
    description: 'Access examination-related faculty activities.',
    icon: '▤',
  },
  '/faculty/results': {
    title: 'Results',
    description: 'Access student assessment and result activities.',
    icon: '▥',
  },
  '/faculty/notifications': {
    title: 'Notifications',
    description: 'View faculty announcements and notifications.',
    icon: '●',
  },
  '/faculty/profile': {
    title: 'My Profile',
    description: 'Faculty profile and account information.',
    icon: '◉',
  },
}

export default function FacultyModulePage() {
  const location = useLocation()
  const module = moduleDetails[location.pathname]

  if (!module) {
    return (
      <section className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Page not found
        </h1>
        <p className="mt-2 text-slate-600">
          The requested faculty page does not exist.
        </p>
        <Link
          to="/faculty/dashboard"
          className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">
          Faculty Portal
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          {module.title}
        </h1>
        <p className="mt-2 text-slate-600">
          {module.description}
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl text-blue-700">
          {module.icon}
        </div>

        <h2 className="mt-5 text-lg font-semibold text-slate-900">
          Module connection required
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          This page is now connected to the application router.
          To display real information and support actions, connect
          it to the appropriate backend API and implement the
          module-specific functionality. No sample records are
          being shown as real data.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/faculty/dashboard"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Faculty Dashboard
          </Link>

          <Link
            to="/faculty/assignments"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Course Assignments
          </Link>

          <Link
            to="/faculty/attendance"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Attendance
          </Link>
        </div>
      </section>
    </div>
  )
}
