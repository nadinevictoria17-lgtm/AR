import { useCallback } from 'react'
import { storage } from '../lib/storage'
import type { QuizAttempt } from '../types'

export function useQuizAttempt() {
  const canTakeQuiz = useCallback(
    (studentId: string, quizId: string): Promise<boolean> =>
      storage.canStudentTakeQuiz(studentId, quizId),
    []
  )

  const getAttempts = useCallback(
    (studentId: string, quizId: string): Promise<QuizAttempt[]> =>
      storage.getQuizAttempts(studentId, quizId),
    []
  )

  const getBestScore = useCallback(
    (studentId: string, quizId: string): Promise<number | null> =>
      storage.getBestQuizScore(studentId, quizId),
    []
  )

  const saveAttempt = useCallback(
    async (
      studentId:      string,
      quizId:         string,
      score:          number,
      totalQuestions: number,
      correctAnswers: number,
      answers:        number[]
    ): Promise<boolean> => {
      const attempts     = await storage.getQuizAttempts(studentId, quizId)
      const attemptNumber = attempts.length + 1

      const attempt: QuizAttempt = {
        id:             `attempt-${quizId}-${studentId}-${Date.now()}`,
        quizId,
        studentId,
        attemptNumber,
        score,
        totalQuestions,
        correctAnswers,
        answers,
        timestamp: new Date().toISOString(),
        locked:    true,
      }

      return storage.saveQuizAttempt(attempt)
    },
    []
  )

  const unlockForRetake = useCallback(
    (studentId: string, quizId: string): Promise<string | null> =>
      storage.unlockQuizForRetake(studentId, quizId),
    []
  )

  const applyUnlockCode = useCallback(
    (studentId: string, quizId: string, code: string): Promise<boolean> =>
      storage.applyQuizUnlockCode(studentId, quizId, code),
    []
  )

  return { canTakeQuiz, getAttempts, getBestScore, saveAttempt, unlockForRetake, applyUnlockCode }
}
