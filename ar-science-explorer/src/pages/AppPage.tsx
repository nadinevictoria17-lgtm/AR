import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { StudentSidebar } from '../components/layout/StudentSidebar'
import { cn } from '../lib/utils'
import { SUBJECTS } from '../data/subjects'
import { QUIZ_QUESTIONS } from '../data/quiz'
import { LESSONS } from '../data/lessons'
import { storage } from '../lib/storage'
import type { Lesson, SubjectKey, TeacherLesson } from '../types'
import { Camera, BookOpen, ChevronRight, Lock, Zap, Trophy, ArrowLeft } from 'lucide-react'
import { Menu, KeyRound, CheckCircle2 } from 'lucide-react'
import { ARLabScreen } from '../components/screens/ARLabScreen'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

const SUBJECT_STYLES: Record<SubjectKey, { bg: string; border: string; text: string; badge: string }> = {
  physics:   { bg: 'bg-subject-physics/10',   border: 'border-subject-physics/25',   text: 'text-subject-physics',   badge: 'bg-subject-physics/15 text-subject-physics border-subject-physics/30' },
  biology:   { bg: 'bg-subject-biology/10',   border: 'border-subject-biology/25',   text: 'text-subject-biology',   badge: 'bg-subject-biology/15 text-subject-biology border-subject-biology/30' },
  chemistry: { bg: 'bg-subject-chemistry/10', border: 'border-subject-chemistry/25', text: 'text-subject-chemistry', badge: 'bg-subject-chemistry/15 text-subject-chemistry border-subject-chemistry/30' },
  earth:     { bg: 'bg-subject-earth/10',     border: 'border-subject-earth/25',     text: 'text-subject-earth',     badge: 'bg-subject-earth/15 text-subject-earth border-subject-earth/30' },
}

const SUBJECT_ORDER: SubjectKey[] = ['physics', 'biology', 'chemistry', 'earth']

function parseStepsFromContent(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

function mapTeacherLessonToLesson(lesson: TeacherLesson): Lesson {
  const fallbackModelIdx = Math.max(SUBJECT_ORDER.indexOf(lesson.subject), 0)
  return {
    id: `teacher-${lesson.id}`,
    title: lesson.title,
    subject: lesson.subject,
    summary: lesson.summary ?? (lesson.content.slice(0, 120) || 'Teacher-provided lesson content.'),
    steps: lesson.steps?.length ? lesson.steps : parseStepsFromContent(lesson.content),
    labExperimentId: lesson.labExperimentId,
    arPayload: lesson.arPayload ?? {
      modelIndex: fallbackModelIdx,
      detectionMode: 'marker',
      anchorHint: `Scan a ${lesson.subject} marker to open AR.`,
      lessonSteps: ['Open camera', 'Scan marker/surface', 'Inspect model'],
    },
  }
}

function BackNav({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  )
}

function UnlockScreen() {
  const { unlocked, applyAccessCode, setScreen } = useAppStore()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const locked = (Object.entries(unlocked) as [SubjectKey, boolean][])
    .filter(([, v]) => !v)
    .map(([k]) => k)

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <BackNav onClick={() => setScreen('home')} label="Back to Home" />
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <KeyRound size={18} className="text-primary" /> Unlock Subjects
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Enter an access code from your teacher to unlock new subjects.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Access Code</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setMessage(null) }}
            placeholder="e.g. UNLOCK2"
            className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => {
              const res = applyAccessCode(code)
              if (res.invalid) setMessage('Invalid code. Ask your teacher for the correct access code.')
              else setMessage(`Unlocked: ${res.unlocked.join(', ')}`)
              setCode('')
            }}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Unlock
          </button>
        </div>
        {message && (
          <p className={cn('mt-3 text-sm', message.startsWith('Unlocked') ? 'text-primary' : 'text-destructive')}>
            {message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.entries(unlocked) as [SubjectKey, boolean][]).map(([subject, isUnlocked]) => {
          const s = SUBJECT_STYLES[subject]
          return (
            <div key={subject} className={cn('rounded-2xl border p-4 bg-card flex items-center gap-3', s.border)}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.badge)}>
                <CheckCircle2 size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground capitalize">{subject}</p>
                <p className="text-xs text-muted-foreground">{isUnlocked ? 'Unlocked' : 'Locked'}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{locked.length > 0 ? `${locked.length} subjects still locked` : 'All subjects unlocked'}</p>
        <button onClick={() => setScreen('home')} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
          Continue to Dashboard
        </button>
      </div>
    </motion.div>
  )
}

function GetStartedScreen() {
  const { setScreen } = useAppStore()
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate"
      className="min-h-full flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-10"
          style={{ background: 'radial-gradient(circle at 35% 30%, hsl(var(--subject-physics)), hsl(var(--primary)))', boxShadow: '0 0 24px hsl(var(--primary) / 0.6)' }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute inset-0 rounded-full border opacity-60"
            style={{
              borderColor: ['hsl(var(--subject-physics))', 'hsl(var(--subject-chemistry))', 'hsl(var(--subject-earth))'][i],
              animation: `orbit ${2.8 + i * 0.6}s linear infinite ${i % 2 === 0 ? 'normal' : 'reverse'}`,
              transform: `rotateX(70deg) rotateZ(${i * 60}deg)`,
            }}>
            <div className="absolute w-2.5 h-2.5 rounded-full -top-1.5 left-1/2 -translate-x-1/2"
              style={{ background: ['hsl(var(--subject-physics))', 'hsl(var(--subject-chemistry))', 'hsl(var(--subject-earth))'][i] }} />
          </div>
        ))}
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">AR Science<br /><span className="text-gradient">Explorer</span></h1>
      <p className="text-sm text-muted-foreground mb-2 font-medium">Pasig Catholic College · Grade 7</p>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {(['physics', 'biology', 'chemistry', 'earth'] as SubjectKey[]).map((s) => (
          <span key={s} className={cn('px-3 py-1 rounded-full border text-xs font-semibold capitalize', SUBJECT_STYLES[s].badge)}>{s}</span>
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => setScreen('home')}
        className="px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base btn-glow hover:bg-primary/90 transition-all mb-4">
        Get Started
      </motion.button>
      <p className="text-xs text-muted-foreground">Tap to begin your science journey</p>
    </motion.div>
  )
}

function HomeScreen() {
  const { setScreen, unlocked, currentStudentId, applyAccessCode } = useAppStore()
  const [accessCode, setAccessCode] = useState('')
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null)
  const data = storage.getAll()
  const teacherLessonCountBySubject: Record<SubjectKey, number> = {
    physics: data.lessons.filter((l) => l.subject === 'physics').length,
    biology: data.lessons.filter((l) => l.subject === 'biology').length,
    chemistry: data.lessons.filter((l) => l.subject === 'chemistry').length,
    earth: data.lessons.filter((l) => l.subject === 'earth').length,
  }
  const teacherQuizCountBySubject: Record<SubjectKey, number> = {
    physics: data.quizzes.filter((q) => q.subject === 'physics').length,
    biology: data.quizzes.filter((q) => q.subject === 'biology').length,
    chemistry: data.quizzes.filter((q) => q.subject === 'chemistry').length,
    earth: data.quizzes.filter((q) => q.subject === 'earth').length,
  }
  const quickActions = [
    { label: 'Learn',     icon: BookOpen,   screen: 'learn' as const,   accent: 'bg-subject-earth/10 text-subject-earth' },
    { label: 'AR + Lab', icon: Camera,     screen: 'arlab' as const,   accent: 'bg-subject-physics/10 text-subject-physics' },
    { label: 'Progress', icon: Trophy,     screen: 'progress' as const, accent: 'bg-subject-biology/10 text-subject-biology' },
  ]
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-8">
      <div className="rounded-2xl border border-border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">
          Local demo mode: student and teacher data sync only on this browser/device.
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{currentStudentId ? `Student · ${currentStudentId}` : 'Welcome back'}</p>
        <h1 className="text-2xl font-bold text-foreground mt-1">Ready to <span className="text-gradient">explore</span>?</h1>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ label, icon: Icon, screen, accent }) => (
            <motion.button key={label} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => setScreen(screen)}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', accent)}><Icon size={20} /></div>
              <span className="text-xs font-semibold text-foreground">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">How Tabs Work</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-xl border border-border p-3 bg-muted/20">
            <p className="text-sm font-semibold text-foreground">Learn</p>
            <p className="text-xs text-muted-foreground mt-1">Read lessons, then choose quiz or AR activity.</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-muted/20">
            <p className="text-sm font-semibold text-foreground">AR + Lab</p>
            <p className="text-xs text-muted-foreground mt-1">Lab prep checklist + AR camera scan in one flow.</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-muted/20">
            <p className="text-sm font-semibold text-foreground">Progress</p>
            <p className="text-xs text-muted-foreground mt-1">Track scores, unlocked subjects, and finished labs.</p>
          </div>
        </div>
      </div>
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Unlock Subjects</p>
            <p className="text-sm text-muted-foreground mt-1">Enter teacher access code here directly from Home.</p>
          </div>
          <KeyRound size={18} className="text-primary shrink-0" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={accessCode}
            onChange={(e) => {
              setAccessCode(e.target.value)
              setUnlockMessage(null)
            }}
            placeholder="e.g. UNLOCK2"
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => {
              const result = applyAccessCode(accessCode)
              if (result.invalid) {
                setUnlockMessage('Invalid code. Ask your teacher for the correct one.')
              } else {
                setUnlockMessage(`Unlocked: ${result.unlocked.join(', ')}`)
              }
              setAccessCode('')
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Unlock
          </button>
        </div>
        {unlockMessage && (
          <p className={cn('mt-3 text-sm', unlockMessage.startsWith('Unlocked') ? 'text-primary' : 'text-destructive')}>
            {unlockMessage}
          </p>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Subjects</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUBJECTS.map((subject) => {
            const isUnlocked = unlocked[subject.id]
            const s = SUBJECT_STYLES[subject.id]
            return (
              <motion.div key={subject.id} whileHover={isUnlocked ? { scale: 1.01, y: -2 } : {}}
                className={cn('relative rounded-2xl border p-5 overflow-hidden transition-all', isUnlocked ? `bg-card cursor-pointer ${s.border}` : 'bg-muted/30 border-border cursor-not-allowed')}
                onClick={() => isUnlocked && setScreen('learn')}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={cn('text-xs font-semibold uppercase tracking-wide', isUnlocked ? s.text : 'text-muted-foreground')}>{subject.shortName}</p>
                    <p className="font-bold text-foreground mt-0.5">{subject.name}</p>
                  </div>
                  {isUnlocked ? <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', s.badge)}>Unlocked</span> : <Lock size={16} className="text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{subject.topics.length} topics</span>
                  <span className="text-xs text-muted-foreground">• {teacherLessonCountBySubject[subject.id]} teacher lessons</span>
                  <span className="text-xs text-muted-foreground">• {teacherQuizCountBySubject[subject.id]} teacher quizzes</span>
                  {isUnlocked && <ChevronRight size={14} className="text-muted-foreground ml-auto" />}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function LearnScreen() {
  const { unlocked, setScreen, setActiveQuizSubject, setActiveLesson, setActiveLabExperiment } = useAppStore()

  const data = storage.getAll()
  const teacherLessons = data.lessons
  const teacherQuizzes = data.quizzes
  const mergedLessons: Lesson[] = [
    ...LESSONS,
    ...teacherLessons.map(mapTeacherLessonToLesson),
  ]
  const lessonCountBySubject: Record<SubjectKey, number> = {
    physics: mergedLessons.filter((l) => l.subject === 'physics').length,
    biology: mergedLessons.filter((l) => l.subject === 'biology').length,
    chemistry: mergedLessons.filter((l) => l.subject === 'chemistry').length,
    earth: mergedLessons.filter((l) => l.subject === 'earth').length,
  }
  const quizCountBySubject: Record<SubjectKey, number> = {
    physics: teacherQuizzes.filter((q) => q.subject === 'physics').length,
    biology: teacherQuizzes.filter((q) => q.subject === 'biology').length,
    chemistry: teacherQuizzes.filter((q) => q.subject === 'chemistry').length,
    earth: teacherQuizzes.filter((q) => q.subject === 'earth').length,
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-8">
      <BackNav onClick={() => setScreen('home')} label="Back to Home" />
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">Learn</h2>
        <p className="text-sm text-muted-foreground">Read lessons, run an AR Lab, then practice with quizzes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">AR Lessons</p>
            <p className="text-sm text-muted-foreground">2D steps + a guided AR Lab run.</p>
          </div>

          <div className="space-y-3">
            {mergedLessons.map((lesson) => {
              const isUnlocked = unlocked[lesson.subject]
              const s = SUBJECT_STYLES[lesson.subject]
              return (
                <div
                  key={lesson.id}
                  className={cn('rounded-2xl border p-4 bg-card', isUnlocked ? s.border : 'border-border/60 opacity-60')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{lesson.summary}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize', s.badge)}>
                      {lesson.subject}
                    </span>
                  </div>

                  <ol className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {lesson.steps.map((step) => (
                      <li key={step}>- {step}</li>
                    ))}
                  </ol>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      disabled={!isUnlocked}
                      onClick={() => {
                        setActiveLesson(lesson.id, lesson.arPayload)
                        setActiveLabExperiment(lesson.labExperimentId ?? null)
                        setScreen('arlab')
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                        isUnlocked ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed'
                      )}
                    >
                      Start AR Lab
                    </button>
                    <button
                      disabled={!isUnlocked}
                      onClick={() => {
                        setActiveQuizSubject(lesson.subject)
                        setScreen('quiz')
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-muted transition-colors',
                        isUnlocked ? 'border-border' : 'border-border/60 text-muted-foreground cursor-not-allowed'
                      )}
                    >
                      Practice Quiz
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Practice Quizzes</p>
            <p className="text-sm text-muted-foreground">Quick checks to unlock more content.</p>
          </div>

          {SUBJECTS.map((subject) => {
            const isUnlocked = unlocked[subject.id]
            const s = SUBJECT_STYLES[subject.id]
            return (
              <div key={subject.id} className={cn('rounded-2xl border overflow-hidden', isUnlocked ? s.border : 'border-border opacity-60')}>
                <div className={cn('px-5 py-4 flex items-center justify-between', isUnlocked ? s.bg : 'bg-muted/20')}>
                  <div>
                    <p className={cn('font-bold text-base', isUnlocked ? s.text : 'text-muted-foreground')}>{subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {subject.topics.length} topics • {lessonCountBySubject[subject.id]} lessons • {quizCountBySubject[subject.id]} teacher quizzes
                    </p>
                  </div>
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        setActiveQuizSubject(subject.id)
                        setScreen('quiz')
                      }}
                      className={cn('px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all', s.badge)}
                    >
                      Start Quiz
                    </button>
                  ) : (
                    <Lock size={16} className="text-muted-foreground" />
                  )}
                </div>
                <div className="p-3 space-y-1.5 bg-card">
                  {subject.topics.slice(0, 3).map((topic, idx) => (
                    <div key={topic.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                      <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{topic.icon} {topic.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto hidden sm:block">{topic.subtitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function QuizScreen() {
  const {
    activeQuizSubject,
    initQuiz,
    quizQuestions,
    quizIndex,
    submitAnswer,
    nextQuestion,
    quizScore,
    useHint,
    quizHintsUsed,
    resetQuiz,
    currentStudentId,
    unlockSubject,
    setScreen,
  } = useAppStore()

  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [runningSubject, setRunningSubject] = useState<SubjectKey | null>(null)
  const [runningQuizId, setRunningQuizId] = useState<string | null>(null)
  const [runningQuizIsLastInSubject, setRunningQuizIsLastInSubject] = useState(false)
  const [finalScorePct, setFinalScorePct] = useState<number>(0)

  const data = storage.getAll()
  const teacherQuizzes = data.quizzes
  const studentRecord = currentStudentId ? data.students.find((s) => s.studentId === currentStudentId) : null
  const completedQuizIds = new Set(studentRecord?.completedQuizIds ?? [])

  type QuizListItem = {
    id: string
    title: string
    subject: SubjectKey
    topicId: string
    topicName: string
    questions: any[]
    sequence: number
    totalInSubject: number
    prevQuizId: string | null
  }

  const subject: SubjectKey | null = activeQuizSubject ?? null
  const subjectData = subject ? SUBJECTS.find((s) => s.id === subject) : null
  const topics = subjectData?.topics ?? []

  const quizItemsByTopic: { topicId: string; topicName: string; quizzes: QuizListItem[] }[] = []
  if (subject) {
    for (const topic of topics) {
      const topicTeacherQuizzes = teacherQuizzes
        .filter((q) => q.subject === subject && (q.topicId ?? topics[0]?.id) === topic.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      const builtInQuestions = QUIZ_QUESTIONS.filter((q) => q.subject === subject && q.topicId === topic.id)
      const hasTeacherQuizzes = topicTeacherQuizzes.length > 0

      const quizForThisTopic: QuizListItem[] = hasTeacherQuizzes
        ? topicTeacherQuizzes.map((q) => {
            return {
              id: q.id,
              title: q.title,
              subject,
              topicId: topic.id,
              topicName: topic.name,
              questions: q.questions,
              sequence: 0,
              totalInSubject: 0,
              prevQuizId: null,
            }
          })
        : builtInQuestions.length > 0
          ? [
              {
                id: `builtin-${subject}-${topic.id}`,
                title: `${topic.name} — Built-in Quiz`,
                subject,
                topicId: topic.id,
                topicName: topic.name,
                questions: builtInQuestions,
                sequence: 0,
                totalInSubject: 0,
                prevQuizId: null,
              },
            ]
          : []

      quizItemsByTopic.push({ topicId: topic.id, topicName: topic.name, quizzes: quizForThisTopic })
    }

    // Fill sequence/prev/total based on flattened list.
    const flat = quizItemsByTopic.flatMap((g) => g.quizzes)
    const totalInSubject = flat.length
    for (let i = 0; i < flat.length; i++) {
      flat[i].sequence = i + 1
      flat[i].totalInSubject = totalInSubject
      flat[i].prevQuizId = i > 0 ? flat[i - 1].id : null
    }
  }

  const allQuizItems: QuizListItem[] = quizItemsByTopic.flatMap((g) => g.quizzes)

  const question = quizQuestions[quizIndex]
  const inQuiz = quizQuestions.length > 0
  const scoreSubject = runningSubject ?? activeQuizSubject ?? (((question as any)?.subject as SubjectKey | undefined) ?? null)

  const handleStartQuiz = (quizItem: QuizListItem) => {
    initQuiz(quizItem.questions)
    setRunningSubject(quizItem.subject)
    setRunningQuizId(quizItem.id)
    setRunningQuizIsLastInSubject(quizItem.sequence === quizItem.totalInSubject)
    setSelected(null)
    setShowResult(false)
  }

  const handleSubmitAnswer = () => {
    if (selected == null) return
    submitAnswer(selected)
    const isLastQuestion = quizIndex >= quizQuestions.length - 1

    if (isLastQuestion) {
      const pct = Math.round(((quizScore + (selected === question.correctIndex ? 1 : 0)) / quizQuestions.length) * 100)

      if (currentStudentId && scoreSubject) {
        storage.saveStudentScore(currentStudentId, scoreSubject, pct)
      }
      if (currentStudentId && runningQuizId) {
        storage.saveStudentQuizCompletion(currentStudentId, runningQuizId)
      }

      // Only unlock the next subject after the FINAL quiz in the subject sequence.
      if (scoreSubject && runningQuizIsLastInSubject) {
        const idx = SUBJECT_ORDER.indexOf(scoreSubject)
        const nextSubject = SUBJECT_ORDER[idx + 1]
        if (nextSubject) unlockSubject(nextSubject)
      }

      setFinalScorePct(pct)
      setShowResult(true)
      return
    }

    nextQuestion()
    setSelected(null)
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      {!inQuiz && <BackNav onClick={() => setScreen('learn')} label="Back to Learn" />}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Zap size={20} className="text-subject-biology" /> Quizzes</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Module-by-module practice</p>
      </div>

      {!inQuiz && allQuizItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Trophy size={24} className="text-muted-foreground" /></div>
          <p className="font-semibold text-foreground mb-1">No quizzes available</p>
          <p className="text-sm text-muted-foreground">Your teacher has not created any module quizzes yet.</p>
        </div>
      ) : !inQuiz ? (
        <div className="space-y-4">
          {quizItemsByTopic.map((group, idx) => {
            const topicStyle = SUBJECT_STYLES[subject as SubjectKey]
            const topicQuizzes = group.quizzes
            if (topicQuizzes.length === 0) return null

            return (
              <div key={group.topicId} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Module {idx + 1}</p>
                    <p className="text-lg font-bold text-foreground truncate">{group.topicName}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize shrink-0">
                    {topicQuizzes.length} quiz{topicQuizzes.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {topicQuizzes.map((quiz) => {
                    const isCompleted = completedQuizIds.has(quiz.id)
                    const isUnlocked = quiz.prevQuizId == null || completedQuizIds.has(quiz.prevQuizId)
                    return (
                      <motion.button
                        key={quiz.id}
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                        disabled={!isUnlocked}
                        onClick={() => handleStartQuiz(quiz)}
                        className={cn(
                          'w-full bg-card rounded-2xl border p-4 flex items-center gap-4 transition-all text-left',
                          isUnlocked ? 'border-border hover:border-primary/30' : 'border-border/60 opacity-60 cursor-not-allowed'
                        )}
                      >
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', topicStyle.badge)}><Zap size={16} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{quiz.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{quiz.questions.length} questions</span>
                            <span className="text-xs text-muted-foreground">Quiz {quiz.sequence} of {quiz.totalInSubject}</span>
                            <span className={cn('text-xs font-semibold', isCompleted ? 'text-primary' : isUnlocked ? 'text-muted-foreground' : 'text-destructive')}>
                              {isCompleted ? 'Completed' : isUnlocked ? 'Open' : 'Locked'}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border p-5">
          {!showResult ? (
            <>
              <p className="text-xs text-muted-foreground mb-2">Question {quizIndex + 1} of {quizQuestions.length}</p>
              <h3 className="font-semibold text-foreground mb-4">{question.question}</h3>
              <div className="space-y-2">
                {question.options.map((opt: string, idx: number) => (
                  <button
                    key={opt}
                    onClick={() => setSelected(idx)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-xl border text-sm',
                      selected === idx ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                    )}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={handleSubmitAnswer} disabled={selected == null} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40">
                  Submit Answer
                </button>
                <button onClick={useHint} disabled={quizHintsUsed >= 3} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted disabled:opacity-40">
                  Use Hint ({3 - quizHintsUsed} left)
                </button>
              </div>
              {quizHintsUsed > 0 && question.hint && <p className="text-xs text-muted-foreground mt-3">Hint: {question.hint}</p>}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Quiz complete</p>
              <h3 className="text-xl font-bold text-foreground mt-1">Score: {finalScorePct}%</h3>
              <p className="text-xs text-muted-foreground mt-2">Saved to student progress. Next module can be opened after completion.</p>
              <button
                onClick={() => {
                  resetQuiz()
                  setRunningQuizId(null)
                  setRunningQuizIsLastInSubject(false)
                }}
                className="mt-4 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
              >
                Back to Quiz List
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

function ProgressScreen() {
  const { unlocked, currentStudentId, setScreen } = useAppStore()
  const all = storage.getAll()
  const student = currentStudentId ? all.students.find((s) => s.studentId === currentStudentId) : null

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <BackNav onClick={() => setScreen('home')} label="Back to Home" />
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy size={20} className="text-primary" /> Progress
        </h2>
        <p className="text-sm text-muted-foreground">Your report view: unlock status, quiz scores, and completed AR/Lab tasks.</p>
      </div>

      {!student ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-sm text-muted-foreground">
          No student record found. Please go back to <button className="underline text-foreground hover:text-primary" onClick={() => setScreen('home')}>Home</button>.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Lessons</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {Array.isArray(student.completedLessonIds) ? student.completedLessonIds.length : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Completed lesson sessions</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">AR Labs</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {Array.isArray(student.completedLabExperimentIds) ? student.completedLabExperimentIds.length : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Completed AR lab runs</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">Quiz Scores by Subject</p>
            <div className="space-y-2">
              {SUBJECT_ORDER.map((subject) => {
                const s = SUBJECT_STYLES[subject]
                const isUnlocked = unlocked[subject]
                const score = student.scores[subject]
                return (
                  <div key={subject} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2 py-0.5 rounded-full border text-[11px] font-semibold capitalize', s.badge)}>
                        {subject}
                      </span>
                      <span className="text-xs text-muted-foreground">{isUnlocked ? 'Unlocked' : 'Locked'}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{score == null ? '—' : `${score}%`}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-2">
            <button onClick={() => setScreen('learn')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Continue Learning
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function AppPage() {
  const { screen, theme, currentStudentId } = useAppStore()
  const navigate = useNavigate()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (!currentStudentId) navigate('/login')
  }, [currentStudentId, navigate])

  return (
    <div className={cn('flex min-h-dvh bg-surface text-foreground', theme)}>
      <StudentSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-30 md:hidden bg-surface/95 backdrop-blur border-b border-border px-4 py-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <AnimatePresence mode="wait">
            {screen === 'getstarted' && <GetStartedScreen key="getstarted" />}
            {screen === 'unlock'     && <UnlockScreen     key="unlock" />}
            {screen === 'home'       && <HomeScreen       key="home" />}
            {screen === 'learn'      && <LearnScreen     key="learn" />}
            {screen === 'topics'     && <LearnScreen     key="topics" />}
            {screen === 'lessons'    && <LearnScreen     key="lessons" />}
            {screen === 'arlab'      && <ARLabScreen     key="arlab" />}
            {screen === 'ar'         && <ARLabScreen     key="ar" />}
            {screen === 'quiz'       && <QuizScreen       key="quiz" />}
            {screen === 'progress'   && <ProgressScreen   key="progress" />}
            {screen === 'lab'        && <ARLabScreen     key="lab" />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
