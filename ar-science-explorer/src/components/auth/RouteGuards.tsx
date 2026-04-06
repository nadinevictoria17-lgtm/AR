import { Navigate, Outlet } from 'react-router-dom'
import { useFirebaseAuth } from '../../lib/firebaseAuthContext'
import { PageSkeleton } from '../ui/skeleton'

/**
 * Student accounts are always created as `{6-digit-id}@arscience.school`.
 * Matching the numeric prefix makes the check unambiguous even if a teacher
 * account happens to use the same domain.
 */
function isStudentEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return /^\d+@arscience\.school$/.test(email)
}

function isTeacherEmail(email: string | null | undefined): boolean {
  return !isStudentEmail(email)
}

/**
 * Wraps routes that require the user to be logged in as a teacher.
 * - While Firebase resolves auth: shows skeleton
 * - Not logged in → /login (replace so back button can't return here)
 * - Logged in as student → /app (wrong role)
 */
export function TeacherRoute() {
  const { user, isLoading } = useFirebaseAuth()

  if (isLoading) return <PageSkeleton />
  if (!user)     return <Navigate to="/login" replace />
  if (isStudentEmail(user.email)) return <Navigate to="/app" replace />

  return <Outlet />
}

/**
 * Wraps routes that require the user to be logged in as a student.
 * - While Firebase resolves auth: shows skeleton
 * - Not logged in → /login (replace)
 * - Logged in as teacher → /teacher (wrong role)
 */
export function StudentRoute() {
  const { user, isLoading } = useFirebaseAuth()

  if (isLoading) return <PageSkeleton />
  if (!user)     return <Navigate to="/login" replace />
  if (isTeacherEmail(user.email)) return <Navigate to="/teacher" replace />

  return <Outlet />
}

/**
 * Wraps the login page — redirects away if already authenticated.
 * - Logged-in teacher → /teacher
 * - Logged-in student → /app
 * - Not logged in → renders the login page normally
 */
export function PublicOnlyRoute() {
  const { user, isLoading } = useFirebaseAuth()

  if (isLoading) return <PageSkeleton />
  if (user) {
    return isTeacherEmail(user.email)
      ? <Navigate to="/teacher" replace />
      : <Navigate to="/app" replace />
  }

  return <Outlet />
}
