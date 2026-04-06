import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Home, Zap, Loader2, KeyRound } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface QuizResultsViewProps {
  score: number
  totalQuestions: number
  hintsUsed: number
  passed: boolean
  onHome: () => void
  isLastQuiz?: boolean
  quizTitle?: string
}

export function QuizResultsView({
  score,
  totalQuestions,
  hintsUsed,
  passed,
  onHome,
  isLastQuiz = false,
  quizTitle = 'Quiz',
}: QuizResultsViewProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const passThreshold = 70

  // Auto-redirect to Home after 4 seconds; clear both timers on unmount
  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout>
    const outer = setTimeout(() => {
      setIsRedirecting(true)
      redirectTimer = setTimeout(() => onHome(), 800)
    }, 4000)
    return () => {
      clearTimeout(outer)
      clearTimeout(redirectTimer)
    }
  }, [onHome])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto py-12 px-4"
    >
      {/* Trophy/Medal Animation */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex justify-center mb-8"
      >
        <div
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center',
            passed ? 'bg-success/15' : 'bg-warning/15'
          )}
        >
          {passed ? (
            <Trophy size={48} className="text-success" />
          ) : (
            <Zap size={48} className="text-warning" />
          )}
        </div>
      </motion.div>

      {/* Result Text */}
      <div className="text-center mb-8">
        <h1
          className={cn(
            'text-3xl font-black mb-2',
            passed ? 'text-success' : 'text-warning'
          )}
        >
          {passed ? 'Excellent!' : 'Keep Trying!'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {quizTitle} — {passed ? 'You passed this quiz!' : 'Review and try again.'}
        </p>
      </div>

      {/* Score Card */}
      <Card className="p-8 mb-8 text-center border-border">
        <div className="mb-6">
          <div className="text-5xl font-black mb-2 text-foreground">
            {percentage}%
          </div>
          <p className="text-muted-foreground text-sm">
            {score} out of {totalQuestions} correct
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3 pt-6 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Correct Answers</span>
            <span className="font-semibold text-success">
              {score}/{totalQuestions}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Hints Used</span>
            <span className="font-semibold">{hintsUsed}/3</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pass Threshold</span>
            <span className="font-semibold">{passThreshold}%</span>
          </div>
        </div>
      </Card>

      {/* Achievement Badge */}
      {passed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 p-4 bg-success/10 border border-success/20 rounded-xl text-center"
        >
          <Badge variant="success" size="md" className="mb-2">
            ✓ Quiz Completed
          </Badge>
          <p className="text-xs text-success">
            Great job! You've unlocked the next section.
          </p>
        </motion.div>
      )}

      {/* Retake hint when failed */}
      {!passed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-3"
        >
          <KeyRound size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning leading-relaxed">
            Want to retake? Ask your teacher for an unlock code, then tap the quiz again to enter it.
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {isRedirecting ? (
          <Button disabled className="w-full h-12 font-bold text-base">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Going to Progress…
          </Button>
        ) : (
          <Button
            onClick={onHome}
            className="w-full h-12 font-bold text-base"
          >
            <Home size={18} className="mr-2" />
            View My Progress
          </Button>
        )}
      </div>

      {/* Note for Last Quiz */}
      {isLastQuiz && passed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground text-center mt-6"
        >
          You've completed all quizzes in this section! 🎉
        </motion.p>
      )}
    </motion.div>
  )
}
