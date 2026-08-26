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
import { Card } from '../../ui/card'
import { AccessCodeModal } from '../../shared/AccessCodeModal'

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology', 'physics']

// Lessons that define a pre-test (diagnostic taken before the lesson).
const LESSONS_WITH_PRETEST = new Set(PRE_TEST_QUESTIONS.map(q => q.lessonId).filter(Boolean) as string[])

// Memoized card to prevent re-renders when parent updates
const LessonCard = memo(({ lesson, idx, isUnlocked, featured = false, onLessonClick, onPreTest }: {
  lesson: Lesson | TeacherLesson
  idx: number
  isUnlocked: boolean
  featured?: boolean
  onLessonClick: (lesson: Lesson | TeacherLesson) => void
  onPreTest: (lesson: Lesson | TeacherLesson) => void
}) => {
  const hasPreTest = LESSONS_WITH_PRETEST.has(lesson.id)
  const style = SUBJECT_STYLES[lesson.subject]

  if (featured) {
    return (
      <motion.div
        key={lesson.id}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        onClick={() => onLessonClick(lesson)}
        className="col-span-1 sm:col-span-2 lg:col-span-2"
      >
        <Card
          className={cn(
            "group h-full p-6 md:p-7 cursor-pointer transition-colors duration-150 flex flex-col",
            isUnlocked
              ? "hover:border-muted-foreground/30"
              : "bg-muted/30 opacity-70"
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  isUnlocked
                    ? style.badge
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {lesson.subject.slice(0, 4)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  {`Week ${lesson.week || idx + 1}`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                  Start here
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-foreground group-hover:text-primary transition-colors leading-tight tracking-tight">
                {lesson.title}
              </h3>
            </div>
            {isUnlocked ? (
              <div className="w-10 h-10 shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                <ChevronRight size={18} />
              </div>
            ) : (
              <div className="w-10 h-10 shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Lock size={17} />
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6 max-w-lg">
            {lesson.summary}
          </p>

          <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto">
            {isUnlocked ? (
              <>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-primary">
                  <GraduationCap size={14} /> Ready to explore
                </div>
                <div className="ml-auto flex gap-1 items-center">
                  {hasPreTest && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onPreTest(lesson) }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 text-primary text-[12px] font-medium hover:bg-primary/15 transition-colors"
                    >
                      <ClipboardCheck size={13} /> Pre-test
                    </button>
                  )}
                  {lesson.pdfUrl && (
                    <a href={lesson.pdfUrl} download className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                      <FileText size={14} />
                    </a>
                  )}
                  <button className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                    <Info size={14} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                <Lock size={14} /> Unlock to explore
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      key={lesson.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      onClick={() => onLessonClick(lesson)}
    >
      <Card
        className={cn(
          "group p-5 cursor-pointer transition-colors duration-150",
          isUnlocked
            ? "hover:border-muted-foreground/30"
            : "bg-muted/30 opacity-70"
        )}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border",
                isUnlocked
                  ? style.badge
                  : "bg-muted text-muted-foreground border-border"
              )}>
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
            <div className="w-8 h-8 shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
              <ChevronRight size={16} />
            </div>
          ) : (
            <div className="w-8 h-8 shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Lock size={15} />
            </div>
          )}
        </div>

        <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed mb-4">
          {lesson.summary}
        </p>

        <div className="flex items-center gap-3 pt-3 border-t border-border">
          {isUnlocked ? (
            <>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                <GraduationCap size={13} /> Ready to explore
              </div>
              <div className="ml-auto flex gap-1 items-center">
                {hasPreTest && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPreTest(lesson) }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium hover:bg-primary/15 transition-colors"
                  >
                    <ClipboardCheck size={12} /> Pre-test
                  </button>
                )}
                {lesson.pdfUrl && (
                  <a href={lesson.pdfUrl} download className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                    <FileText size={13} />
                  </a>
                )}
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                  <Info size={13} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Lock size={13} /> Unlock to explore
            </div>
          )}
        </div>
      </Card>
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

  // Featured entry = next incomplete lesson in this subject, falling back to
  // the first unlocked one, falling back to the first lesson overall.
  const featuredLessonId = useMemo(() => {
    if (filteredLessons.length === 0) return null
    const nextIncomplete = filteredLessons.find(l => !student?.completedLessonIds.includes(l.id))
    if (nextIncomplete) return nextIncomplete.id
    const firstUnlocked = filteredLessons.find(l =>
      ('isUnlockedByDefault' in l && l.isUnlockedByDefault) || unlockedLessons.has(l.id)
    )
    return (firstUnlocked ?? filteredLessons[0]).id
  }, [filteredLessons, student, unlockedLessons])

  if (showSkeleton) return <ContentSkeleton />

  return (
    <div className="space-y-6 pb-12">
      {/* ── Full-bleed hero banner ─────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-foreground p-7 md:p-9 text-background">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/10 border border-background/15 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-background/70">Interactive learning</span>
        </div>
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight leading-tight mb-2">
          Grade 7 <span className="text-primary">Interactive Science</span>
        </h1>
        <p className="text-background/60 text-[13px] max-w-lg leading-relaxed">
          Explore Chemistry and Biology through tactile AR visuals and comprehensive study guides.
        </p>
      </div>

      {/* ── Persistent subject tab/pill rail ───────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SUBJECTS_DATA.map((s) => {
          const isActive = activeSubject === s.id
          const style = SUBJECT_STYLES[s.id as SubjectKey]
          return (
            <button
              key={s.id}
              onClick={() => setActiveSubject(s.id)}
              className={cn(
                "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-foreground border-foreground text-background"
                  : "bg-card border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              )}
            >
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                isActive ? "bg-primary" : style.bar
              )} />
              {s.shortName}
              <span className={cn(
                "text-[10px] font-normal",
                isActive ? "text-background/50" : "text-muted-foreground/60"
              )}>
                Q{SUBJECT_ORDER.indexOf(s.id) + 1}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", SUBJECT_STYLES[activeSubject].bg, SUBJECT_STYLES[activeSubject].text)}>
              <Layout size={17} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground capitalize tracking-tight">
                Quarter {SUBJECT_ORDER.indexOf(activeSubject) + 1}: {activeSubject}
              </h2>
              <span className="text-xs text-muted-foreground">{filteredLessons.length} lessons</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="wait">
            {filteredLessons.map((lesson, idx) => {
              const isUnlocked = ('isUnlockedByDefault' in lesson && lesson.isUnlockedByDefault) || unlockedLessons.has(lesson.id)
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  idx={idx}
                  isUnlocked={isUnlocked}
                  featured={lesson.id === featuredLessonId}
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
