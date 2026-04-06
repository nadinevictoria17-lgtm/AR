import { motion } from 'framer-motion'
import { useAppStore } from '../../../store/useAppStore'
import { useStorageData } from '../../../hooks/useStorageData'
import { cn } from '../../../lib/utils'
import { Trophy, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { SubjectKey } from '../../../types'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

const SUBJECT_STYLES: Record<SubjectKey, { badge: string }> = {
  biology:   { badge: 'bg-subject-biology/15 text-subject-biology border-subject-biology/30' },
  chemistry: { badge: 'bg-subject-chemistry/15 text-subject-chemistry border-subject-chemistry/30' },
}

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology']

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

export function ProgressScreen() {
  const { unlocked, currentStudentId, setScreen } = useAppStore()
  const { data: all } = useStorageData(true)
  const navigate = useNavigate()
  const student = currentStudentId ? all.students.find((s) => s.studentId === currentStudentId) : null

  const handleBack = () => {
    setScreen('home')
    navigate('/app/home')
  }

  const handleContinueLearning = () => {
    setScreen('learn')
    navigate('/app/learn')
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <BackNav onClick={handleBack} label="Back to Home" />
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy size={20} className="text-primary" /> Progress Report
        </h2>
        <p className="text-sm text-muted-foreground">Track your journey through the Grade 7 Interactive Science curriculum.</p>
      </div>

      {!student ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-sm text-muted-foreground">
          No student record found. Please go back to <button className="underline text-foreground hover:text-primary" onClick={handleBack}>Home</button>.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Lessons Completed</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {Array.isArray(student.completedLessonIds) ? student.completedLessonIds.length : 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Interactive lesson sessions finished</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-3">Quiz Performance</p>
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
            <button onClick={handleContinueLearning} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Continue Learning
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
