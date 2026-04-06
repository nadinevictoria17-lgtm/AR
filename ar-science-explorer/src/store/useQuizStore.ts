import { create } from 'zustand'
import type { SubjectKey } from '../types'

export interface QuizStore {
  activeQuizSubject: SubjectKey | null
  quizQuestions: any[]
  quizIndex: number
  quizScore: number
  quizAnswers: (number | null)[]
  quizHintsUsed: number

  setActiveQuizSubject: (s: SubjectKey | null) => void
  initQuiz: (questions: any[]) => void
  submitAnswer: (optionIndex: number) => void
  nextQuestion: () => void
  useHint: () => void
  resetQuiz: () => void
}

export const useQuizStore = create<QuizStore>((set) => ({
  activeQuizSubject: null,
  quizQuestions: [],
  quizIndex: 0,
  quizScore: 0,
  quizAnswers: [],
  quizHintsUsed: 0,

  setActiveQuizSubject: (s) => set({ activeQuizSubject: s }),

  initQuiz: (questions) =>
    set({
      quizQuestions: questions,
      quizIndex: 0,
      quizScore: 0,
      quizAnswers: Array(questions.length).fill(null),
      quizHintsUsed: 0,
    }),

  submitAnswer: (optionIndex) =>
    set((state) => {
      const newAnswers = [...state.quizAnswers]
      newAnswers[state.quizIndex] = optionIndex
      const isCorrect =
        optionIndex === state.quizQuestions[state.quizIndex].correctIndex
      return {
        quizAnswers: newAnswers,
        quizScore: isCorrect ? state.quizScore + 1 : state.quizScore,
      }
    }),

  nextQuestion: () =>
    set((state) => ({
      quizIndex: state.quizIndex + 1,
    })),

  useHint: () =>
    set((state) => ({
      quizHintsUsed: Math.min(state.quizHintsUsed + 1, 1),
    })),

  resetQuiz: () =>
    set({
      quizQuestions: [],
      quizIndex: 0,
      quizScore: 0,
      quizAnswers: [],
      quizHintsUsed: 0,
      activeQuizSubject: null,
    }),
}))
