import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import type { StudentRecord } from '../types'

interface Subscription {
  record: StudentRecord | null
  isLoading: boolean
  listeners: Set<() => void>
  unsubscribe: () => void
}

// One live Firestore listener per studentId, shared across every component
// that calls useStudentRecord with the same id — instead of each screen
// (Quiz/Learn/Progress) opening its own independent onSnapshot connection.
const subscriptions = new Map<string, Subscription>()

function getSubscription(studentId: string): Subscription {
  const existing = subscriptions.get(studentId)
  if (existing) return existing

  const listeners = new Set<() => void>()
  const sub: Subscription = {
    record: null,
    isLoading: true,
    listeners,
    unsubscribe: () => {},
  }

  sub.unsubscribe = onSnapshot(
    doc(db, 'students', studentId),
    (snap) => {
      sub.record = snap.exists() ? ({ ...(snap.data() as Omit<StudentRecord, 'id'>), id: snap.id } as StudentRecord) : null
      sub.isLoading = false
      listeners.forEach((notify) => notify())
    },
    () => {
      sub.record = null
      sub.isLoading = false
      listeners.forEach((notify) => notify())
    }
  )

  subscriptions.set(studentId, sub)
  return sub
}

/**
 * Live-subscribes to a single student's Firestore document, sharing one
 * underlying listener across every component that requests the same
 * studentId at the same time (ref-counted; the listener tears down once
 * the last subscriber unmounts).
 */
export function useStudentRecord(studentId: string | null | undefined) {
  const [, forceRender] = useState(0)
  const sub = studentId ? getSubscription(studentId) : null

  useEffect(() => {
    if (!studentId) return
    const s = getSubscription(studentId)
    const notify = () => forceRender((n) => n + 1)
    s.listeners.add(notify)
    return () => {
      s.listeners.delete(notify)
      // Last subscriber gone — tear down the Firestore listener and drop the cache entry.
      if (s.listeners.size === 0) {
        s.unsubscribe()
        subscriptions.delete(studentId)
      }
    }
  }, [studentId])

  return {
    student: sub?.record ?? null,
    isLoading: studentId ? (sub?.isLoading ?? true) : false,
  }
}
