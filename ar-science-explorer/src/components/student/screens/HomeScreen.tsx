import { useState, useMemo, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { motion } from 'framer-motion'
import { useAppStore } from '../../../store/useAppStore'
import { useStorageData } from '../../../hooks/useStorageData'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'
import { cn } from '../../../lib/utils'
import { LESSONS } from '../../../data/lessons'
import { KeyRound, ArrowRight, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { ContentSkeleton } from '../../ui/skeleton'
import { SUBJECT_STYLES } from '../../../lib/variants'
import type { SubjectKey } from '../../../types'

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology', 'physics']

/**
 * Orbital progress instrument — the app's one signature element. A slow
 * background orbit ring (electron path) sits behind the actual progress arc,
 * used exactly once per screen so it reads as a mark, not decoration.
 */
function OrbitalProgress({ percent, size = 88 }: { percent: number; size?: number }) {
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* orbital path — thin, offset, slow-drifting */}
      <svg width={size} height={size} className="absolute inset-0 animate-[spin_18s_linear_infinite]">
        <ellipse
          cx={size / 2} cy={size / 2} rx={r + 6} ry={r - 6}
          strokeWidth={1} className="stroke-primary/25" fill="none"
        />
      </svg>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-background/12" fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none"
          strokeLinecap="round" className="stroke-primary"
          style={{ strokeDasharray: c }}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center readout text-base font-medium text-background">
        {percent}%
      </span>
    </div>
  )
}

/** A single instrument readout — the number IS the content, not a caption under a card. */
function Readout({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <div>
      <p className={cn('readout text-[32px] leading-none font-medium', accent ?? 'text-foreground')}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-2">{label}</p>
    </div>
  )
}

export function HomeScreen() {
  const { currentStudentId, applyAccessCode, setActiveLesson, unlocked } = useAppStore(
    useShallow(s => ({
      currentStudentId: s.currentStudentId,
      applyAccessCode: s.applyAccessCode,
      setActiveLesson: s.setActiveLesson,
      unlocked: s.unlocked,
    }))
  )
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [isApplyingCode, setIsApplyingCode] = useState(false)

  const { data, isLoading } = useStorageData(true)
  const showSkeleton = useDeferredLoading(isLoading)
  const student = useMemo(() =>
    currentStudentId ? data.students.find(s => s.studentId === currentStudentId) : null
  , [data.students, currentStudentId])

  const nextLesson = useMemo(() => {
    if (!student) return LESSONS[0]
    return LESSONS.find(l => !student.completedLessonIds.includes(l.id)) || LESSONS[0]
  }, [student])

  const stats = useMemo(() => {
    const total = LESSONS.length
    const completed = student?.completedLessonIds.length || 0
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, percent }
  }, [student])

  const currentProgress = useMemo(() => {
    const uncompleted = LESSONS.find(l => !student?.completedLessonIds.includes(l.id)) || LESSONS[0]
    return { quarter: uncompleted.quarter, week: uncompleted.week }
  }, [student])

  const recentAttempts = useMemo(() => {
    if (!student?.quizAttempts) return []
    return [...student.quizAttempts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
  }, [student])

  const subjectProgress = useMemo(() => {
    return SUBJECT_ORDER.map((subject) => {
      const subjectLessons = LESSONS.filter(l => l.subject === subject)
      const completed = subjectLessons.filter(l => student?.completedLessonIds.includes(l.id)).length
      const pct = subjectLessons.length > 0 ? Math.round((completed / subjectLessons.length) * 100) : 0
      return { subject, completed, total: subjectLessons.length, pct, isUnlocked: unlocked[subject] }
    })
  }, [student, unlocked])

  const handleStartNext = useCallback(() => {
    const next = LESSONS.find(l => !student?.completedLessonIds.includes(l.id))
    if (next) {
      setActiveLesson(next.id)
      navigate(`/app/arlab?lessonId=${next.id}`)
    } else {
      navigate('/app/learn')
    }
  }, [student, setActiveLesson, navigate])

  if (showSkeleton) return <ContentSkeleton />

  const firstName = student?.name ? student.name.split(' ')[0] : student ? `Student ${student.studentId}` : 'there'

  return (
    <div className="pb-10">
      {/* ── Instrument header: the orbital progress readout as the opening thesis ── */}
      <button
        onClick={handleStartNext}
        className="dot-grid w-full text-left relative overflow-hidden rounded-lg border border-border bg-foreground text-background p-6 md:p-8 mb-px transition-colors duration-150 hover:border-muted-foreground/40"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <OrbitalProgress percent={stats.percent} />
          <div className="flex-1 min-w-0">
            <p className="readout text-[11px] text-background/50 mb-1.5 uppercase tracking-wide">
              Q{currentProgress.quarter}·W{currentProgress.week} — {firstName}
            </p>
            <h1 className="text-xl md:text-2xl font-medium leading-tight mb-1.5">
              Next: <span className="text-primary">{nextLesson.title}</span>
            </h1>
            <p className="text-background/50 text-[13px] max-w-lg line-clamp-1">{nextLesson.summary}</p>
          </div>
          <span className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shrink-0">
            Start <ArrowRight size={15} />
          </span>
        </div>
      </button>

      {/* ── Specimen rail: subjects as labeled instrument panels ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border mb-5">
        {subjectProgress.map(({ subject, completed, total, pct, isUnlocked }) => {
          const s = SUBJECT_STYLES[subject]
          return (
            <button
              key={subject}
              onClick={() => navigate('/app/learn')}
              className={cn(
                'specimen-card text-left p-5 bg-card transition-colors duration-150 hover:bg-muted/30',
                s.stripe,
                !isUnlocked && 'opacity-45'
              )}
            >
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[13px] font-medium text-foreground capitalize">{s.label}</p>
                <span className={cn('readout text-xs', s.text)}>{pct}%</span>
              </div>
              <div className="h-[3px] w-full bg-muted overflow-hidden mb-2.5">
                <div className={cn('h-full', s.bar)} style={{ width: `${pct}%` }} />
              </div>
              <p className="readout text-[11px] text-muted-foreground">{completed}/{total} lessons</p>
            </button>
          )
        })}
      </div>

      {/* ── Readout strip + unlock instrument ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border">
        {/* Wide readout panel: recent scores as raw data, not cards */}
        <div className="lg:col-span-2 bg-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
              <Trophy size={13} className="text-primary" /> Recent scores
            </h3>
            <Button variant="ghost-secondary" size="sm" onClick={() => navigate('/app/progress')} className="h-6 px-1.5 text-xs">
              All →
            </Button>
          </div>
          {recentAttempts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6">No attempts recorded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {recentAttempts.map((attempt, idx) => (
                <Readout
                  key={idx}
                  value={`${attempt.score}%`}
                  label={new Date(attempt.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  accent={attempt.score >= 80 ? 'text-success' : attempt.score >= 50 ? 'text-warning' : 'text-destructive'}
                />
              ))}
              <Readout value={stats.completed} label="Lessons done" />
            </div>
          )}
        </div>

        {/* Unlock instrument */}
        <div className="bg-card p-5">
          <div className="flex items-center gap-2 mb-3.5">
            <KeyRound size={14} className="text-primary shrink-0" />
            <h3 className="text-[13px] font-medium text-foreground">Unlock content</h3>
          </div>
          <div className="space-y-2">
            <Input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="ACCESS CODE"
              className="readout tracking-widest text-[13px]"
            />
            <Button
              onClick={async () => {
                if (!accessCode) return
                try {
                  setIsApplyingCode(true)
                  await applyAccessCode(accessCode)
                  setAccessCode('')
                } catch (error) {
                  console.error('[HomeScreen] Apply access code failed:', error)
                } finally {
                  setIsApplyingCode(false)
                }
              }}
              className="w-full"
              disabled={!accessCode || isApplyingCode}
              isLoading={isApplyingCode}
            >
              {isApplyingCode ? 'Applying' : 'Apply'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
