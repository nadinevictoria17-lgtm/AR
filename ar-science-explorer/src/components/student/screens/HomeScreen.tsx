import { useState, useMemo, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { useStorageData } from '../../../hooks/useStorageData'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'
import { cn } from '../../../lib/utils'
import { LESSONS } from '../../../data/lessons'
import { Trophy, KeyRound, ArrowRight, CheckCircle2, ClipboardCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { ContentSkeleton } from '../../ui/skeleton'
import { ProgressRing } from '../../ui/ProgressRing'

export function HomeScreen() {
  const { currentStudentId, applyAccessCode, setActiveLesson } = useAppStore(
    useShallow(s => ({
      currentStudentId: s.currentStudentId,
      applyAccessCode: s.applyAccessCode,
      setActiveLesson: s.setActiveLesson,
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
    const percent = Math.round((completed / total) * 100)
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
      .slice(0, 3)
  }, [student])

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

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <ProgressRing percent={stats.percent} className="shrink-0" />
          <div>
            <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20">
              Quarter {currentProgress.quarter} · Week {currentProgress.week}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {student
                ? `Hi, ${student.name ? student.name.split(' ')[0] : `Student ${student.studentId}`}`
                : 'Welcome back'
              }
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {stats.percent}% of the science curriculum complete.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => navigate('/app/progress')}>
          <Trophy size={16} className="mr-2 text-primary" />
          Full Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main left content */}
        <div className="lg:col-span-8 space-y-6">
          <Card
            className="p-6 md:p-8 cursor-pointer transition-colors hover:border-primary/40"
            onClick={handleStartNext}
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Continue where you left off
            </p>
            <h2 className="text-xl md:text-2xl font-bold leading-tight text-foreground">{nextLesson.title}</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-md line-clamp-2">{nextLesson.summary}</p>
            <div className="pt-4">
              <Button className="gap-2">
                Start Lesson <ArrowRight size={16} />
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-subject-biology/10 flex items-center justify-center text-subject-biology">
                  <CheckCircle2 size={18} />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Lessons Done</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-subject-chemistry/10 flex items-center justify-center text-subject-chemistry">
                  <ClipboardCheck size={18} />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Tests Taken</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{student?.completedQuizIds.length || 0}</p>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
              <Trophy size={16} className="text-primary" /> Recent Scores
            </h3>
            <div className="space-y-2">
              {recentAttempts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No recent attempts yet.</p>
              ) : (
                recentAttempts.map((attempt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-xs font-medium text-foreground">Test Result</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(attempt.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      attempt.score >= 80 ? "text-success" : attempt.score >= 50 ? "text-warning" : "text-destructive"
                    )}>
                      {attempt.score}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-tight">Unlock Content</h3>
                <p className="text-[11px] text-muted-foreground">Enter code from teacher</p>
              </div>
            </div>
            <div className="space-y-3">
              <Input
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase())
                }}
                placeholder="e.g. UNLOCK-Q1W1"
                className="font-mono tracking-widest"
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
              >
                {isApplyingCode ? 'Applying...' : 'Apply Code'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
