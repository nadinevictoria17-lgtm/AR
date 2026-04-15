import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SubjectKey, TeacherQuizQuestion } from '../types'

/**
 * QuizQuestion is the minimal shape the quiz engine needs at runtime.
 * Both BuiltInQuestion and TeacherQuizQuestion satisfy this contract.
 */
export type QuizQuestion = Pick<TeacherQuizQuestion, 'question' | 'options' | 'correctIndex' | 'hint'>

export interface QuizStore {
  activeQuizSubject: SubjectKey | null
  quizQuestions: QuizQuestion[]
  quizIndex: number
  quizScore: number
  quizAnswers: (number | null)[]
  quizHintsUsed: number
  runningQuizId: string | null

  setActiveQuizSubject: (s: SubjectKey | null) => void
  initQuiz: (questions: QuizQuestion[]) => void
  submitAnswer: (optionIndex: number) => void
  nextQuestion: () => void
  useHint: () => void
  setRunningQuizId: (id: string | null) => void
  resetQuiz: () => void
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      activeQuizSubject: null,
      quizQuestions:    [],
      quizIndex:        0,
      quizScore:        0,
      quizAnswers:      [],
      quizHintsUsed:    0,
      runningQuizId:    null,

      setActiveQuizSubject: (s) => set({ activeQuizSubject: s }),

      initQuiz: (questions) =>
        set({
          quizQuestions: questions,
          quizIndex:     0,
          quizScore:     0,
          quizAnswers:   Array(questions.length).fill(null),
          quizHintsUsed: 0,
        }),

      submitAnswer: (optionIndex) =>
        set((state) => {
          const newAnswers = [...state.quizAnswers]
          newAnswers[state.quizIndex] = optionIndex
          const isCorrect = optionIndex === state.quizQuestions[state.quizIndex]?.correctIndex
          return {
            quizAnswers: newAnswers,
            quizScore: isCorrect ? state.quizScore + 1 : state.quizScore,
          }
        }),

      nextQuestion: () =>
        set((state) => ({ quizIndex: state.quizIndex + 1 })),

      useHint: () =>
        set((state) => ({ quizHintsUsed: Math.min(state.quizHintsUsed + 1, 1) })),
      
      setRunningQuizId: (id) => set({ runningQuizId: id }),

      resetQuiz: () =>
        set({
          quizQuestions:    [],
          quizIndex:        0,
          quizScore:        0,
          quizAnswers:      [],
          quizHintsUsed:    0,
          activeQuizSubject: null,
          runningQuizId:     null,
        }),
    }),
    {
      name: 'ar-explorer-quiz-storage',
    }
  )
)
