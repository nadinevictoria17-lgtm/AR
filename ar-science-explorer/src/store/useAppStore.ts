import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ARPayload, SubjectKey } from '../types'
import { LESSONS } from '../data/lessons'
import { getUnlockCodeData } from '../lib/unlockCodeManager'
import { storage } from '../lib/storage'

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
  activeLessonId: string | null
  activeARPayload: ARPayload | null
  activeLabExperimentId: string | null

  arModelIndex: number
  arSourceVisible: boolean

  // Actions
  setScreen: (s: Screen) => void
  setCurrentStudentId: (id: string | null) => void
  setActiveSubject: (s: SubjectKey | null) => void
  setActiveTopic: (t: string | null) => void
  setActiveLesson: (id: string | null, payload?: ARPayload | null) => void
  setActiveLabExperiment: (id: string | null) => void
  toggleTheme: () => void
  setVoiceLang: (lang: 'en' | 'Filipino') => void
  unlockSubject: (s: SubjectKey) => void
  applyAccessCode: (code: string) => Promise<{ unlocked: SubjectKey[]; targetName?: string; invalid: boolean }>

  // AR actions
  setArModelIndex: (idx: number) => void
  toggleARSource: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Persisted state
      unlocked: { biology: false, chemistry: true },
      voiceLang: 'en',
      theme: 'light',

      // Session state
      currentStudentId: null,
      screen: 'getstarted',
      activeSubject: null,
      activeTopic: null,
      activeLessonId: null,
      activeARPayload: null,
      activeLabExperimentId: null,

      arModelIndex: 0,
      arSourceVisible: true,

      // Actions
      setScreen: (s) => set({ screen: s }),
      setCurrentStudentId: (id) => set({ currentStudentId: id }),
      setActiveSubject: (s) => set({ activeSubject: s }),
      setActiveTopic: (t) => set({ activeTopic: t }),
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

      applyAccessCode: async (code) => {
        const normalized = code.trim().toUpperCase()
        const currentStudentId = useAppStore.getState().currentStudentId

        if (!normalized) return { unlocked: [], invalid: true }

        const data = await getUnlockCodeData(normalized)
        if (!data) return { unlocked: [], invalid: true }

        if (data.type === 'subject') {
          // If specific lesson IDs are included, unlock those in Firestore for this student
          if (data.lessonIds && data.lessonIds.length > 0 && currentStudentId) {
            await Promise.all(
              data.lessonIds.map(id => storage.unlockContent(currentStudentId, id, 'lesson'))
            )
            const lessonTitles = data.lessonIds
              .map(id => LESSONS.find(l => l.id === id)?.title || id)
              .join(', ')
            return { unlocked: data.subjects || [], targetName: lessonTitles, invalid: false }
          }
          // Otherwise unlock entire subjects in Zustand store
          if (data.subjects && data.subjects.length > 0) {
            set((state) => ({
              unlocked: data.subjects!.reduce((acc, s) => ({ ...acc, [s]: true }), state.unlocked),
            }))
            return { unlocked: data.subjects, invalid: false }
          }
        }

        // Handle specific lesson unlock (type='lesson')
        if (data.type === 'lesson' && data.targetId && currentStudentId) {
          const success = await storage.unlockContent(currentStudentId, data.targetId, 'lesson')
          if (success) {
            const lesson = LESSONS.find(l => l.id === data.targetId)
            return { unlocked: [], targetName: lesson?.title || data.targetId, invalid: false }
          }
        }

        // Handle quiz retake codes created via UnlockCodeManager.
        // The targetId is a lesson ID (e.g. 'q1w1'). The actual quiz ID used
        // by the attempt system is 'builtin-q1w1'.  We must unlock the latest
        // locked attempt so validateQuizEligibility allows the retake.
        if (data.type === 'quiz' && data.targetId && currentStudentId) {
          const builtInQuizId = `builtin-${data.targetId}`
          await storage.markQuizAsRetakeable(currentStudentId, builtInQuizId)
          const lesson = LESSONS.find(l => l.id === data.targetId)
          return {
            unlocked: [],
            targetName: lesson?.title ? `${lesson.title} – Quiz Retake` : 'Quiz Retake',
            invalid: false,
          }
        }

        return { unlocked: [], invalid: true }
      },

      // AR actions
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
