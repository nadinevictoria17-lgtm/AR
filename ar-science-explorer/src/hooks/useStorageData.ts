import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import type { StudentRecord, TeacherQuiz, TeacherLesson, SubjectKey } from '../types'

interface StorageData {
  students: StudentRecord[]
  quizzes: TeacherQuiz[]
  lessons: TeacherLesson[]
}

const initialData: StorageData = {
  students: [],
  quizzes: [],
  lessons: [],
}

export function useStorageData(fetchStudents = false) {
  const [data, setData] = useState<StorageData>(initialData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true
    const unsubscribers: Array<() => void> = []

    try {
      setIsLoading(true)
      setError(null)

      // Subscribe to students collection conditionally
      if (fetchStudents) {
        const unsubStudents = onSnapshot(
          collection(db, 'students'),
          (snapshot) => {
            if (isMounted) {
              const students = snapshot.docs.map((doc) => {
                const data = doc.data() as any
                // Sanitize scores to ensure only valid SubjectKeys are present
                const scores: Record<SubjectKey, number | null> = {
                  biology: data.scores?.biology ?? null,
                  chemistry: data.scores?.chemistry ?? null,
                }
                return { ...data, id: doc.id, scores } as StudentRecord
              })
              setData((prev) => ({ ...prev, students }))
            }
          },
          (err) => {
            if (isMounted) {
              setError(err)
            }
          }
        )
        unsubscribers.push(unsubStudents)
      }

      // Subscribe to quizzes collection
      const unsubQuizzes = onSnapshot(
        collection(db, 'quizzes'),
        (snapshot) => {
          if (isMounted) {
            const quizzes = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as TeacherQuiz[]
            setData((prev) => ({ ...prev, quizzes }))
          }
        },
        (err) => {
          if (isMounted) {
            setError(err)
          }
        }
      )
      unsubscribers.push(unsubQuizzes)

      // Subscribe to lessons collection
      const unsubLessons = onSnapshot(
        collection(db, 'lessons'),
        (snapshot) => {
          if (isMounted) {
            const lessons = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as TeacherLesson[]
            setData((prev) => ({ ...prev, lessons }))
          }
        },
        (err) => {
          if (isMounted) {
            setError(err)
          }
        }
      )
      unsubscribers.push(unsubLessons)

      // Mark loading complete once first batch arrives
      if (isMounted) {
        setIsLoading(false)
      }
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setData(initialData)
        setIsLoading(false)
      }
    }

    // Cleanup: unsubscribe from all listeners
    return () => {
      isMounted = false
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [fetchStudents])

  return { data, isLoading, error }
}
