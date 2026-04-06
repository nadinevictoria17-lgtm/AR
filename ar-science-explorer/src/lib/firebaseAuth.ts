import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from './firebase'

/**
 * Firebase Auth - Student Login
 * Student can enter either:
 * - 6-digit ID (derives email: {studentId}@arscience.school)
 * - Full email address (uses as-is: e.g., 123456@gmail.com)
 * Authenticates with Firebase, auto-creates account on first login
 */
export async function firebaseStudentLogin(
  studentIdOrEmail: string,
  pin: string
): Promise<{ user: User; studentId: string; error?: string } | null> {
  try {
    // Determine if input is email or student ID
    const email = studentIdOrEmail.includes('@')
      ? studentIdOrEmail
      : `${studentIdOrEmail}@arscience.school`

    // Extract student ID (if it's an email, try to get the part before @)
    const studentId = studentIdOrEmail.includes('@')
      ? studentIdOrEmail.split('@')[0]
      : studentIdOrEmail

    console.log(`[Firebase Auth] Attempting student login: ${email} (ID: ${studentId})`)

    // Try to sign in
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pin)
      console.log('[Firebase Auth] ✓ Student signed in:', studentId)
      return {
        user: userCredential.user,
        studentId,
      }
    } catch (signInError: any) {
      // Check for network errors
      if (signInError.code === 'auth/network-request-failed' || signInError.code === 'auth/timeout') {
        console.error('[Firebase Auth] Network error:', signInError.message)
        return null
      }

      console.log(`[Firebase Auth] Sign-in failed (${signInError.code}), checking if account exists...`)

      // If user doesn't exist, try to create account
      if (signInError.code === 'auth/user-not-found') {
        console.log('[Firebase Auth] Account not found, creating new account:', studentId)
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, pin)
          console.log('[Firebase Auth] ✓ Student account created:', studentId)
          return {
            user: userCredential.user,
            studentId,
          }
        } catch (createError: any) {
          // Check for network errors on create
          if (createError.code === 'auth/network-request-failed' || createError.code === 'auth/timeout') {
            console.error('[Firebase Auth] Network error on create:', createError.message)
            return null
          }
          console.error('[Firebase Auth] Failed to create account:', createError.code, createError.message)
          return null
        }
      }

      // If account exists but wrong password
      if (signInError.code === 'auth/wrong-password') {
        console.error('[Firebase Auth] Account exists but password is incorrect')
        return null
      }

      // Other errors
      console.error('[Firebase Auth] Student login failed:', signInError.code, signInError.message)
      return null
    }
  } catch (error: any) {
    console.error('[Firebase Auth] Student login error:', error.code, error.message)
    return null
  }
}

/**
 * Firebase Auth - Teacher Login
 * Teacher enters: email + password
 * Authenticates with Firebase
 */
export async function firebaseTeacherLogin(
  email: string,
  password: string
): Promise<User | null> {
  try {
    console.log(`[Firebase Auth] Attempting teacher login: ${email}`)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log('[Firebase Auth] ✓ Teacher signed in:', email)
    return userCredential.user
  } catch (error: any) {
    // Check for network errors first
    if (error.code === 'auth/network-request-failed' || error.code === 'auth/timeout') {
      console.error('[Firebase Auth] Network error:', error.message)
      return null
    }

    if (error.code === 'auth/user-not-found') {
      console.error('[Firebase Auth] Teacher account not found:', email)
    } else if (error.code === 'auth/wrong-password') {
      console.error('[Firebase Auth] Teacher password is incorrect')
    } else {
      console.error('[Firebase Auth] Teacher login failed:', error.code, error.message)
    }
    return null
  }
}

/**
 * Firebase Auth - Sign Out
 */
export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error: any) {
    console.error('[Firebase Auth] Sign out failed:', error)
  }
}

/**
 * Firebase Auth - Listen to Auth State Changes
 * Returns unsubscribe function
 */
export function firebaseOnAuthStateChanged(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * Get current Firebase user
 */
export function firebaseGetCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * Create a student account (Admin only - for testing)
 * This would normally be done via admin SDK or custom claims
 */
export async function firebaseCreateStudentAccount(
  studentId: string,
  pin: string
): Promise<User | null> {
  try {
    const email = `${studentId}@arscience.school`
    const userCredential = await createUserWithEmailAndPassword(auth, email, pin)
    return userCredential.user
  } catch (error: any) {
    console.warn('[Firebase Auth] Create student failed:', error.code)
    return null
  }
}
