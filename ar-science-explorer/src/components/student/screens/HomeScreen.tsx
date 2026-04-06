import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { useStorageData } from '../../../hooks/useStorageData'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'
import { cn } from '../../../lib/utils'
import { pageVariants } from '../../../lib/variants'
import { LESSONS } from '../../../data/lessons'
import { Trophy, KeyRound, ArrowRight, CheckCircle2, Star, Zap, GraduationCap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { ContentSkeleton } from '../../ui/skeleton'

export function HomeScreen() {
  const { setScreen, currentStudentId, applyAccessCode, setActiveLesson } = useAppStore(
    useShallow(s => ({
      setScreen:      s.setScreen,
      currentStudentId: s.currentStudentId,
      applyAccessCode: s.applyAccessCode,
      setActiveLesson: s.setActiveLesson,
    }))
  )
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null)
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
      setScreen('arlab')
      navigate(`/app/arlab?lessonId=${next.id}`)
    } else {
      setScreen('learn')
      navigate('/app/learn')
    }
  }, [student, setActiveLesson, setScreen, navigate])

  if (showSkeleton) return <ContentSkeleton />

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-8 pb-10"
    >
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-2 px-3 py-1 bg-primary/5 text-primary border-primary/20 rounded-full font-bold">
            Quarter {currentProgress.quarter} · Week {currentProgress.week}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            {student
              ? `Hello, ${student.name ? student.name.split(' ')[0] : `Student ${student.studentId}`}!`
              : 'Welcome back!'
            }
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            You're doing great! You've completed {stats.percent}% of your science journey.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/app/progress')} className="rounded-2xl border-border bg-card font-bold">
            <Trophy size={16} className="mr-2 text-primary" />
            Full Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Focus: Next Lesson */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative group cursor-pointer overflow-hidden rounded-[2.5rem] bg-foreground p-8 md:p-10 text-background shadow-2xl transition-all duration-500 hover:shadow-primary/20" onClick={handleStartNext}>
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/30 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/10 border border-background/20">
                  <Star size={14} className="text-primary fill-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-background/80">Recommended for you</span>
                </div>
                <h2 className="text-3xl font-black leading-tight">Next Up: <span className="text-primary">{nextLesson.title}</span></h2>
                <p className="text-background/60 text-sm max-w-md line-clamp-2">
                  {nextLesson.summary}
                </p>
                <div className="pt-2">
                  <Button className="rounded-2xl px-8 h-12 font-black text-sm gap-2 btn-glow bg-primary text-primary-foreground border-none">
                    Start Lesson <ArrowRight size={18} />
                  </Button>
                </div>
              </div>
              <div className="w-40 h-40 md:w-56 md:h-56 shrink-0 bg-background/5 rounded-[2rem] border border-background/10 flex items-center justify-center p-8 backdrop-blur-md">
                <GraduationCap size={80} className="text-background/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin-slow opacity-20" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Card className="p-6 rounded-[2rem] border-border bg-card hover:border-primary/30 transition-all group pointer-events-none">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-subject-biology/10 flex items-center justify-center text-subject-biology">
                    <CheckCircle2 size={24} />
                  </div>
                  <Zap size={20} className="text-muted-foreground/20 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-2xl font-black text-foreground">{stats.completed}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Lessons Done</p>
             </Card>
             <Card className="p-6 rounded-[2rem] border-border bg-card hover:border-primary/30 transition-all group pointer-events-none">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-subject-chemistry/10 flex items-center justify-center text-subject-chemistry">
                    <Star size={24} />
                  </div>
                  <Zap size={20} className="text-muted-foreground/20 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-2xl font-black text-foreground">{student?.completedQuizIds.length || 0}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Quizzes Passed</p>
             </Card>
          </div>
        </div>

        {/* Sidebar: Recent Activity & Access Codes */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 rounded-[2rem] border-border bg-card">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-primary" /> Recent Scores
            </h3>
            <div className="space-y-3">
              {recentAttempts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No recent attempts yet.</p>
              ) : (
                recentAttempts.map((attempt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50">
                    <div>
                      <p className="text-xs font-bold text-foreground">Quiz Result</p>
                      <p className="text-[10px] text-muted-foreground italic">{new Date(attempt.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span className={cn(
                      "text-sm font-black",
                      attempt.score >= 80 ? "text-success" : attempt.score >= 50 ? "text-warning" : "text-destructive"
                    )}>
                      {attempt.score}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6 rounded-[2rem] border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <KeyRound size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-foreground leading-tight">Unlock Content</h3>
                 <p className="text-[10px] text-muted-foreground">Enter code from teacher</p>
               </div>
            </div>
            <div className="space-y-3">
              <Input
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase())
                  setUnlockMessage(null)
                }}
                placeholder="e.g. UNLOCK-Q1W1"
                className="font-mono tracking-widest"
              />
              <Button
                onClick={async () => {
                  if (!accessCode) return
                  try {
                    setIsApplyingCode(true)
                    const result = await applyAccessCode(accessCode)
                    if (result.invalid) {
                      setUnlockMessage('Invalid code. Try again.')
                    } else {
                      setUnlockMessage(result.targetName ? `Unlocked: ${result.targetName}!` : 'Content unlocked successfully!')
                    }
                    setAccessCode('')
                  } catch (error) {
                    const message = error instanceof Error ? error.message : 'Failed to apply access code'
                    setUnlockMessage(`Error: ${message}`)
                    console.error('[HomeScreen] Apply access code failed:', error)
                  } finally {
                    setIsApplyingCode(false)
                  }
                }}
                className="w-full rounded-xl h-11 font-bold text-sm"
                disabled={!accessCode || isApplyingCode}
              >
                {isApplyingCode ? 'Applying...' : 'Apply Code'}
              </Button>
              {unlockMessage && (
                <p className={cn('text-center text-[10px] font-bold uppercase tracking-wider',
                  unlockMessage.toLowerCase().includes('unlocked') ? 'text-success' : 'text-destructive'
                )}>
                  {unlockMessage}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
