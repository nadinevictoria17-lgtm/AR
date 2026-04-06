import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  query,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { StudentRecord, TeacherQuiz, TeacherLesson, QuizAttempt, QuizUnlockCode, SubjectKey } from '../types'
import { generateUnlockCode } from './unlockCodeGenerator'

/**
 * Firestore-based storage layer
 * Collections:
 * - /students/{studentId}
 * - /quizzes/{quizId}
 * - /lessons/{lessonId}
 * - /quizUnlockCodes/{codeId}
 * - /students/{studentId}/quizAttempts/{attemptId}
 */

export const storage = {
  // ── STUDENTS ────────────────────────────────
  async getAll() {
    try {
      const [studentsSnap, quizzesSnap, lessonsSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'quizzes')),
        getDocs(collection(db, 'lessons')),
      ])

      const students = studentsSnap.docs.map((doc) => doc.data() as StudentRecord)
      const quizzes = quizzesSnap.docs.map((doc) => doc.data() as TeacherQuiz)
      const lessons = lessonsSnap.docs.map((doc) => doc.data() as TeacherLesson)

      return { students, quizzes, lessons }
    } catch (error) {
      console.error('[Storage] getAll() failed:', error)
      return { students: [], quizzes: [], lessons: [] }
    }
  },

  async saveStudent(student: StudentRecord) {
    try {
      await setDoc(doc(db, 'students', student.studentId), student)
      return true
    } catch (error) {
      console.error('[Storage] saveStudent() failed:', error)
      return false
    }
  },

  async deleteStudent(id: string) {
    try {
      const docRef = doc(db, 'students', id)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error('[Storage] deleteStudent() failed:', error)
      return false
    }
  },

  // ── QUIZZES ─────────────────────────────────
  async saveQuiz(quiz: TeacherQuiz) {
    try {
      await setDoc(doc(db, 'quizzes', quiz.id), quiz)
      return true
    } catch (error) {
      console.error('[Storage] saveQuiz() failed:', error)
      return false
    }
  },

  async deleteQuiz(id: string) {
    try {
      await deleteDoc(doc(db, 'quizzes', id))
      return true
    } catch (error) {
      console.error('[Storage] deleteQuiz() failed:', error)
      return false
    }
  },

  // ── LESSONS ─────────────────────────────────
  async saveLesson(lesson: TeacherLesson) {
    try {
      await setDoc(doc(db, 'lessons', lesson.id), lesson)
      return true
    } catch (error) {
      console.error('[Storage] saveLesson() failed:', error)
      return false
    }
  },

  async deleteLesson(id: string) {
    try {
      await deleteDoc(doc(db, 'lessons', id))
      return true
    } catch (error) {
      console.error('[Storage] deleteLesson() failed:', error)
      return false
    }
  },

  // ── STUDENT SCORES & PROGRESS ───────────────
  async saveStudentScore(studentId: string, subject: SubjectKey, score: number) {
    try {
      const studentRef = doc(db, 'students', studentId)
      await updateDoc(studentRef, {
        [`scores.${subject}`]: score,
      })
      return true
    } catch (error) {
      console.error('[Storage] saveStudentScore() failed:', error)
      return false
    }
  },

  async saveStudentLessonCompletion(studentId: string, lessonId: string) {
    try {
      const studentRef = doc(db, 'students', studentId)
      await updateDoc(studentRef, {
        completedLessonIds: arrayUnion(lessonId),
      })
      return true
    } catch (error) {
      console.error('[Storage] saveStudentLessonCompletion() failed:', error)
      return false
    }
  },

  async saveStudentLabCompletion(studentId: string, experimentId: string) {
    try {
      const studentRef = doc(db, 'students', studentId)
      await updateDoc(studentRef, {
        completedLabExperimentIds: arrayUnion(experimentId),
      })
      return true
    } catch (error) {
      console.error('[Storage] saveStudentLabCompletion() failed:', error)
      return false
    }
  },

  async saveStudentQuizCompletion(studentId: string, quizId: string) {
    try {
      const studentRef = doc(db, 'students', studentId)
      await updateDoc(studentRef, {
        completedQuizIds: arrayUnion(quizId),
      })
      return true
    } catch (error) {
      console.error('[Storage] saveStudentQuizCompletion() failed:', error)
      return false
    }
  },

  async ensureStudentRecord(studentId: string) {
    try {
      const normalized = studentId.trim()
      if (!normalized) return false

      const docRef = doc(db, 'students', normalized)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        // Migration: Ensure new arrays exist
        if (!data.unlockedLessonIds || !data.unlockedQuizIds) {
          await updateDoc(docRef, {
            unlockedLessonIds: data.unlockedLessonIds || [],
            unlockedQuizIds: data.unlockedQuizIds || [],
          })
        }
        return true
      }

      // Create new student record
      const newStudent: StudentRecord = {
        id: `student-${normalized}`,
        name: `Student ${normalized}`,
        studentId: normalized,
        grade: '7',
        section: 'A',
        scores: {
          biology: null,
          chemistry: null,
        },
        completedLessonIds: [],
        completedLabExperimentIds: [],
        completedQuizIds: [],
        unlockedLessonIds: [],
        unlockedQuizIds: [],
        quizAttempts: [],
      }

      await setDoc(docRef, newStudent)
      return true
    } catch (error) {
      console.error('[Storage] ensureStudentRecord() failed:', error)
      return false
    }
  },

  // ── QUIZ ATTEMPTS ────────────────────────────
  async saveQuizAttempt(attempt: QuizAttempt) {
    try {
      const studentRef = doc(db, 'students', attempt.studentId)
      const attemptsRef = collection(studentRef, 'quizAttempts')

      // Save attempt to subcollection
      await setDoc(doc(attemptsRef, attempt.id), attempt)

      // Also update parent student's quizAttempts array (for compatibility)
      await updateDoc(studentRef, {
        quizAttempts: arrayUnion(attempt),
      })

      return true
    } catch (error) {
      console.error('[Storage] saveQuizAttempt() failed:', error)
      return false
    }
  },

  async canStudentTakeQuiz(studentId: string, quizId: string): Promise<boolean> {
    try {
      const studentRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(studentRef)

      if (!docSnap.exists()) return true

      const student = docSnap.data() as StudentRecord
      if (!student.quizAttempts) return true

      const quizAttempts = student.quizAttempts.filter((a) => a.quizId === quizId)
      if (quizAttempts.length === 0) return true

      const lastAttempt = quizAttempts.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]

      return !lastAttempt.locked
    } catch (error) {
      console.error('[Storage] canStudentTakeQuiz() failed:', error)
      return true
    }
  },

  async getQuizAttempts(studentId: string, quizId: string): Promise<QuizAttempt[]> {
    try {
      const studentRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(studentRef)

      if (!docSnap.exists()) return []

      const student = docSnap.data() as StudentRecord
      if (!student.quizAttempts) return []

      return student.quizAttempts
        .filter((a) => a.quizId === quizId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error('[Storage] getQuizAttempts() failed:', error)
      return []
    }
  },

  async getBestQuizScore(studentId: string, quizId: string): Promise<number | null> {
    try {
      const attempts = await storage.getQuizAttempts(studentId, quizId)
      return attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null
    } catch (error) {
      console.error('[Storage] getBestQuizScore() failed:', error)
      return null
    }
  },

  async unlockQuizForRetake(studentId: string, quizId: string): Promise<string | null> {
    try {
      const studentRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(studentRef)

      if (!docSnap.exists()) return null

      const student = docSnap.data() as StudentRecord
      if (!student.quizAttempts) return null

      // Find the latest attempt for this quiz
      const quizAttempts = student.quizAttempts.filter((a) => a.quizId === quizId)
      const latestAttempt = quizAttempts.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]

      if (!latestAttempt) return null

      // Mark as unlocked
      latestAttempt.locked = false

      // Update attempts array
      const updatedAttempts = student.quizAttempts.map((a) =>
        a.id === latestAttempt.id ? latestAttempt : a
      )

      await updateDoc(studentRef, {
        quizAttempts: updatedAttempts,
      })

      // Generate and store unlock code
      const unlockCodeData = generateUnlockCode(quizId, studentId)
      const codeRef = doc(db, 'quizUnlockCodes', unlockCodeData.id)
      await setDoc(codeRef, {
        id: unlockCodeData.id,
        quizId,
        studentId,
        code: unlockCodeData.code,
        generatedAt: new Date().toISOString(),
        expiresAt: unlockCodeData.expiresAt,
        isUsed: false,
      })

      return unlockCodeData.code
    } catch (error) {
      console.error('[Storage] unlockQuizForRetake() failed:', error)
      return null
    }
  },

  async applyQuizUnlockCode(studentId: string, quizId: string, code: string): Promise<boolean> {
    try {
      // Find the unlock code in Firestore
      const codesSnap = await getDocs(
        query(
          collection(db, 'quizUnlockCodes'),
          where('code', '==', code.toUpperCase()),
          where('studentId', '==', studentId),
          where('quizId', '==', quizId)
        )
      )

      if (codesSnap.empty) return false

      const unlockCodeDoc = codesSnap.docs[0]
      const unlockCode = unlockCodeDoc.data() as QuizUnlockCode

      // Reject already-used codes
      if (unlockCode.isUsed) return false

      // Check expiration
      if (unlockCode.expiresAt && new Date(unlockCode.expiresAt) < new Date()) {
        return false
      }

      // Mark code as used
      await updateDoc(unlockCodeDoc.ref, {
        isUsed: true,
        usedAt: new Date().toISOString(),
      })

      // Unlock the student's latest attempt for this quiz so
      // validateQuizEligibility allows the retake
      const studentRef = doc(db, 'students', studentId)
      const studentSnap = await getDoc(studentRef)
      if (studentSnap.exists()) {
        const studentData = studentSnap.data() as StudentRecord
        const attempts: QuizAttempt[] = studentData.quizAttempts ?? []
        const sorted = [...attempts]
          .filter((a) => a.quizId === quizId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        const latest = sorted[0]
        if (latest?.locked) {
          const updated = attempts.map((a) =>
            a.id === latest.id ? { ...a, locked: false } : a
          )
          await updateDoc(studentRef, { quizAttempts: updated })
        }
      }

      return true
    } catch (error) {
      console.error('[Storage] applyQuizUnlockCode() failed:', error)
      return false
    }
  },

  async isLessonUnlocked(studentId: string, lessonId: string, isDefault: boolean): Promise<boolean> {
    if (isDefault) return true
    try {
      const studentRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(studentRef)
      if (!docSnap.exists()) return false
      const student = docSnap.data() as StudentRecord
      return student.unlockedLessonIds?.includes(lessonId) || false
    } catch {
      return false
    }
  },

  async getUnlockedLessons(studentId: string): Promise<string[]> {
    try {
      const studentRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(studentRef)
      if (!docSnap.exists()) return []
      const student = docSnap.data() as StudentRecord
      return student.unlockedLessonIds || []
    } catch {
      return []
    }
  },

  async isQuizUnlocked(studentId: string, quizId: string): Promise<boolean> {
    try {
      const studentRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(studentRef)
      if (!docSnap.exists()) return false
      const student = docSnap.data() as StudentRecord
      return student.unlockedQuizIds?.includes(quizId) || false
    } catch {
      return false
    }
  },

  async unlockContent(studentId: string, targetId: string, type: 'lesson' | 'quiz'): Promise<boolean> {
    try {
      const studentRef = doc(db, 'students', studentId)
      const field = type === 'lesson' ? 'unlockedLessonIds' : 'unlockedQuizIds'
      await updateDoc(studentRef, {
        [field]: arrayUnion(targetId),
      })
      return true
    } catch (error) {
      console.error('[Storage] unlockContent() failed:', error)
      return false
    }
  },

  /**
   * Comprehensive quiz unlock validation
   * Checks if a student can take a quiz based on current state
   * Returns validation result with reasons
   */
  async validateQuizEligibility(studentId: string, quizId: string): Promise<{
    canTake: boolean
    isLocked: boolean
    reason?: string
    attemptCount: number
  }> {
    try {
      const studentRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(studentRef)

      if (!docSnap.exists()) {
        return { canTake: false, isLocked: true, reason: 'Student record not found', attemptCount: 0 }
      }

      const student = docSnap.data() as StudentRecord

      // Check quiz attempts
      const quizAttempts = (student.quizAttempts || [])
        .filter((a) => a.quizId === quizId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // If no attempts, student can take quiz
      if (quizAttempts.length === 0) {
        return {
          canTake: true,
          isLocked: false,
          attemptCount: 0,
        }
      }

      // Check if latest attempt is locked
      const latestAttempt = quizAttempts[0]
      if (latestAttempt.locked) {
        return {
          canTake: false,
          isLocked: true,
          reason: 'Quiz locked after first attempt. Use unlock code to retake.',
          attemptCount: quizAttempts.length,
        }
      }

      // Latest attempt is unlocked, student can retake
      return {
        canTake: true,
        isLocked: false,
        attemptCount: quizAttempts.length,
      }
    } catch (error) {
      console.error('[Storage] validateQuizEligibility() failed:', error)
      return { canTake: false, isLocked: true, reason: 'Validation error', attemptCount: 0 }
    }
  },
}
