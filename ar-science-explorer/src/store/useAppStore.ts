import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ARPayload, SubjectKey } from '../types'
import { LESSONS } from '../data/lessons'
import { getUnlockCodeData, trackCodeUsage } from '../lib/unlockCodeManager'
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
  applyAccessCode: (code: string) => Promise<{ unlocked: SubjectKey[]; targetName?: string; invalid: boolean; error?: string }>

  // AR actions
  setArModelIndex: (idx: number) => void
  toggleARSource: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Persisted state
      unlocked: { biology: false, chemistry: true, physics: false },
      voiceLang: 'en' as 'en' | 'Filipino',
      theme: 'light',

      // Session state
      currentStudentId: null as string | null,
      screen: 'getstarted',
      activeSubject: null as SubjectKey | null,
      activeTopic: null as string | null,
      activeLessonId: null as string | null,
      activeARPayload: null as ARPayload | null,
      activeLabExperimentId: null as string | null,

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

      applyAccessCode: async (code): Promise<{ unlocked: SubjectKey[]; targetName?: string; invalid: boolean; error?: string }> => {
        const normalized = code.trim().toUpperCase()
        const state = get()
        const { currentStudentId } = state

        if (!normalized) return { unlocked: [], invalid: true }

        const data = await getUnlockCodeData(normalized)
        if (!data) return { unlocked: [], invalid: true }

        // Security: If code is for a specific student ID, verify it matches
        if (data.targetStudentId && data.targetStudentId !== currentStudentId) {
          return { 
            unlocked: [], 
            invalid: true, 
            error: `This code is restricted to student ID ${data.targetStudentId}.` 
          }
        }

        // Security: Check if THIS student has already used this specific code
        if (currentStudentId && data.usedByStudentIds?.includes(currentStudentId)) {
          return { unlocked: [], invalid: true, error: "You have already used this code." }
        }

        if (data.type === 'subject') {
          // If specific lesson IDs are included, unlock those in Firestore for this student
          if (data.lessonIds && data.lessonIds.length > 0 && currentStudentId) {
            await Promise.all(
              data.lessonIds.map(id => storage.unlockContent(currentStudentId, id, 'lesson'))
            )
            // Track usage for this student
            await trackCodeUsage(normalized, currentStudentId)
            
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
            // Track usage if possible (optional for global subject codes but good for consistency)
            if (currentStudentId) await trackCodeUsage(normalized, currentStudentId)

            return { unlocked: data.subjects, invalid: false }
          }
        }

        // Handle specific lesson unlock (type='lesson') - which is the "Quiz Unlock"
        if (data.type === 'lesson' && data.targetId && currentStudentId) {
          const success = await storage.unlockContent(currentStudentId, data.targetId, 'lesson')
          if (success) {
            // Track usage so they can't use it again for a retake
            await trackCodeUsage(normalized, currentStudentId)

            const lesson = LESSONS.find(l => l.id === data.targetId)
            return { unlocked: [], targetName: lesson?.title || data.targetId, invalid: false }
          }
        }

        // Handle quiz retake codes (type='quiz')
        if (data.type === 'quiz' && data.targetId && currentStudentId) {
          const builtInQuizId = `builtin-${data.targetId}`
          await storage.markQuizAsRetakeable(currentStudentId, builtInQuizId)
          
          // Track usage - retake codes are always 1-time-use per student
          await trackCodeUsage(normalized, currentStudentId, true)

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
      setArModelIndex: (idx: number) =>
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
        currentStudentId: state.currentStudentId,
      }),
    }
  )
)
