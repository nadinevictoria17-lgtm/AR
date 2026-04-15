import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { firebaseOnAuthStateChanged } from './firebaseAuth'
import { auth } from './firebase'

interface FirebaseAuthContextType {
  user: User | null
  isLoading: boolean
  studentId?: string // Extracted from email if student
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | null>(null)

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Dev mode: sign out only on first app load (not on refresh)
    if (import.meta.env.MODE === 'development' && !sessionStorage.getItem('dev-session-started')) {
      sessionStorage.setItem('dev-session-started', 'true')
      auth.signOut().catch(() => {})
    }

    // Subscribe to Firebase auth state changes
    const unsubscribe = firebaseOnAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Extract studentId from email if user is a student
  const studentId = user?.email?.includes('@arscience.school')
    ? user.email.split('@')[0]
    : undefined

  // Memoize context value to prevent all consumers from re-rendering when
  // the provider re-renders for unrelated reasons (e.g. parent state change).
  const value = useMemo(() => ({ user, isLoading, studentId }), [user, isLoading, studentId])

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  )
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext)
  if (!context) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider')
  }
  return context
}
