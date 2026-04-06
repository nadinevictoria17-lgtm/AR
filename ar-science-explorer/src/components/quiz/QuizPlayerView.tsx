import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ArrowLeft, Lightbulb, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'
import type { BuiltInQuestion } from '../../types'

const PLAYER_INITIAL  = { opacity: 0, y: 10 } as const
const PLAYER_ANIMATE  = { opacity: 1, y: 0  } as const
const HOVER_ACTIVE    = { scale: 1.02 } as const
const TAP_ACTIVE      = { scale: 0.98 } as const
const HOVER_DISABLED  = {} as const
const RESULT_INITIAL  = { opacity: 0, y: 10 } as const
const RESULT_ANIMATE  = { opacity: 1, y: 0  } as const

interface QuizPlayerViewProps {
  question: BuiltInQuestion
  questionIndex: number
  totalQuestions: number
  selectedAnswer: number | null
  showResult: boolean
  hintsUsedCount: number
  onSelectAnswer: (optionIndex: number) => void
  onShowResult: () => void
  onNextQuestion: () => void
  onUseHint: () => void
  onBack: () => void
}

export function QuizPlayerView({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  showResult,
  hintsUsedCount,
  onSelectAnswer,
  onShowResult,
  onNextQuestion,
  onUseHint,
  onBack,
}: QuizPlayerViewProps) {
  const isCorrect = selectedAnswer === question.correctIndex
  const hasHintsLeft = hintsUsedCount < 3

  return (
    <motion.div
      initial={PLAYER_INITIAL}
      animate={PLAYER_ANIMATE}
      className="max-w-2xl mx-auto pb-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} className="mr-1" />
          Quit
        </Button>
        <div className="text-sm font-semibold text-muted-foreground">
          Question {questionIndex + 1} of {totalQuestions}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-muted rounded-full mb-6 overflow-hidden" role="progressbar" aria-valuenow={questionIndex + 1} aria-valuemax={totalQuestions}>
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: totalQuestions > 0 ? `${((questionIndex + 1) / totalQuestions) * 100}%` : '0%' }}
        />
      </div>

      {/* Question Card */}
      <Card className="p-8 mb-8 border-border">
        <h2 className="text-xl font-bold mb-8 text-foreground">
          {question.question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((option, idx) => (
            <motion.button
              key={idx}
              onClick={() => !showResult && onSelectAnswer(idx)}
              disabled={showResult}
              whileHover={!showResult ? HOVER_ACTIVE   : HOVER_DISABLED}
              whileTap={!showResult  ? TAP_ACTIVE     : HOVER_DISABLED}
              className={cn(
                'w-full text-left p-4 rounded-lg border-2 transition-all',
                selectedAnswer === idx
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30 hover:border-primary/50',
                showResult && idx === question.correctIndex && 'border-success bg-success/5',
                showResult && selectedAnswer === idx && idx !== question.correctIndex && 'border-destructive bg-destructive/10'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm',
                    selectedAnswer === idx ? 'border-primary' : 'border-muted-foreground'
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="flex-1">{option}</span>
                {showResult && idx === question.correctIndex && (
                  <CheckCircle2 size={20} className="text-success flex-shrink-0" />
                )}
                {showResult && selectedAnswer === idx && idx !== question.correctIndex && (
                  <XCircle size={20} className="text-destructive flex-shrink-0" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Hint Button */}
        {!showResult && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUseHint}
            disabled={!hasHintsLeft}
            className="mb-6"
          >
            <Lightbulb size={16} className="mr-2" />
            Hint ({3 - hintsUsedCount} left)
          </Button>
        )}

        {/* Hint Display */}
        {question.hint && hintsUsedCount > 0 && !showResult && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg mb-6">
            <p className="text-sm text-warning-foreground">
              <strong>Hint:</strong> {question.hint}
            </p>
          </div>
        )}
      </Card>

        {/* Result Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={RESULT_INITIAL}
            animate={RESULT_ANIMATE}
            className={cn(
              'p-6 rounded-lg mb-8 text-center',
              isCorrect
                ? 'bg-success/10 border border-success/20'
                : 'bg-warning/10 border border-warning/20'
            )}
          >
            <p
              className={cn(
                'text-lg font-bold mb-2',
                isCorrect ? 'text-success' : 'text-warning'
              )}
            >
              {isCorrect ? '✓ Correct!' : 'Incorrect'}
            </p>
            {!isCorrect && (
              <p className="text-sm text-warning/80">
                The correct answer is {String.fromCharCode(65 + question.correctIndex)}.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!showResult ? (
          <Button
            onClick={onShowResult}
            disabled={selectedAnswer === null}
            className="flex-1 h-12 font-bold text-base"
          >
            Submit Answer
          </Button>
        ) : (
          <Button
            onClick={onNextQuestion}
            className="flex-1 h-12 font-bold text-base"
          >
            Next Question
            <ChevronRight size={18} className="ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}
