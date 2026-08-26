import { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { useStorageData } from '../../../hooks/useStorageData'
import { useStudentRecord } from '../../../hooks/useStudentRecord'
import { ContentSkeleton } from '../../ui/skeleton'
import { cn } from '../../../lib/utils'
import { SUBJECT_STYLES } from '../../../lib/variants'
import { Trophy, ArrowLeft, BookOpen, ChevronRight, Brain, CheckCircle2, XCircle, RotateCcw, Clock, Lock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import type { QuizAttempt, SubjectKey, TeacherQuiz } from '../../../types'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { LESSONS } from '../../../data/lessons'
import { PRE_TEST_QUESTIONS, POST_TEST_QUESTIONS } from '../../../data/curriculum'
import { parseBuiltinId } from '../../../lib/quizId'

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology', 'physics']
const SCORE_BAR_TRANSITION = { duration: 0.7, ease: 'easeOut' } as const

function scoreColor(pct: number) {
  if (pct >= 80) return 'text-success'
  if (pct >= 50) return 'text-warning'
  return 'text-destructive'
}
function scoreBarColor(pct: number) {
  if (pct >= 80) return 'bg-success'
  if (pct >= 50) return 'bg-warning'
  return 'bg-destructive'
}

/** Resolve a quiz's display title and subject from teacher quizzes + built-in data */
function resolveQuiz(quizId: string, teacherQuizzes: TeacherQuiz[]): { title: string; subject: SubjectKey } {
  const tq = teacherQuizzes.find(q => q.id === quizId)
  if (tq) return { title: tq.title, subject: tq.subject }

  const { lessonId, phase } = parseBuiltinId(quizId)
  const lesson = lessonId ? LESSONS.find(l => l.id === lessonId) : null
  const suffix = phase === 'pre' ? 'Pre-Test' : 'Post-Test'
  if (lesson) return { title: `${lesson.title} — ${suffix}`, subject: lesson.subject }

  const phaseQuestions = phase === 'pre' ? PRE_TEST_QUESTIONS : POST_TEST_QUESTIONS
  const firstQ = phaseQuestions.find(q => q.lessonId === lessonId)
  return { title: `${(lessonId ?? quizId).toUpperCase()} ${suffix}`, subject: firstQ?.subject ?? 'chemistry' }
}

/** Get the ordered list of correct answer indices for a quiz */
function getCorrectAnswers(quizId: string, teacherQuizzes: TeacherQuiz[]): number[] | null {
  const tq = teacherQuizzes.find(q => q.id === quizId)
  if (tq) return tq.questions.map(q => q.correctIndex)

  const { lessonId, phase } = parseBuiltinId(quizId)
  const phaseQuestions = phase === 'pre' ? PRE_TEST_QUESTIONS : POST_TEST_QUESTIONS
  const qs = phaseQuestions.filter(q => q.lessonId === lessonId)
  if (qs.length) return qs.map(q => q.correctIndex)

  return null
}

function BackNav({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
      <ArrowLeft size={14} /> {label}
    </button>
  )
}

export function ProgressScreen() {
  const { unlocked, currentStudentId } = useAppStore(
    useShallow(s => ({ unlocked: s.unlocked, currentStudentId: s.currentStudentId }))
  )
  // Subscribe to quizzes/lessons only (not the full students collection)
  const { data: all, isLoading: sharedLoading } = useStorageData(false)

  // Subscribe to the current student's document via the shared listener
  // (de-duplicated across QuizScreen/LearnScreen/ProgressScreen).
  const { student, isLoading: studentLoading } = useStudentRecord(currentStudentId)

  const isLoading = sharedLoading || studentLoading
  const navigate = useNavigate()

  const teacherQuizzes = all.quizzes

  /** Group all attempts by quizId, compute best + latest + correct answers */
  const quizGroups = useMemo(() => {
    const groups: Record<string, {
      quizId: string
      title: string
      subject: SubjectKey
      correctAnswers: number[] | null
      attempts: QuizAttempt[]
      best: QuizAttempt
      latest: QuizAttempt
    }> = {}

    for (const attempt of student?.quizAttempts ?? []) {
      if (!groups[attempt.quizId]) {
        const { title, subject } = resolveQuiz(attempt.quizId, teacherQuizzes)
        const correctAnswers = getCorrectAnswers(attempt.quizId, teacherQuizzes)
        groups[attempt.quizId] = {
          quizId: attempt.quizId, title, subject, correctAnswers,
          attempts: [], best: attempt, latest: attempt,
        }
      }
      const g = groups[attempt.quizId]
      g.attempts.push(attempt)
      if (attempt.score > g.best.score) g.best = attempt
      if (attempt.timestamp > g.latest.timestamp) g.latest = attempt
    }
    return Object.values(groups)
  }, [student?.quizAttempts, teacherQuizzes])

  const bySubject = useMemo(() => {
    const map: Partial<Record<SubjectKey, typeof quizGroups>> = {}
    for (const g of quizGroups) {
      if (!map[g.subject]) map[g.subject] = []
      map[g.subject]!.push(g)
    }
    return map
  }, [quizGroups])

  const totalQuizzes     = quizGroups.length
  const avgScore         = totalQuizzes > 0
    ? Math.round(quizGroups.reduce((s, g) => s + g.best.score, 0) / totalQuizzes)
    : null
  const completedLessons = Array.isArray(student?.completedLessonIds) ? student!.completedLessonIds.length : 0

  const handleBack             = useCallback(() => navigate('/app/home'),  [navigate])
  const handleContinueLearning = useCallback(() => navigate('/app/learn'), [navigate])

  if (isLoading) return <ContentSkeleton />

  const avgScoreColor =
    avgScore == null ? 'text-muted-foreground' :
    avgScore >= 80    ? 'text-success' :
    avgScore >= 50    ? 'text-warning' :
                        'text-destructive'
  const avgScoreRing =
    avgScore == null ? 'stroke-muted-foreground/30' :
    avgScore >= 80    ? 'stroke-success' :
    avgScore >= 50    ? 'stroke-warning' :
                        'stroke-destructive'

  return (
    <div className="space-y-6 pb-10">
      <BackNav onClick={handleBack} label="Back to Home" />

      <div className="space-y-1">
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Trophy size={22} className="text-primary" /> Progress Report
        </h1>
        <p className="text-sm text-muted-foreground">Your scores across all lessons and tests.</p>
      </div>

      {!student ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No student record found.{' '}
          <Button variant="link" className="h-auto p-0 text-sm" onClick={handleBack}>Go back to Home</Button>.
        </Card>
      ) : (
        <div className="space-y-8">

          {/* ── Summary bento row: avg score is the headline tile ── */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Headline tile: Average Best Score — wide with ring visual, spans 4/6 */}
            <Card className="col-span-2 lg:col-span-4 p-6 flex items-center gap-6">
              <div className="relative shrink-0" style={{ width: 76, height: 76 }}>
                <svg width={76} height={76} className="-rotate-90">
                  <circle cx={38} cy={38} r={33} strokeWidth={6} className="stroke-muted" fill="none" />
                  {avgScore != null && (
                    <circle
                      cx={38} cy={38} r={33} strokeWidth={6} fill="none"
                      strokeDasharray={2 * Math.PI * 33}
                      strokeDashoffset={2 * Math.PI * 33 - (avgScore / 100) * 2 * Math.PI * 33}
                      strokeLinecap="round"
                      className={cn('transition-[stroke-dashoffset] duration-700 ease-out', avgScoreRing)}
                    />
                  )}
                </svg>
                <span className={cn('absolute inset-0 flex items-center justify-center text-base font-semibold tabular-nums', avgScoreColor)}>
                  {avgScore == null ? '—' : `${avgScore}%`}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Average Best Score</p>
                <p className="text-xs text-muted-foreground mt-1">Across {totalQuizzes} test{totalQuizzes !== 1 ? 's' : ''} attempted</p>
              </div>
            </Card>

            {/* Secondary stats: stacked narrow tile with internal divider, spans 2/6 */}
            <Card className="col-span-2 lg:col-span-2 p-0 overflow-hidden divide-y divide-border">
              <div className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-subject-biology/10 flex items-center justify-center text-subject-biology shrink-0">
                  <BookOpen size={15} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none tabular-nums">{completedLessons}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Lessons completed</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Brain size={15} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground leading-none tabular-nums">{totalQuizzes}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Tests taken</p>
                </div>
              </div>
            </Card>
          </div>

          {/* ─────────────────────────────────────────────── */}
          {/* SECTION 1: COMPLETED LESSONS */}
          {/* ─────────────────────────────────────────────── */}
          <div className="pt-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center text-success shrink-0">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Lessons Completed</h3>
                <p className="text-xs text-muted-foreground">Your finished lessons by subject</p>
              </div>
            </div>

            {/* ── Per-subject lessons & quiz status (completed only) — bento grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {SUBJECT_ORDER.map(subject => {
                const completedLessonIds = new Set(student?.completedLessonIds ?? [])
                const lessons = LESSONS.filter(l => l.subject === subject && completedLessonIds.has(l.id))
                if (!lessons.length) return null

                const ss = SUBJECT_STYLES[subject]
                return (
                  <div key={`lessons-${subject}`} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', ss.dot)} />
                        <Badge variant="outline" className={ss.badge}>
                          {ss.label} Completed
                        </Badge>
                        <span className="text-xs text-muted-foreground">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <Card className="overflow-hidden divide-y divide-border">
                      {lessons.map(lesson => {
                        const quizId = `builtin-${lesson.id}`
                        const hasQuizAttempt = student?.quizAttempts?.some(a => a.quizId === quizId)
                        const isQuizUnlocked = student?.unlockedQuizIds?.includes(quizId)
                        const isQuizCompleted = student?.completedQuizIds?.includes(quizId)

                        return (
                          <div key={lesson.id} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 size={14} className="text-success shrink-0" />
                                  <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Week {lesson.week} · {lesson.summary.substring(0, 50)}...</p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border/50 ml-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-muted-foreground">Test Status:</span>
                                <div className="flex items-center gap-2">
                                  {!isQuizUnlocked && !hasQuizAttempt && (
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-warning bg-warning/10 px-2 py-1 rounded-full border border-warning/20">
                                      <Lock size={10} /> Locked (No Code)
                                    </span>
                                  )}
                                  {isQuizUnlocked && !isQuizCompleted && (
                                    <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                                      ✓ Unlocked - Ready
                                    </span>
                                  )}
                                  {isQuizCompleted && (
                                    <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                                      ✓ Attempted
                                    </span>
                                  )}
                                  {hasQuizAttempt && isQuizCompleted && (
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                      {student?.quizAttempts?.filter(a => a.quizId === quizId).length || 0} attempt(s)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────── */}
          {/* SECTION 2: QUIZ ATTEMPTS & SCORES */}
          {/* ─────────────────────────────────────────────── */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-3 mb-5 mt-6">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Brain size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Test Attempts & Scores</h3>
                <p className="text-xs text-muted-foreground">Your test performance by subject</p>
              </div>
            </div>

            {/* ── Per-subject quiz attempts breakdown — bento grid ── */}
            {totalQuizzes === 0 ? (
              <Card className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Brain size={20} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">No test attempts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Take a Pre-Test or complete a lesson to unlock your first Post-Test.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {SUBJECT_ORDER.map(subject => {
                  const groups = bySubject[subject]
                  if (!groups?.length) return null
                  const ss = SUBJECT_STYLES[subject]
                  const subjectAvg = Math.round(groups.reduce((s, g) => s + g.best.score, 0) / groups.length)

                  return (
                    <div key={subject} className="space-y-2">
                      {/* Subject header row */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full shrink-0', ss.dot)} />
                          <Badge variant="outline" className={ss.badge}>
                            {ss.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{groups.length} test{groups.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!unlocked[subject] && (
                            <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">Locked</span>
                          )}
                          <span className={cn('text-sm font-semibold', scoreColor(subjectAvg))}>Avg {subjectAvg}%</span>
                        </div>
                      </div>

                      {/* Quiz rows */}
                      <Card className="overflow-hidden divide-y divide-border">
                        {groups.map(g => {
                          const pct     = g.best.score
                          const correct = g.best.correctAnswers
                          const total   = g.best.totalQuestions
                          const retakes = g.attempts.length - 1
                          const studentAnswers  = g.best.answers ?? []
                          const correctAnswerIdx = g.correctAnswers

                          return (
                            <div key={g.quizId} className="p-4 space-y-3">
                              {/* Title + score */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground leading-snug">{g.title}</p>
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Clock size={11} />
                                      {format(parseISO(g.latest.timestamp), 'MMM d, yyyy')}
                                    </span>
                                    {retakes > 0 && (
                                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <RotateCcw size={11} />
                                        {retakes} retake{retakes > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className={cn('text-2xl font-semibold leading-none tabular-nums', scoreColor(pct))}>{pct}%</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{correct}/{total} correct</p>
                                </div>
                              </div>

                              {/* Score bar */}
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className={cn('h-full rounded-full', scoreBarColor(pct))}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={SCORE_BAR_TRANSITION}
                                />
                              </div>

                              {/* Per-question dots (only if we have correct answers to compare) */}
                              {correctAnswerIdx && studentAnswers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {studentAnswers.map((studentAns, qi) => {
                                    const isCorrect = correctAnswerIdx[qi] !== undefined
                                      ? studentAns === correctAnswerIdx[qi]
                                      : null
                                    return (
                                      <div
                                        key={qi}
                                        title={`Q${qi + 1}: ${isCorrect === true ? 'Correct' : isCorrect === false ? 'Incorrect' : 'Unknown'}`}
                                        className={cn(
                                          'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold border',
                                          isCorrect === true
                                            ? 'bg-success/10 border-success/30 text-success'
                                            : isCorrect === false
                                              ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                              : 'bg-muted border-border text-muted-foreground'
                                        )}
                                      >
                                        {isCorrect === true
                                          ? <CheckCircle2 size={12} />
                                          : isCorrect === false
                                            ? <XCircle size={12} />
                                            : qi + 1
                                        }
                                      </div>
                                    )
                                  })}
                                  <span className="self-center text-[10px] text-muted-foreground ml-1">per question (best attempt)</span>
                                </div>
                              )}

                              {/* All attempts breakdown (if > 1 attempt) */}
                              {g.attempts.length > 1 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border">
                                  <span className="text-[10px] text-muted-foreground">All attempts:</span>
                                  {[...g.attempts]
                                    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                                    .map((att, i) => (
                                      <span key={att.id} className={cn(
                                        'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                                        att.id === g.best.id
                                          ? 'border-success/30 bg-success/10 text-success'
                                          : 'border-border bg-muted text-muted-foreground'
                                      )}>
                                        #{i + 1} · {att.correctAnswers}/{att.totalQuestions} · {att.score}%
                                        {att.id === g.best.id ? ' ★' : ''}
                                      </span>
                                    ))
                                  }
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button onClick={handleContinueLearning} className="gap-2">
              Continue Learning <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
