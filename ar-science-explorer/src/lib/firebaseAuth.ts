import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth, getSecondaryAuth } from './firebase'

/** Narrow an unknown catch value to a FirebaseError code string. */
function firebaseCode(err: unknown): string {
  return err instanceof FirebaseError ? err.code : 'unknown'
}

/**
 * Firebase Auth — Student Login
 * Accepts either a 6-digit student ID (derives `{id}@arscience.school`)
 * or a full email address. Account must be created by teacher first.
 */
export async function firebaseStudentLogin(
  studentIdOrEmail: string,
  pin: string
): Promise<{ user: User; studentId: string } | null> {
  const email = studentIdOrEmail.includes('@')
    ? studentIdOrEmail
    : `${studentIdOrEmail}@arscience.school`

  const studentId = studentIdOrEmail.includes('@')
    ? studentIdOrEmail.split('@')[0]
    : studentIdOrEmail

  // ── Try sign-in (account must exist, created by teacher) ──────────────────
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pin)
    return { user: cred.user, studentId }
  } catch (signInErr: unknown) {
    const code = firebaseCode(signInErr)

    if (code === 'auth/network-request-failed' || code === 'auth/timeout') {
      console.error('[Firebase Auth] Network error during student sign-in')
      return null
    }

    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      console.error('[Firebase Auth] Student account does not exist. Teacher must create it first.')
      return null
    }

    console.error('[Firebase Auth] Student sign-in failed:', code)
    return null
  }
}

/**
 * Firebase Auth — Teacher Login
 */
export async function firebaseTeacherLogin(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  } catch (err: unknown) {
    const code = firebaseCode(err)
    if (code === 'auth/network-request-failed' || code === 'auth/timeout') {
      console.error('[Firebase Auth] Network error during teacher sign-in')
    } else {
      console.error('[Firebase Auth] Teacher sign-in failed:', code)
    }
    return null
  }
}

/**
 * Firebase Auth — Sign Out
 */
export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(auth)
  } catch (err: unknown) {
    console.error('[Firebase Auth] Sign out failed:', firebaseCode(err))
  }
}

/**
 * Listen to Firebase Auth state changes. Returns the unsubscribe function.
 */
export function firebaseOnAuthStateChanged(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback)
}

/** Get the currently signed-in Firebase user synchronously. */
export function firebaseGetCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * Create a student account without disrupting the teacher's current session.
 *
 * `createUserWithEmailAndPassword` always signs in the new user as a side
 * effect.  Using the secondary Firebase app instance means the sign-in lands
 * in an isolated auth state — the primary `auth` (and therefore the teacher
 * session + route guards) is never touched.  We immediately sign out of the
 * secondary instance so it doesn't accumulate stale sessions.
 */
export async function firebaseCreateStudentAccount(
  studentId: string,
  pin: string
): Promise<User | null> {
  try {
    const email = `${studentId}@arscience.school`
    const secondaryAuth = getSecondaryAuth()
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, pin)
    // Sign out of the secondary instance right away — we only needed the UID.
    await signOut(secondaryAuth)
    return cred.user
  } catch (err: unknown) {
    console.warn('[Firebase Auth] Create student account failed:', firebaseCode(err))
    return null
  }
}
