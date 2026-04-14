import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Lock, ChevronRight, FileText, Layout, Info } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { cn } from '../../../lib/utils'
import { pageVariants, SUBJECT_STYLES } from '../../../lib/variants'
import { LESSONS } from '../../../data/lessons'
import { QUIZ_QUESTIONS } from '../../../data/quiz'
import { SUBJECTS } from '../../../data/subjects'
import type { SubjectKey, Lesson } from '../../../types'
import { useNavigate } from 'react-router-dom'
import { storage } from '../../../lib/storage'
import { AccessCodeModal } from '../../shared/AccessCodeModal'

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology', 'physics']

// Static derived values — computed once since LESSONS / QUIZ_QUESTIONS are module-level constants
const SUBJECTS_DATA = SUBJECTS.filter(s => SUBJECT_ORDER.includes(s.id as SubjectKey))
const LESSON_COUNT_BY_SUBJECT: Record<SubjectKey, number> = {
  chemistry: LESSONS.filter(l => l.subject === 'chemistry').length,
  biology:   LESSONS.filter(l => l.subject === 'biology').length,
  physics:   LESSONS.filter(l => l.subject === 'physics').length,
}
const QUIZ_COUNT_BY_SUBJECT: Record<SubjectKey, number> = {
  chemistry: QUIZ_QUESTIONS.filter(q => q.subject === 'chemistry').length,
  biology:   QUIZ_QUESTIONS.filter(q => q.subject === 'biology').length,
  physics:   QUIZ_QUESTIONS.filter(q => q.subject === 'physics').length,
}

export function LearnScreen() {
  const { setScreen, setActiveLesson, currentStudentId } = useAppStore(
    useShallow(s => ({ setScreen: s.setScreen, setActiveLesson: s.setActiveLesson, currentStudentId: s.currentStudentId }))
  )
  const navigate = useNavigate()

  const [activeSubject, setActiveSubject] = useState<SubjectKey>('chemistry')
  const [unlockedLessons, setUnlockedLessons] = useState<Set<string>>(new Set())
  const [unlockModal, setUnlockModal] = useState<{ isOpen: boolean; lessonId: string; title: string }>({
    isOpen: false,
    lessonId: '',
    title: '',
  })

  const loadUnlockStatus = useCallback(async () => {
    if (!currentStudentId) return
    const ids = await storage.getUnlockedLessons(currentStudentId)
    setUnlockedLessons(new Set(ids))
  }, [currentStudentId])

  useEffect(() => {
    if (currentStudentId) loadUnlockStatus()
  }, [currentStudentId, loadUnlockStatus])

  const handleLessonClick = useCallback((lesson: Lesson) => {
    const isUnlocked = lesson.isUnlockedByDefault || unlockedLessons.has(lesson.id)
    if (isUnlocked) {
      setActiveLesson(lesson.id)
      setScreen('arlab')
      navigate('/app/arlab')
    } else {
      setUnlockModal({ isOpen: true, lessonId: lesson.id, title: lesson.title })
    }
  }, [unlockedLessons, setActiveLesson, setScreen, navigate])

  const handleModalClose = useCallback(() =>
    setUnlockModal(m => ({ ...m, isOpen: false })), [])

  const handleModalSuccess = useCallback(() => {
    loadUnlockStatus()
    setUnlockModal(m => ({ ...m, isOpen: false }))
  }, [loadUnlockStatus])

  const filteredLessons = useMemo(
    () => LESSONS.filter(l => l.subject === activeSubject),
    [activeSubject]
  )

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground p-8 sm:p-12 text-background shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-subject-biology/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/10 border border-background/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-background/80">Interactive Learning</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1]">
               Grade 7 <br />
              <span className="text-primary">Interactive Science</span>
            </h1>
            <p className="text-muted-foreground text-base mt-2 max-w-lg leading-relaxed">
              Explore the wonders of Chemistry and Biology through tactile AR visuals and comprehensive study guides.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {SUBJECTS_DATA.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSubject(s.id)}
                className={cn(
                  "p-5 rounded-3xl border-2 transition-all text-left min-w-[140px] group",
                  activeSubject === s.id 
                    ? "bg-background border-primary shadow-xl scale-105" 
                    : "bg-background/5 border-background/10 hover:bg-background/10"
                )}
              >
                <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 group-hover:translate-x-1 transition-transform", activeSubject === s.id ? "text-primary" : "text-background/40")}>
                  {s.shortName}
                </p>
                <p className={cn("text-xl font-black", activeSubject === s.id ? "text-foreground" : "text-background/60")}>
                  {activeSubject === s.id ? 'Active' : `View Q${SUBJECT_ORDER.indexOf(s.id) + 1}`}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", SUBJECT_STYLES[activeSubject].bg, SUBJECT_STYLES[activeSubject].text)}>
              <Layout size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground capitalize">
                Quarter {SUBJECT_ORDER.indexOf(activeSubject) + 1}: {activeSubject}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-medium text-muted-foreground">{LESSON_COUNT_BY_SUBJECT[activeSubject]} Lessons</span>
                <span className="text-xs text-muted-foreground opacity-30">•</span>
                <span className="text-xs font-medium text-muted-foreground">{QUIZ_COUNT_BY_SUBJECT[activeSubject]} Assessments</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="wait">
            {filteredLessons.map((lesson, idx) => {
                const isUnlocked = lesson.isUnlockedByDefault || unlockedLessons.has(lesson.id)
                const style = SUBJECT_STYLES[lesson.subject]
                
                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleLessonClick(lesson)}
                    className={cn(
                      "group relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden",
                      isUnlocked 
                        ? "bg-card border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5" 
                        : "bg-muted/30 border-transparent grayscale opacity-80"
                    )}
                  >
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="space-y-1">
                          <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", isUnlocked ? style.badge : "bg-muted text-muted-foreground border-border")}>
                            Week {lesson.week || idx + 1}
                          </span>
                          <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors leading-tight mt-2">
                            {lesson.title}
                          </h3>
                        </div>
                        {isUnlocked ? (
                          <div className={cn("p-2.5 rounded-2xl bg-card border-2 border-border shadow-md text-primary group-hover:border-primary/50 group-hover:scale-110 transition-all")}>
                            <ChevronRight size={20} />
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-2xl bg-muted/50 border border-border text-muted-foreground">
                            <Lock size={18} />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-6">
                        {lesson.summary}
                      </p>

                      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                        {isUnlocked ? (
                          <>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                              <GraduationCap size={14} /> Ready to Explore
                            </div>
                            <div className="ml-auto flex gap-2">
                              {lesson.pdfUrl && (
                                <a href={lesson.pdfUrl} download className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary transition-colors">
                                  <FileText size={14} />
                                </a>
                              )}
                              <button className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary transition-colors">
                                <Info size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Lock size={12} /> Contact Teacher for Access
                          </div>
                        )}
                      </div>
                    </div>

                    {isUnlocked && (
                      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                    )}
                  </motion.div>
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
    </motion.div>
  )
}
