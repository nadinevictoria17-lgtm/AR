import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import type { StudentRecord } from '../types'

interface Subscription {
  record: StudentRecord | null
  isLoading: boolean
  listeners: Set<() => void>
  unsubscribe: () => void
  teardownTimer: ReturnType<typeof setTimeout> | null
}

// One live Firestore listener per studentId, shared across every component
// that calls useStudentRecord with the same id — instead of each screen
// (Quiz/Learn/Progress) opening its own independent onSnapshot connection.
const subscriptions = new Map<string, Subscription>()

// Route navigation unmounts the old screen before mounting the new one, so a
// naive "tear down when listeners hit 0" immediately kills and recreates the
// listener on every screen switch. Keep it alive briefly across that gap.
const TEARDOWN_GRACE_MS = 3000

function getSubscription(studentId: string): Subscription {
  const existing = subscriptions.get(studentId)
  if (existing) return existing

  const listeners = new Set<() => void>()
  const sub: Subscription = {
    record: null,
    isLoading: true,
    listeners,
    unsubscribe: () => {},
    teardownTimer: null,
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
    // A new subscriber showed up (e.g. the next screen after navigation) —
    // cancel any pending teardown from the previous screen's unmount.
    if (s.teardownTimer) {
      clearTimeout(s.teardownTimer)
      s.teardownTimer = null
    }
    const notify = () => forceRender((n) => n + 1)
    s.listeners.add(notify)
    return () => {
      s.listeners.delete(notify)
      // Last subscriber gone — wait briefly before tearing down, since route
      // navigation unmounts the old screen just before mounting the new one.
      if (s.listeners.size === 0) {
        s.teardownTimer = setTimeout(() => {
          if (s.listeners.size === 0) {
            s.unsubscribe()
            subscriptions.delete(studentId)
          }
        }, TEARDOWN_GRACE_MS)
      }
    }
  }, [studentId])

  return {
    student: sub?.record ?? null,
    isLoading: studentId ? (sub?.isLoading ?? true) : false,
  }
}
