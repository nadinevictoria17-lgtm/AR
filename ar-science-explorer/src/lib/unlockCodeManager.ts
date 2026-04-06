import { db } from './firebase'
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, getDocs, arrayUnion } from 'firebase/firestore'
import type { SubjectKey } from '../types'

export interface UnlockCodeData {
  code: string;
  type: 'subject' | 'lesson' | 'quiz';
  subjects?: SubjectKey[];       // If type is 'subject'
  lessonIds?: string[];          // Specific lesson IDs to unlock (subject code with week picker)
  targetId?: string;             // If type is 'lesson' or 'quiz'
  targetStudentId?: string;      // Optional: restrict code to specific student (quiz retake only)
  createdAt: string;
  isUsed?: boolean;              // True once a quiz-retake code has been applied
  usedByStudentIds?: string[];   // Students who have applied a lesson unlock code
}

/**
 * Look up an unlock code and return its full data from Firestore
 */
export async function getUnlockCodeData(code: string): Promise<UnlockCodeData | null> {
  const upperCode = code.trim().toUpperCase()

  try {
    const docRef = doc(db, 'unlockCodes', upperCode)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        code:               docSnap.id,
        type:               data.type || 'subject',
        subjects:           data.subjects,
        lessonIds:          data.lessonIds,
        targetId:           data.targetId,
        targetStudentId:    data.targetStudentId,
        createdAt:          data.createdAt,
        isUsed:             data.isUsed ?? false,
        usedByStudentIds:   data.usedByStudentIds ?? [],
      } as UnlockCodeData
    }
    return null
  } catch (err) {
    console.error('Error looking up unlock code:', err)
    return null
  }
}

/**
 * Get all unlock codes (for teacher dashboard)
 */
export async function getAllUnlockCodes(): Promise<UnlockCodeData[]> {
  try {
    const snapshot = await getDocs(collection(db, 'unlockCodes'))
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        code:             doc.id,
        type:             data.type || 'subject',
        subjects:         data.subjects,
        lessonIds:        data.lessonIds,
        targetId:         data.targetId,
        targetStudentId:  data.targetStudentId,
        createdAt:        data.createdAt || new Date().toISOString(),
        isUsed:           data.isUsed ?? false,
        usedByStudentIds: data.usedByStudentIds ?? [],
      } as UnlockCodeData
    })
  } catch (err) {
    console.error('Error fetching unlock codes:', err)
    return []
  }
}

/**
 * Record that a student used this code.
 * For lesson codes: appends studentId to usedByStudentIds (deduped by arrayUnion).
 * For quiz retake codes: also sets isUsed=true (single-use).
 */
export async function trackCodeUsage(
  code: string,
  studentId: string,
  markAsUsed = false
): Promise<void> {
  try {
    const docRef = doc(db, 'unlockCodes', code.trim().toUpperCase())
    const update: Record<string, unknown> = {
      usedByStudentIds: arrayUnion(studentId),
    }
    if (markAsUsed) update.isUsed = true
    await updateDoc(docRef, update)
  } catch (err) {
    console.error('Error tracking code usage:', err)
  }
}

/**
 * Create a new unlock code
 */
export async function createUnlockCode(
  code: string,
  type: 'subject' | 'lesson' | 'quiz',
  config: { subjects?: SubjectKey[]; lessonIds?: string[]; targetId?: string; targetStudentId?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Strip undefined values — Firestore rejects them outright.
    const cleanConfig = Object.fromEntries(
      Object.entries(config).filter(([, v]) => v !== undefined)
    )
    await setDoc(doc(db, 'unlockCodes', code.trim().toUpperCase()), {
      type,
      ...cleanConfig,
      createdAt: new Date().toISOString(),
    })
    return { success: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error creating unlock code:', err)
    return { success: false, error: errorMsg }
  }
}

/**
 * Delete an unlock code
 */
export async function deleteUnlockCode(code: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'unlockCodes', code.trim().toUpperCase()))
    return true
  } catch (err) {
    console.error('Error deleting unlock code:', err)
    return false
  }
}

/**
 * Seed initial unlock codes (one-time setup)
 */
export async function seedInitialUnlockCodes(): Promise<void> {
  const existing = await getUnlockCodeData('SCIGRADE7')
  if (!existing) {
    await createUnlockCode('SCIGRADE7', 'subject', { subjects: ['biology', 'chemistry'] })
  }
}
