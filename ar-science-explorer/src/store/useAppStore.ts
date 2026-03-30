import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ARPayload, SubjectKey } from '../types'
import { UNLOCK_CODES } from '../data/unlockCodes'

type Screen =
  | 'getstarted'
  | 'unlock'
  | 'home'
  | 'learn'
  | 'arlab'
  | 'progress'
  | 'topics'
  | 'lessons'
  | 'ar'
  | 'quiz'
  | 'lab'
  | 'topicDetail'

export interface AppStore {
  // Persisted state
  unlocked: Record<SubjectKey, boolean>
  voiceLang: 'en' | 'Filipino'
  theme: 'light' | 'dark'

  // Session state (not persisted)
  currentStudentId: string | null
  screen: Screen
  activeSubject: SubjectKey | null
  activeTopic: string | null
  activeQuizSubject: SubjectKey | null
  activeLessonId: string | null
  activeARPayload: ARPayload | null
  activeLabExperimentId: string | null
  quizQuestions: any[]
  quizIndex: number
  quizScore: number
  quizAnswers: (number | null)[]
  quizHintsUsed: number

  arModelIndex: number
  arSourceVisible: boolean

  // Actions
  setScreen: (s: Screen) => void
  setCurrentStudentId: (id: string | null) => void
  setActiveSubject: (s: SubjectKey | null) => void
  setActiveTopic: (t: string | null) => void
  setActiveQuizSubject: (s: SubjectKey | null) => void
  setActiveLesson: (id: string | null, payload?: ARPayload | null) => void
  setActiveLabExperiment: (id: string | null) => void
  toggleTheme: () => void
  setVoiceLang: (lang: 'en' | 'Filipino') => void
  unlockSubject: (s: SubjectKey) => void
  applyAccessCode: (code: string) => { unlocked: SubjectKey[]; invalid: boolean }

  // Quiz actions
  initQuiz: (questions: any[]) => void
  submitAnswer: (optionIndex: number) => void
  nextQuestion: () => void
  useHint: () => void
  resetQuiz: () => void

  // AR actions
  setArModelIndex: (idx: number) => void
  toggleARSource: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Persisted state
      unlocked: { physics: true, biology: false, chemistry: false, earth: false },
      voiceLang: 'en',
      theme: 'light',

      // Session state
      currentStudentId: null,
      screen: 'getstarted',
      activeSubject: null,
      activeTopic: null,
      activeQuizSubject: null,
      activeLessonId: null,
      activeARPayload: null,
      activeLabExperimentId: null,
      quizQuestions: [],
      quizIndex: 0,
      quizScore: 0,
      quizAnswers: [],
      quizHintsUsed: 0,

      arModelIndex: 0,
      arSourceVisible: true,

      // Actions
      setScreen: (s) => set({ screen: s }),
      setCurrentStudentId: (id) => set({ currentStudentId: id }),
      setActiveSubject: (s) => set({ activeSubject: s }),
      setActiveTopic: (t) => set({ activeTopic: t }),
      setActiveQuizSubject: (s) => set({ activeQuizSubject: s }),
      setActiveLesson: (id, payload = null) => set({ activeLessonId: id, activeARPayload: payload }),
      setActiveLabExperiment: (id) => set({ activeLabExperimentId: id }),

      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light'
          document.documentElement.className = newTheme
          return { theme: newTheme }
        }),

      setVoiceLang: (lang) => set({ voiceLang: lang }),

      unlockSubject: (s) =>
        set((state) => ({
          unlocked: { ...state.unlocked, [s]: true },
        })),

      applyAccessCode: (code) => {
        const normalized = code.trim().toUpperCase()
        if (!normalized) return { unlocked: [], invalid: true }
        const matches = (Object.entries(UNLOCK_CODES) as [SubjectKey, string[]][])
          .filter(([, codes]) => codes.map((c) => c.toUpperCase()).includes(normalized))
          .map(([subject]) => subject)
        if (matches.length === 0) return { unlocked: [], invalid: true }
        set((state) => ({
          unlocked: matches.reduce((acc, s) => ({ ...acc, [s]: true }), state.unlocked),
        }))
        return { unlocked: matches, invalid: false }
      },

      // Quiz actions
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
          quizHintsUsed: Math.min(state.quizHintsUsed + 1, 3),
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

      // AR actions (Vuforia-based: minimal state, no client-side detection)
      setArModelIndex: (idx) =>
        set({
          arModelIndex: idx,
        }),

      toggleARSource: () =>
        set((state) => ({
          arSourceVisible: !state.arSourceVisible,
        })),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        unlocked: state.unlocked,
        voiceLang: state.voiceLang,
        theme: state.theme,
      }),
    }
  )
)
