import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Home, Zap, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
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
  quizTitle = 'Test',
}: QuizResultsViewProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const passThreshold = 50

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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto py-12 px-4"
    >
      {/* Result Text */}
      <div className="text-center mb-7">
        <h1 className="text-2xl font-semibold tracking-tight mb-1.5 text-foreground">
          {passed ? 'Excellent!' : 'Keep Trying!'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {quizTitle} — {passed ? 'You passed this test!' : 'Review and try again.'}
        </p>
      </div>

      {/* Score Card: focal score + breakdown side-by-side on sm+ */}
      <Card className="p-6 md:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-8">
          {/* Focal score */}
          <div className="flex items-center gap-5 sm:shrink-0">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center shrink-0',
                passed ? 'bg-success/10' : 'bg-warning/10'
              )}
            >
              {passed ? (
                <Trophy size={30} className="text-success" />
              ) : (
                <Zap size={30} className="text-warning" />
              )}
            </motion.div>
            <div>
              <div className="text-5xl font-semibold text-foreground tabular-nums tracking-tight leading-none">
                {percentage}%
              </div>
              <p className="text-muted-foreground text-sm mt-2">
                {score} out of {totalQuestions} correct
              </p>
            </div>
          </div>

          {/* Breakdown panel */}
          <div className="flex-1 sm:pl-8 sm:border-l border-border">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Correct</div>
                <div className="font-semibold text-success tabular-nums text-lg">
                  {score}/{totalQuestions}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Hints Used</div>
                <div className="font-semibold text-foreground tabular-nums text-lg">{hintsUsed}/3</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Pass Mark</div>
                <div className="font-semibold text-foreground tabular-nums text-lg">{passThreshold}%</div>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant={passed ? 'success' : 'warning'} size="md" className="gap-1">
                {passed ? <CheckCircle2 size={12} /> : <Zap size={12} />}
                {passed ? 'Passed' : 'Not Yet Passed'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Achievement Badge */}
      {passed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg text-center"
        >
          <Badge variant="success" size="md" className="mb-2 gap-1">
            <CheckCircle2 size={12} />
            Quiz Completed
          </Badge>
          <p className="text-xs text-success">
            Great job! You&apos;ve unlocked the next section.
          </p>
        </motion.div>
      )}

      {/* Retake hint when failed */}
      {!passed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3"
        >
          <KeyRound size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning leading-relaxed">
            Want to retake? Ask your teacher for an unlock code, then tap the quiz again to enter it.
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="max-w-sm mx-auto space-y-3">
        {isRedirecting ? (
          <Button disabled size="lg" className="w-full">
            <Loader2 size={17} className="mr-1.5 animate-spin" />
            Going to Progress…
          </Button>
        ) : (
          <Button onClick={onHome} size="lg" className="w-full">
            <Home size={17} className="mr-1.5" />
            View My Progress
          </Button>
        )}
      </div>

      {/* Note for Last Quiz */}
      {isLastQuiz && passed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-muted-foreground text-center mt-6"
        >
          You&apos;ve completed all quizzes in this section!
        </motion.p>
      )}
    </motion.div>
  )
}
