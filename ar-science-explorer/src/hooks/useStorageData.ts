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

interface StorageSubscription {
  data: StorageData
  isLoading: boolean
  error: Error | null
  ready: { quizzes: boolean; lessons: boolean; students: boolean }
  listeners: Set<() => void>
  unsubscribers: Array<() => void>
  teardownTimer: ReturnType<typeof setTimeout> | null
}

// Route navigation unmounts the previous screen before mounting the next, so
// a naive "close listeners on unmount" thrashes the Firestore subscriptions
// (and briefly resets data to empty) on every tab/screen switch.
const TEARDOWN_GRACE_MS = 3000

// Keyed by whether students are included, since that changes which listeners open.
const storageSubscriptions = new Map<boolean, StorageSubscription>()

function getStorageSubscription(fetchStudents: boolean): StorageSubscription {
  const existing = storageSubscriptions.get(fetchStudents)
  if (existing) return existing

  const sub: StorageSubscription = {
    data: initialData,
    isLoading: true,
    error: null,
    ready: { quizzes: false, lessons: false, students: !fetchStudents },
    listeners: new Set(),
    unsubscribers: [],
    teardownTimer: null,
  }

  const notifyAll = () => sub.listeners.forEach((notify) => notify())

  function checkAllReady() {
    if (sub.ready.quizzes && sub.ready.lessons && sub.ready.students) {
      sub.isLoading = false
    }
  }

  function handleError(err: Error) {
    sub.error = err
    sub.isLoading = false
    notifyAll()
  }

  try {
    if (fetchStudents) {
      sub.unsubscribers.push(onSnapshot(
        collection(db, 'students'),
        (snapshot) => {
          const students = snapshot.docs.map((doc) =>
            mapStudentDoc(doc.data() as Record<string, unknown>, doc.id)
          )
          sub.data = { ...sub.data, students }
          if (!sub.ready.students) { sub.ready.students = true; checkAllReady() }
          notifyAll()
        },
        handleError
      ))
    }

    sub.unsubscribers.push(onSnapshot(
      collection(db, 'quizzes'),
      (snapshot) => {
        const quizzes = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as TeacherQuiz[]
        sub.data = { ...sub.data, quizzes }
        if (!sub.ready.quizzes) { sub.ready.quizzes = true; checkAllReady() }
        notifyAll()
      },
      handleError
    ))

    sub.unsubscribers.push(onSnapshot(
      collection(db, 'lessons'),
      (snapshot) => {
        const lessons = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as TeacherLesson[]
        sub.data = { ...sub.data, lessons }
        if (!sub.ready.lessons) { sub.ready.lessons = true; checkAllReady() }
        notifyAll()
      },
      handleError
    ))
  } catch (err) {
    sub.error = err instanceof Error ? err : new Error('Unknown error')
    sub.isLoading = false
  }

  storageSubscriptions.set(fetchStudents, sub)
  return sub
}

export function useStorageData(fetchStudents = false) {
  const [, forceRender] = useState(0)
  const sub = getStorageSubscription(fetchStudents)

  useEffect(() => {
    const s = getStorageSubscription(fetchStudents)
    if (s.teardownTimer) {
      clearTimeout(s.teardownTimer)
      s.teardownTimer = null
    }
    const notify = () => forceRender((n) => n + 1)
    s.listeners.add(notify)
    return () => {
      s.listeners.delete(notify)
      if (s.listeners.size === 0) {
        s.teardownTimer = setTimeout(() => {
          if (s.listeners.size === 0) {
            s.unsubscribers.forEach((unsub) => unsub())
            storageSubscriptions.delete(fetchStudents)
          }
        }, TEARDOWN_GRACE_MS)
      }
    }
  }, [fetchStudents])

  return { data: sub.data, isLoading: sub.isLoading, error: sub.error }
}
