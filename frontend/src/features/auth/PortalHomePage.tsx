import { Link } from 'react-router-dom'

const portals = [
  {
    key: 'admin',
    title: 'Administration',
    subtitle: 'University administration and management',
    description:
      'Manage academics, students, faculty, departments, programs and university operations.',
    path: '/admin/login',
    action: 'Admin Login',
  },
  {
    key: 'faculty',
    title: 'Faculty',
    subtitle: 'Faculty and teaching portal',
    description:
      'Manage courses, attendance, students, timetable, examinations and academic activities.',
    path: '/faculty/login',
    action: 'Faculty Login',
  },
  {
    key: 'student',
    title: 'Student',
    subtitle: 'Student academic portal',
    description:
      'Access your profile, courses, attendance, timetable, examinations and results.',
    path: '/student/login',
    action: 'Student Login',
  },
]

export function PortalHomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-5 inline-flex rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
            University Management Portal
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Welcome to the University Portal
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Select your portal to securely access the university
            management system.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {portals.map((portal) => (
            <Link
              key={portal.key}
              to={portal.path}
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-800"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-lg font-bold text-white">
                {portal.title.charAt(0)}
              </div>

              <h2 className="text-xl font-semibold">
                {portal.title}
              </h2>

              <p className="mt-2 text-sm font-medium text-slate-300">
                {portal.subtitle}
              </p>

              <p className="mt-4 min-h-20 text-sm leading-6 text-slate-400">
                {portal.description}
              </p>

              <div className="mt-7 text-sm font-semibold text-white">
                {portal.action}
                <span className="ml-2 transition group-hover:ml-3">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-slate-500">
          Authorized university users only.
        </p>
      </section>
    </main>
  )
}