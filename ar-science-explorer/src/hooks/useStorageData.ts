import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import type { StudentRecord, TeacherQuiz, TeacherLesson, SubjectKey } from '../types'

interface StorageData {
  students: StudentRecord[]
  quizzes:  TeacherQuiz[]
  lessons:  TeacherLesson[]
}

const initialData: StorageData = { students: [], quizzes: [], lessons: [] }

/** Map a raw Firestore student document to a typed StudentRecord. */
function mapStudentDoc(docData: Record<string, unknown>, id: string): StudentRecord {
  const scores: Record<SubjectKey, number | null> = {
    biology:   (docData.scores as Record<string, number | null> | undefined)?.biology   ?? null,
    chemistry: (docData.scores as Record<string, number | null> | undefined)?.chemistry ?? null,
    physics:   (docData.scores as Record<string, number | null> | undefined)?.physics   ?? null,
  }
  return { ...(docData as Omit<StudentRecord, 'id' | 'scores'>), id, scores } as StudentRecord
}

export function useStorageData(fetchStudents = false) {
  const [data, setData]           = useState<StorageData>(initialData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true
    const unsubscribers: Array<() => void> = []

    // Track which collections have fired their first snapshot
    const ready = { quizzes: false, lessons: false, students: !fetchStudents }

    function checkAllReady() {
      if (ready.quizzes && ready.lessons && ready.students && isMounted) {
        setIsLoading(false)
      }
    }

    function handleError(err: Error) {
      if (!isMounted) return
      setError(err)
      // Always clear loading on error so the UI doesn't hang indefinitely
      setIsLoading(false)
    }

    try {
      setIsLoading(true)
      setError(null)

      if (fetchStudents) {
        const unsubStudents = onSnapshot(
          collection(db, 'students'),
          (snapshot) => {
            if (!isMounted) return
            const students = snapshot.docs.map((doc) =>
              mapStudentDoc(doc.data() as Record<string, unknown>, doc.id)
            )
            setData((prev) => ({ ...prev, students }))
            if (!ready.students) { ready.students = true; checkAllReady() }
          },
          handleError
        )
        unsubscribers.push(unsubStudents)
      }

      const unsubQuizzes = onSnapshot(
        collection(db, 'quizzes'),
        (snapshot) => {
          if (!isMounted) return
          const quizzes = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as TeacherQuiz[]
          setData((prev) => ({ ...prev, quizzes }))
          if (!ready.quizzes) { ready.quizzes = true; checkAllReady() }
        },
        handleError
      )
      unsubscribers.push(unsubQuizzes)

      const unsubLessons = onSnapshot(
        collection(db, 'lessons'),
        (snapshot) => {
          if (!isMounted) return
          const lessons = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as TeacherLesson[]
          setData((prev) => ({ ...prev, lessons }))
          if (!ready.lessons) { ready.lessons = true; checkAllReady() }
        },
        handleError
      )
      unsubscribers.push(unsubLessons)

    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setData(initialData)
        setIsLoading(false)
      }
    }

    return () => {
      isMounted = false
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [fetchStudents])

  return { data, isLoading, error }
}
