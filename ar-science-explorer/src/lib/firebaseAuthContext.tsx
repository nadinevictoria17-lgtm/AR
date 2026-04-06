import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { firebaseOnAuthStateChanged } from './firebaseAuth'

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

  return (
    <FirebaseAuthContext.Provider value={{ user, isLoading, studentId }}>
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
