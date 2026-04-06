import { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { useStorageData } from '../../../hooks/useStorageData'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'
import { PageSkeleton } from '../../ui/skeleton'
import { cn } from '../../../lib/utils'
import { pageVariants, SUBJECT_STYLES } from '../../../lib/variants'
import { Trophy, ArrowLeft, BookOpen, ChevronRight, Brain, CheckCircle2, XCircle, RotateCcw, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import type { QuizAttempt, SubjectKey, TeacherQuiz } from '../../../types'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { LESSONS } from '../../../data/lessons'
import { QUIZ_QUESTIONS } from '../../../data/quiz'

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology']
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

  const lessonId = quizId.startsWith('builtin-') ? quizId.replace('builtin-', '') : quizId
  const lesson = LESSONS.find(l => l.id === lessonId)
  if (lesson) return { title: lesson.title, subject: lesson.subject }

  const firstQ = QUIZ_QUESTIONS.find(q => q.lessonId === lessonId)
  return { title: `${lessonId.toUpperCase()} Quiz`, subject: firstQ?.subject ?? 'chemistry' }
}

/** Get the ordered list of correct answer indices for a quiz */
function getCorrectAnswers(quizId: string, teacherQuizzes: TeacherQuiz[]): number[] | null {
  const tq = teacherQuizzes.find(q => q.id === quizId)
  if (tq) return tq.questions.map(q => q.correctIndex)

  const lessonId = quizId.startsWith('builtin-') ? quizId.replace('builtin-', '') : quizId
  const qs = QUIZ_QUESTIONS.filter(q => q.lessonId === lessonId)
  if (qs.length) return qs.map(q => q.correctIndex)

  return null
}

function StatCard({ icon: Icon, iconColor, label, value, sub }: {
  icon: React.ElementType; iconColor: string; label: string; value: string | number; sub?: string
}) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', iconColor)}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-black text-foreground leading-none">{value}</p>
        <p className="text-xs font-semibold text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

function BackNav({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
      <ArrowLeft size={14} /> {label}
    </button>
  )
}

export function ProgressScreen() {
  const { unlocked, currentStudentId, setScreen } = useAppStore(
    useShallow(s => ({ unlocked: s.unlocked, currentStudentId: s.currentStudentId, setScreen: s.setScreen }))
  )
  const { data: all, isLoading } = useStorageData(true)
  const showSkeleton = useDeferredLoading(isLoading)
  const navigate = useNavigate()

  const student = currentStudentId ? all.students.find(s => s.studentId === currentStudentId) : null
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

  const handleBack             = useCallback(() => { setScreen('home');  navigate('/app/home')  }, [setScreen, navigate])
  const handleContinueLearning = useCallback(() => { setScreen('learn'); navigate('/app/learn') }, [setScreen, navigate])

  if (showSkeleton) return <PageSkeleton />

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6 pb-10">
      <BackNav onClick={handleBack} label="Back to Home" />

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy size={20} className="text-primary" /> Progress Report
        </h2>
        <p className="text-sm text-muted-foreground">Your scores across all lessons and quizzes.</p>
      </div>

      {!student ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No student record found.{' '}
          <Button variant="link" className="h-auto p-0 text-sm" onClick={handleBack}>Go back to Home</Button>.
        </Card>
      ) : (
        <div className="space-y-6">

          {/* ── Summary stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard icon={BookOpen} iconColor="bg-subject-biology/10 text-subject-biology"
              label="Lessons Completed" value={completedLessons} sub="interactive sessions" />
            <StatCard icon={Brain} iconColor="bg-primary/10 text-primary"
              label="Quizzes Taken" value={totalQuizzes} sub="unique quizzes attempted" />
            <StatCard
              icon={Trophy}
              iconColor={
                avgScore == null             ? 'bg-muted text-muted-foreground' :
                avgScore >= 80               ? 'bg-success/10 text-success'     :
                avgScore >= 50               ? 'bg-warning/10 text-warning'     :
                                               'bg-destructive/10 text-destructive'
              }
              label="Average Best Score" value={avgScore == null ? '—' : `${avgScore}%`} sub="across all quizzes" />
          </div>

          {/* ── Per-subject quiz breakdown ── */}
          {totalQuizzes === 0 ? (
            <Card className="p-8 text-center">
              <div className="w-14 h-14 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Brain size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No quiz attempts yet</p>
              <p className="text-xs text-muted-foreground mt-1">Complete a lesson to unlock your first quiz.</p>
            </Card>
          ) : (
            SUBJECT_ORDER.map(subject => {
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
                      <span className={cn('text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', ss.badge)}>
                        {ss.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{groups.length} quiz{groups.length !== 1 ? 'zes' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!unlocked[subject] && (
                        <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">Locked</span>
                      )}
                      <span className={cn('text-sm font-black', scoreColor(subjectAvg))}>Avg {subjectAvg}%</span>
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
                              <p className={cn('text-2xl font-black leading-none', scoreColor(pct))}>{pct}%</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{correct}/{total} correct</p>
                            </div>
                          </div>

                          {/* Score bar */}
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
                                      'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border',
                                      isCorrect === true
                                        ? 'bg-success/10 border-success/30 text-success'
                                        : isCorrect === false
                                          ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                          : 'bg-muted border-border text-muted-foreground'
                                    )}
                                  >
                                    {isCorrect === true
                                      ? <CheckCircle2 size={13} />
                                      : isCorrect === false
                                        ? <XCircle size={13} />
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
                                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
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
            })
          )}

          <div className="pt-2">
            <Button onClick={handleContinueLearning} className="gap-2">
              Continue Learning <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
