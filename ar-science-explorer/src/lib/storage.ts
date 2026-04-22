import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  arrayRemove,
  query,
  where,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, auth, storage as fbStorage } from './firebase'
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

  async archiveStudent(studentId: string) {
    try {
      const docRef = doc(db, 'students', studentId)
      await updateDoc(docRef, { isArchived: true })
      return true
    } catch (error) {
      console.error('[Storage] archiveStudent() failed:', error)
      throw error
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
        const currentUid = auth.currentUser?.uid
        const needsUpdate = !data.unlockedLessonIds || !data.unlockedQuizIds || (currentUid && data.uid !== currentUid)
        
        if (needsUpdate) {
          try {
            await updateDoc(docRef, {
              unlockedLessonIds: data.unlockedLessonIds || [],
              unlockedQuizIds: data.unlockedQuizIds || [],
              ...(currentUid ? { uid: currentUid } : {})
            })
            console.log(`[Storage] Updated student ${normalized} with UID: ${currentUid}`)
          } catch (updateErr) {
            console.error(`[Storage] Failed to update student record with UID. CHECK YOUR SECURITY RULES!`, updateErr)
          }
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
          physics: null,
        },
        completedLessonIds: [],
        completedLabExperimentIds: [],
        completedQuizIds: [],
        unlockedLessonIds: [],
        unlockedQuizIds: [],
        quizAttempts: [],
        uid: auth.currentUser?.uid || undefined,
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

  /**
   * Consolidated method to save all quiz results in one go.
   * This reduces race conditions and ensures data consistency between attempts, scores, and completion status.
   */
  async completeQuiz(attempt: QuizAttempt, subject: SubjectKey): Promise<void> {
    try {
      const authUid = auth.currentUser?.uid
      let studentId = attempt.studentId.trim();
      let studentRef = doc(db, 'students', studentId)
      
      // Safety Check: Verify if document exists at the direct ID path
      const directSnap = await getDoc(studentRef)
      
      if (!directSnap.exists() && authUid) {
        console.warn(`[Storage] Student ${studentId} not found by ID path. Searching by Auth UID...`)
        const q = query(collection(db, 'students'), where('uid', '==', authUid))
        const qSnap = await getDocs(q)
        if (!qSnap.empty) {
          studentId = qSnap.docs[0].id
          studentRef = doc(db, 'students', studentId)
          console.log(`[Storage] Corrected student document ID to: ${studentId}`)
        }
      }

      const attemptsRef = doc(db, 'students', studentId, 'quizAttempts', attempt.id)

      console.log(`[Storage] Processing completeQuiz for ${studentId}, quiz: ${attempt.quizId}, subject: ${subject}`)

      // 1. Prepare updates for main student document
      const updates: any = {
        completedQuizIds: arrayUnion(attempt.quizId),
        unlockedQuizIds: arrayRemove(attempt.quizId), // FORGET the unlock code after use
      }
      
      // Safety: Also include the attempt in the main doc array
      updates.quizAttempts = arrayUnion(attempt);

      if (subject) {
        updates[`scores.${subject}`] = attempt.score;
      }

      if (attempt.quizId.startsWith('builtin-')) {
        const lessonId = attempt.quizId.replace('builtin-', '')
        updates.completedLessonIds = arrayUnion(lessonId)
      }

      // 2. Save main document FIRST
      await updateDoc(studentRef, updates)
      console.log(`[Storage] Student document updated successfully`)

      // 3. Save to subcollection as a backup
      try {
        await setDoc(attemptsRef, attempt)
      } catch (e) {
        console.warn('[Storage] Subcollection save failed (ignoring):', e)
      }

      console.log(`[Storage] Saved quiz results successfully for ${studentId}`)
    } catch (error) {
      console.error('[Storage] completeQuiz() failed with error:', error)
      throw error
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

      // Student record must exist to generate a code
      if (!docSnap.exists()) return null

      const student = docSnap.data() as StudentRecord

      // If there is a previous locked attempt, mark it unlocked so the student
      // doesn't hit the "locked" gate when they start the quiz.
      if (student.quizAttempts?.length) {
        const sorted = [...student.quizAttempts]
          .filter((a) => a.quizId === quizId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        const latestAttempt = sorted[0]
        if (latestAttempt?.locked) {
          const updatedAttempts = student.quizAttempts.map((a) =>
            a.id === latestAttempt.id ? { ...a, locked: false } : a
          )
          await updateDoc(studentRef, { quizAttempts: updatedAttempts })
        }
      }

      // Always generate and persist the unlock code
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

  /**
   * Directly mark the most recent quiz attempt as unlocked so
   * validateQuizEligibility allows the student to retake.
   * Used when an access-code of type 'quiz' is applied.
   */
  async markQuizAsRetakeable(studentId: string, quizId: string): Promise<boolean> {
    try {
      const studentRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(studentRef)
      if (!docSnap.exists()) return true // no record = can freely take quiz

      const student = docSnap.data() as StudentRecord
      const attempts: QuizAttempt[] = student.quizAttempts ?? []

      const sorted = [...attempts]
        .filter(a => a.quizId === quizId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      const latest = sorted[0]

      if (!latest || !latest.locked) return true // nothing to unlock

      const updated = attempts.map(a =>
        a.id === latest.id ? { ...a, locked: false } : a
      )
      await updateDoc(studentRef, { 
        quizAttempts: updated,
        unlockedQuizIds: arrayUnion(quizId)
      })
      return true
    } catch (error) {
      console.error('[Storage] markQuizAsRetakeable() failed:', error)
      return false
    }
  },

  async getQuizRetakeCodes(): Promise<QuizUnlockCode[]> {
    try {
      const snap = await getDocs(collection(db, 'quizUnlockCodes'))
      return snap.docs.map((d) => d.data() as QuizUnlockCode)
    } catch (error) {
      console.error('[Storage] getQuizRetakeCodes() failed:', error)
      return []
    }
  },

  async deleteQuizRetakeCode(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'quizUnlockCodes', id))
      return true
    } catch (error) {
      console.error('[Storage] deleteQuizRetakeCode() failed:', error)
      return false
    }
  },


  async applyQuizUnlockCode(studentId: string, quizId: string, code: string): Promise<boolean> {
    try {
      // Query only by code to avoid requiring a composite Firestore index.
      // Validate studentId + quizId in JavaScript after fetching.
      const codesSnap = await getDocs(
        query(
          collection(db, 'quizUnlockCodes'),
          where('code', '==', code.toUpperCase())
        )
      )

      if (codesSnap.empty) return false

      // Find a doc that matches this student + quiz (a code may be scoped to one student)
      const unlockCodeDoc =
        codesSnap.docs.find((d) => {
          const data = d.data() as QuizUnlockCode
          // Accept codes that match exactly OR codes with no studentId restriction
          const studentMatch = !data.studentId || data.studentId === studentId
          const quizMatch = data.quizId === quizId
          return studentMatch && quizMatch && !data.isUsed
        }) ?? null

      if (!unlockCodeDoc) return false

      const unlockCode = unlockCodeDoc.data() as QuizUnlockCode

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

  async lockContent(studentId: string, targetId: string, type: 'lesson' | 'quiz'): Promise<boolean> {
    try {
      const studentRef = doc(db, 'students', studentId)
      const field = type === 'lesson' ? 'unlockedLessonIds' : 'unlockedQuizIds'
      const docSnap = await getDoc(studentRef)

      if (!docSnap.exists()) return false

      const currentArray = docSnap.data()[field] as string[] || []
      const updated = currentArray.filter(id => id !== targetId)

      await updateDoc(studentRef, {
        [field]: updated,
      })
      return true
    } catch (error) {
      console.error('[Storage] lockContent() failed:', error)
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
      const unlockedQuizIds = new Set(student.unlockedQuizIds ?? [])

      // Check quiz attempts on the parent document first
      let quizAttempts = (student.quizAttempts || []).filter((a) => a.quizId === quizId)

      // FALLBACK: If main doc array is empty, check subcollection for higher persistence
      if (quizAttempts.length === 0) {
        const attemptsSnap = await getDocs(
          query(collection(studentRef, 'quizAttempts'), where('quizId', '==', quizId))
        )
        if (!attemptsSnap.empty) {
          quizAttempts = attemptsSnap.docs.map(d => d.data() as QuizAttempt)
        }
      }

      // Sort by timestamp descending
      quizAttempts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // If no attempts found anywhere, check if quiz is unlocked
      if (quizAttempts.length === 0) {
        if (!unlockedQuizIds.has(quizId)) {
          return {
            canTake: false,
            isLocked: true,
            reason: 'Quiz is locked. Enter an unlock code to take it.',
            attemptCount: 0,
          }
        }
        return {
          canTake: true,
          isLocked: false,
          attemptCount: 0,
        }
      }

      // Check if latest attempt is locked - BE VERY STRICT HERE
      const latestAttempt = quizAttempts[0]
      console.log(`[Eligibility Debug] Latest attempt for ${quizId}:`, latestAttempt?.id, "Locked:", latestAttempt?.locked)
      
      if (latestAttempt && latestAttempt.locked) {
        return {
          canTake: false,
          isLocked: true,
          reason: 'Quiz locked after attempt. Enter an unlock code to retake.',
          attemptCount: quizAttempts.length,
        }
      }

      // If they don't have an attempt but it's not in the unlocked list, it's also locked
      if (quizAttempts.length === 0 && !unlockedQuizIds.has(quizId)) {
         return {
          canTake: false,
          isLocked: true,
          reason: 'Quiz requires an unlock code.',
          attemptCount: 0,
        }
      }

      // Latest attempt is unlocked (from code usage) OR it's a fresh first-time unlock
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

  // ── CLASS MANAGEMENT ─────────────────────────────

  /**
   * Reset all progress fields for a single student (keeps account data).
   */
  async resetStudentProgress(studentDocId: string): Promise<boolean> {
    try {
      const studentRef = doc(db, 'students', studentDocId)
      // Clear quizAttempts subcollection
      const attemptsSnap = await getDocs(collection(studentRef, 'quizAttempts'))
      await Promise.all(attemptsSnap.docs.map(d => deleteDoc(d.ref)))
      // Reset all progress fields on the parent doc
      await updateDoc(studentRef, {
        quizAttempts:             [],
        scores:                   { biology: null, chemistry: null },
        completedLessonIds:       [],
        completedLabExperimentIds:[],
        completedQuizIds:         [],
        unlockedLessonIds:        [],
        unlockedQuizIds:          [],
      })
      return true
    } catch (error) {
      console.error('[Storage] resetStudentProgress() failed:', error)
      return false
    }
  },

  /**
   * Reset progress for all students. Optionally skip students by their studentId field.
   */
  async resetAllStudentsProgress(skipStudentIds: string[] = []): Promise<{ success: number; failed: number }> {
    let success = 0, failed = 0
    try {
      const snapshot = await getDocs(collection(db, 'students'))
      await Promise.all(snapshot.docs.map(async (d) => {
        const sid = (d.data().studentId as string | undefined) ?? ''
        if (skipStudentIds.includes(sid)) return
        const ok = await storage.resetStudentProgress(d.id)
        if (ok) success++; else failed++
      }))
    } catch (error) {
      console.error('[Storage] resetAllStudentsProgress() failed:', error)
    }
    return { success, failed }
  },

  /**
   * Delete student documents (and their quizAttempts subcollection) for everyone
   * NOT in keepStudentIds.  Does NOT delete Firebase Auth accounts.
   */
  async deleteStudentsExcept(keepStudentIds: string[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0, failed = 0
    try {
      const snapshot = await getDocs(collection(db, 'students'))
      await Promise.all(snapshot.docs.map(async (d) => {
        const sid = (d.data().studentId as string | undefined) ?? ''
        if (keepStudentIds.includes(sid)) return
        try {
          const attemptsSnap = await getDocs(collection(d.ref, 'quizAttempts'))
          await Promise.all(attemptsSnap.docs.map(a => deleteDoc(a.ref)))
          await deleteDoc(d.ref)
          deleted++
        } catch {
          failed++
        }
      }))
    } catch (error) {
      console.error('[Storage] deleteStudentsExcept() failed:', error)
    }
    return { deleted, failed }
  },

  /**
   * Delete all unlock codes from both collections (lesson codes + quiz retake codes).
   */
  async deleteAllUnlockCodes(): Promise<boolean> {
    try {
      const [lessonSnap, quizSnap] = await Promise.all([
        getDocs(collection(db, 'unlockCodes')),
        getDocs(collection(db, 'quizUnlockCodes')),
      ])
      await Promise.all([
        ...lessonSnap.docs.map(d => deleteDoc(d.ref)),
        ...quizSnap.docs.map(d => deleteDoc(d.ref)),
      ])
      return true
    } catch (error) {
      console.error('[Storage] deleteAllUnlockCodes() failed:', error)
      return false
    }
  },

  // ── FILE UPLOADS ─────────────────────────────
  async uploadLessonPdf(lessonId: string, file: File): Promise<string | null> {
    try {
      const fileName = `${lessonId}-${Date.now()}.pdf`
      const filePath = `lessons/${lessonId}/${fileName}`
      const fileRef = ref(fbStorage, filePath)

      await uploadBytes(fileRef, file)
      const downloadUrl = await getDownloadURL(fileRef)
      return downloadUrl
    } catch (error) {
      console.error('[Storage] uploadLessonPdf() failed:', error)
      return null
    }
  },

  async deleteLessonPdf(pdfUrl: string): Promise<boolean> {
    try {
      if (!pdfUrl.includes('firebase')) return false
      const fileRef = ref(fbStorage, pdfUrl)
      await deleteObject(fileRef)
      return true
    } catch (error) {
      console.error('[Storage] deleteLessonPdf() failed:', error)
      return false
    }
  },
}
