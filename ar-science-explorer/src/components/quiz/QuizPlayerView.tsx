import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ArrowLeft, Lightbulb, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'
import type { BuiltInQuestion } from '../../types'

const PLAYER_INITIAL  = { opacity: 0, y: 10 } as const
const PLAYER_ANIMATE  = { opacity: 1, y: 0  } as const
const HOVER_ACTIVE    = { scale: 1.01 } as const
const TAP_ACTIVE      = { scale: 0.99 } as const
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
  isCurrentHinted: boolean
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
  isCurrentHinted,
  onSelectAnswer,
  onShowResult,
  onNextQuestion,
  onUseHint,
  onBack,
}: QuizPlayerViewProps) {
  const isCorrect = selectedAnswer === question.correctIndex
  const hasHintsLeft = hintsUsedCount < 3 && !isCurrentHinted
  const isTrueFalse = question.type === 'tf'
  // True/False questions use only the first two option slots (True=0, False=1).
  const visibleOptions = isTrueFalse ? question.options.slice(0, 2) : question.options
  // Label for an option: A/B/C/D for MC, the option text (True/False) for T/F.
  const optionLabel = (idx: number) => (isTrueFalse ? visibleOptions[idx] : String.fromCharCode(65 + idx))

  const hintButton = (
    <Button
      variant="outline"
      size="sm"
      onClick={onUseHint}
      disabled={!hasHintsLeft}
      className="w-full lg:w-auto"
    >
      <Lightbulb size={15} className="mr-1.5" />
      Hint ({3 - hintsUsedCount} left)
    </Button>
  )

  const hintDisplay = question.hint && isCurrentHinted && !showResult && (
    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
      <p className="text-sm text-warning-foreground">
        <strong className="font-semibold">Hint:</strong> {question.hint}
      </p>
    </div>
  )

  return (
    <motion.div
      initial={PLAYER_INITIAL}
      animate={PLAYER_ANIMATE}
      className="max-w-5xl mx-auto pb-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={15} className="mr-1" />
          Quit
        </Button>
        <div className="text-sm font-medium text-muted-foreground">
          Question {questionIndex + 1} of {totalQuestions}
        </div>
      </div>

      {/* Mobile-only horizontal progress bar (side rail replaces this on lg:) */}
      <div
        className="lg:hidden h-1 bg-muted rounded-full mb-6 overflow-hidden"
        role="progressbar"
        aria-valuenow={questionIndex + 1}
        aria-valuemax={totalQuestions}
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: totalQuestions > 0 ? `${((questionIndex + 1) / totalQuestions) * 100}%` : '0%' }}
        />
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 lg:items-start">
        {/* Main column */}
        <div>
          {/* Question Card */}
          <Card className="p-6 md:p-8 mb-6">
            <h2 className="text-lg md:text-xl font-semibold mb-7 text-foreground tracking-tight">
              {question.question}
            </h2>

            {/* Options */}
            <div className="space-y-2.5 mb-1">
              {visibleOptions.map((option, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => !showResult && onSelectAnswer(idx)}
                  disabled={showResult}
                  whileHover={!showResult ? HOVER_ACTIVE   : HOVER_DISABLED}
                  whileTap={!showResult  ? TAP_ACTIVE     : HOVER_DISABLED}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border-2 transition-colors duration-150',
                    selectedAnswer === idx
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 hover:border-muted-foreground/30',
                    showResult && idx === question.correctIndex && 'border-success bg-success/5',
                    showResult && selectedAnswer === idx && idx !== question.correctIndex && 'border-destructive bg-destructive/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {!isTrueFalse && (
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full border-2 flex items-center justify-center font-medium text-xs shrink-0',
                          selectedAnswer === idx ? 'border-primary text-primary' : 'border-muted-foreground/40 text-muted-foreground'
                        )}
                      >
                        {optionLabel(idx)}
                      </div>
                    )}
                    <span className="flex-1 text-sm font-medium text-foreground">{option}</span>
                    {showResult && idx === question.correctIndex && (
                      <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                    )}
                    {showResult && selectedAnswer === idx && idx !== question.correctIndex && (
                      <XCircle size={18} className="text-destructive flex-shrink-0" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Hint button/display live in the side rail on lg:, inline fallback on mobile */}
            <div className="lg:hidden mt-6 space-y-3">
              {!showResult && hintButton}
              {hintDisplay}
            </div>
          </Card>

          {/* Result Feedback */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={RESULT_INITIAL}
                animate={RESULT_ANIMATE}
                className={cn(
                  'p-5 rounded-lg mb-6 text-center border',
                  isCorrect
                    ? 'bg-success/10 border-success/20'
                    : 'bg-warning/10 border-warning/20'
                )}
              >
                <p
                  className={cn(
                    'flex items-center justify-center gap-2 text-base font-semibold mb-1',
                    isCorrect ? 'text-success' : 'text-warning'
                  )}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 size={18} />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      Incorrect
                    </>
                  )}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-warning/80">
                    The correct answer is {optionLabel(question.correctIndex)}.
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
                size="lg"
                className="flex-1"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={onNextQuestion}
                size="lg"
                className="flex-1"
              >
                Next Question
                <ChevronRight size={17} className="ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Side rail: vertical question progress + persistent hint panel (desktop only) */}
        <aside className="hidden lg:flex lg:flex-col lg:gap-6 lg:sticky lg:top-6">
          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Progress
            </h3>
            <div className="flex flex-col gap-2">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const isCurrent = idx === questionIndex
                const isAnswered = idx < questionIndex
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isCurrent && 'bg-primary/10 text-primary',
                      !isCurrent && isAnswered && 'text-success',
                      !isCurrent && !isAnswered && 'text-muted-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0',
                        isCurrent && 'border-primary bg-primary text-primary-foreground',
                        !isCurrent && isAnswered && 'border-success bg-success/10 text-success',
                        !isCurrent && !isAnswered && 'border-muted-foreground/30 text-muted-foreground'
                      )}
                    >
                      {isAnswered ? <CheckCircle2 size={13} /> : idx + 1}
                    </span>
                    Question {idx + 1}
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              Need help?
            </h3>
            <div className="space-y-3">
              {!showResult && hintButton}
              {hintDisplay}
              {!hintDisplay && showResult && (
                <p className="text-xs text-muted-foreground">
                  Hints are available while you&apos;re answering a question.
                </p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </motion.div>
  )
}
