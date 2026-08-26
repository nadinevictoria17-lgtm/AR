import { useState, useCallback, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Lock, ChevronRight, FileText, Layout, Info, ClipboardCheck } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { useQuizStore } from '../../../store/useQuizStore'
import { cn } from '../../../lib/utils'
import { SUBJECT_STYLES } from '../../../lib/variants'
import { LESSONS } from '../../../data/lessons'
import { PRE_TEST_QUESTIONS } from '../../../data/curriculum'
import { SUBJECTS } from '../../../data/subjects'
import { builtinQuizId } from '../../../lib/quizId'
import type { SubjectKey, Lesson, TeacherLesson } from '../../../types'
import { useNavigate } from 'react-router-dom'
import { useStorageData } from '../../../hooks/useStorageData'
import { useStudentRecord } from '../../../hooks/useStudentRecord'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'
import { ContentSkeleton } from '../../ui/skeleton'
import { AccessCodeModal } from '../../shared/AccessCodeModal'

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology', 'physics']

// Lessons that define a pre-test (diagnostic taken before the lesson).
const LESSONS_WITH_PRETEST = new Set(PRE_TEST_QUESTIONS.map(q => q.lessonId).filter(Boolean) as string[])

// Memoized card to prevent re-renders when parent updates
const LessonCard = memo(function LessonCard({ lesson, idx, isUnlocked, onLessonClick, onPreTest }: {
  lesson: Lesson | TeacherLesson
  idx: number
  isUnlocked: boolean
  onLessonClick: (lesson: Lesson | TeacherLesson) => void
  onPreTest: (lesson: Lesson | TeacherLesson) => void
}) {
  const hasPreTest = LESSONS_WITH_PRETEST.has(lesson.id)
  const style = SUBJECT_STYLES[lesson.subject]
  return (
    <motion.div
      key={lesson.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onClick={() => onLessonClick(lesson)}
      className={cn(
        "group relative p-5 rounded-xl border cursor-pointer transition-colors",
        isUnlocked
          ? "bg-card border-border hover:border-primary/40"
          : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border", style.badge)}>
              {lesson.subject.slice(0, 4)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
              {`Week ${lesson.week || idx + 1}`}
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
            {lesson.title}
          </h3>
        </div>
        {isUnlocked ? (
          <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
        ) : (
          <Lock size={16} className="text-muted-foreground shrink-0 mt-1" />
        )}
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
        {lesson.summary}
      </p>

      <div className="flex items-center gap-3 pt-3 border-t border-border">
        {isUnlocked ? (
          <>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <GraduationCap size={13} /> Ready
            </div>
            <div className="ml-auto flex gap-1 items-center">
              {hasPreTest && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPreTest(lesson) }}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  <ClipboardCheck size={12} /> Pre-Test
                </button>
              )}
              {lesson.pdfUrl && (
                <a href={lesson.pdfUrl} download onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                  <FileText size={14} />
                </a>
              )}
              <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                <Info size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Lock size={13} /> Unlock with your teacher&apos;s code
          </div>
        )}
      </div>
    </motion.div>
  )
})

// Static derived values
const SUBJECTS_DATA = SUBJECTS.filter(s => SUBJECT_ORDER.includes(s.id as SubjectKey))

export function LearnScreen() {
  const { setActiveLesson, currentStudentId } = useAppStore(
    useShallow(s => ({ setActiveLesson: s.setActiveLesson, currentStudentId: s.currentStudentId }))
  )
  const { initQuiz, setActiveQuizSubject, setRunningQuizId } = useQuizStore(
    useShallow(s => ({ initQuiz: s.initQuiz, setActiveQuizSubject: s.setActiveQuizSubject, setRunningQuizId: s.setRunningQuizId }))
  )
  const { data: storageData, isLoading: quizzesLoading } = useStorageData()
  const { student, isLoading: studentLoading } = useStudentRecord(currentStudentId)
  const showSkeleton = useDeferredLoading(quizzesLoading || studentLoading)
  const navigate = useNavigate()

  const [activeSubject, setActiveSubject] = useState<SubjectKey>('chemistry')
  const [unlockModal, setUnlockModal] = useState<{ isOpen: boolean; lessonId: string; title: string }>({
    isOpen: false,
    lessonId: '',
    title: '',
  })

  const unlockedLessons = useMemo(() => new Set(student?.unlockedLessonIds ?? []), [student?.unlockedLessonIds])

  const handleLessonClick = useCallback((lesson: Lesson | TeacherLesson) => {
    const isUnlocked = ('isUnlockedByDefault' in lesson && lesson.isUnlockedByDefault) || (unlockedLessons && unlockedLessons.has(lesson.id))
    if (isUnlocked) {
      setActiveLesson(lesson.id)
      navigate('/app/arlab')
    } else {
      setUnlockModal({ isOpen: true, lessonId: lesson.id, title: lesson.title })
    }
  }, [unlockedLessons, setActiveLesson, navigate])

  // Pre-test is available immediately (no access code) — start it right away.
  const handlePreTest = useCallback((lesson: Lesson | TeacherLesson) => {
    const preQs = PRE_TEST_QUESTIONS.filter(q => q.lessonId === lesson.id)
    if (preQs.length === 0) return
    setActiveQuizSubject(lesson.subject)
    initQuiz(preQs)
    setRunningQuizId(builtinQuizId(lesson.id, 'pre'))
    navigate('/app/quiz')
  }, [initQuiz, setActiveQuizSubject, setRunningQuizId, navigate])

  const handleModalClose = useCallback(() =>
    setUnlockModal(m => ({ ...m, isOpen: false })), [])

  // The shared student-record listener picks up the new unlockedLessonIds
  // automatically once the write lands — no manual re-fetch needed.
  const handleModalSuccess = useCallback(() => {
    setUnlockModal(m => ({ ...m, isOpen: false }))
  }, [])

  // Merge built-in lessons with teacher-created lessons
  const allLessons = useMemo(() => {
    const merged: (Lesson | TeacherLesson)[] = [...LESSONS]
    // Add teacher-created lessons that don't override built-in ones
    for (const teacherLesson of storageData.lessons) {
      if (!merged.some(l => l.id === teacherLesson.id)) {
        merged.push(teacherLesson as TeacherLesson & Lesson)
      }
    }
    return merged
  }, [storageData.lessons])

  const filteredLessons = useMemo(
    () => allLessons.filter(l => l.subject === activeSubject),
    [allLessons, activeSubject]
  )

  if (showSkeleton) return <ContentSkeleton />

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lessons</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Chemistry, Biology, and Physics — Grade 7 curriculum.
          </p>
        </div>

        <div className="inline-flex gap-1 p-1 bg-muted rounded-lg self-start">
          {SUBJECTS_DATA.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors",
                activeSubject === s.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", SUBJECT_STYLES[activeSubject].bg, SUBJECT_STYLES[activeSubject].text)}>
            <Layout size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground capitalize">
              Quarter {SUBJECT_ORDER.indexOf(activeSubject) + 1}: {activeSubject}
            </h2>
            <span className="text-xs text-muted-foreground">{filteredLessons.length} lessons</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* initial=false: the outer AppPage route transition already fades
              this screen in on mount, so cards should only animate in/out
              when the subject filter changes, not on first render. */}
          <AnimatePresence mode="wait" initial={false}>
            {filteredLessons.map((lesson, idx) => {
              const isUnlocked = ('isUnlockedByDefault' in lesson && lesson.isUnlockedByDefault) || unlockedLessons.has(lesson.id)
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  idx={idx}
                  isUnlocked={isUnlocked}
                  onLessonClick={handleLessonClick}
                  onPreTest={handlePreTest}
                />
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      <AccessCodeModal
        isOpen={unlockModal.isOpen}
        onClose={handleModalClose}
        targetId={unlockModal.lessonId}
        type="lesson"
        title={unlockModal.title}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
