import { storage } from '../lib/storage'
import type { QuizAttempt } from '../types'

export function useQuizAttempt() {
  const canTakeQuiz = async (studentId: string, quizId: string): Promise<boolean> => {
    return storage.canStudentTakeQuiz(studentId, quizId)
  }

  const getAttempts = async (studentId: string, quizId: string): Promise<QuizAttempt[]> => {
    return storage.getQuizAttempts(studentId, quizId)
  }

  const getBestScore = async (studentId: string, quizId: string): Promise<number | null> => {
    return storage.getBestQuizScore(studentId, quizId)
  }

  const saveAttempt = async (
    studentId: string,
    quizId: string,
    score: number,
    totalQuestions: number,
    correctAnswers: number,
    answers: number[]
  ): Promise<boolean> => {
    const attempts = await getAttempts(studentId, quizId)
    const attemptNumber = attempts.length + 1

    const attempt: QuizAttempt = {
      id: `attempt-${quizId}-${studentId}-${Date.now()}`,
      quizId,
      studentId,
      attemptNumber,
      score,
      totalQuestions,
      correctAnswers,
      answers,
      timestamp: new Date().toISOString(),
      locked: true, // Lock after first attempt
    }

    return storage.saveQuizAttempt(attempt)
  }

  const unlockForRetake = async (studentId: string, quizId: string): Promise<string | null> => {
    return storage.unlockQuizForRetake(studentId, quizId)
  }

  const applyUnlockCode = async (studentId: string, quizId: string, code: string): Promise<boolean> => {
    return storage.applyQuizUnlockCode(studentId, quizId, code)
  }

  return {
    canTakeQuiz,
    getAttempts,
    getBestScore,
    saveAttempt,
    unlockForRetake,
    applyUnlockCode,
  }
}
