import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Home, Zap, KeyRound, CheckCircle2, PartyPopper } from 'lucide-react'
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

const AUTO_CONTINUE_SECONDS = 4

export function QuizResultsView({
  score,
  totalQuestions,
  hintsUsed,
  passed,
  onHome,
  isLastQuiz = false,
  quizTitle = 'Test',
}: QuizResultsViewProps) {
  // P0 fix from the design critique: this used to force-redirect after 4s
  // regardless of pass/fail, removing agency at the worst possible moment.
  // Now: never auto-redirect on failure (the student should sit with the
  // result), and on success the countdown is visibly cancelable.
  const [secondsLeft, setSecondsLeft] = useState(passed ? AUTO_CONTINUE_SECONDS : 0)
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!passed || cancelledRef.current) return
    if (secondsLeft <= 0) {
      onHome()
      return
    }
    const timer = setTimeout(() => setSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [passed, secondsLeft, onHome])

  const cancelAutoContinue = () => {
    cancelledRef.current = true
    setSecondsLeft(-1)
  }

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
  const passThreshold = 50
  const isCountingDown = passed && secondsLeft > 0

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
            'text-2xl font-bold mb-2',
            passed ? 'text-success' : 'text-warning'
          )}
        >
          {passed ? 'Nice work!' : 'Not quite there yet'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {quizTitle} — {passed ? 'You passed this test!' : 'Review the lesson and try again.'}
        </p>
      </div>

      {/* Score Card */}
      <Card className="p-8 mb-8 text-center border-border">
        <div className="mb-6">
          <div className="text-4xl font-bold mb-2 text-foreground">
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
          className="mb-8 p-4 bg-success/10 border border-success/20 rounded-lg text-center"
        >
          <Badge variant="success" size="md" className="mb-2 gap-1">
            <CheckCircle2 size={12} /> Quiz Completed
          </Badge>
          <p className="text-xs text-success">
            Great job! You&apos;ve unlocked the next section.
          </p>
        </motion.div>
      )}

      {/* Retake path when failed — names what's actually true instead of a
          one-line dead end: Pre-Tests can always be retaken directly;
          Post-Tests need a code from the teacher. */}
      {!passed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3"
        >
          <KeyRound size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning leading-relaxed">
            Ask your teacher for an unlock code to retake this test, then tap the quiz again to enter it. Pre-tests don&apos;t need a code — you can retry those anytime.
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={onHome}
          className="w-full h-12 font-semibold text-base"
        >
          <Home size={18} className="mr-2" />
          View My Progress
        </Button>
        {isCountingDown && (
          <button
            onClick={cancelAutoContinue}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Continuing in {secondsLeft}s — tap to stay here
          </button>
        )}
      </div>

      {/* Note for Last Quiz */}
      {isLastQuiz && passed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground text-center mt-6 flex items-center justify-center gap-1.5"
        >
          <PartyPopper size={13} /> You&apos;ve completed all quizzes in this section!
        </motion.p>
      )}
    </motion.div>
  )
}
