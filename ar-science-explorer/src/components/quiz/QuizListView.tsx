import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Lock, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

const LIST_INITIAL   = { opacity: 0, y: 10 } as const
const LIST_ANIMATE   = { opacity: 1, y: 0  } as const
const ITEM_INITIAL   = { opacity: 0, x: -10 } as const
const ITEM_ANIMATE   = { opacity: 1, x: 0  } as const

interface QuizItem {
  id: string
  title: string
  topicName: string
  isCompleted: boolean
  isLocked: boolean
  questionCount: number
  lastAttemptScore?: number
}

interface QuizListViewProps {
  quizzes: QuizItem[]
  onSelectQuiz: (quizId: string) => void
}

export function QuizListView({
  quizzes,
  onSelectQuiz,
}: QuizListViewProps) {
  const groupedByTopic = useMemo(() => quizzes.reduce(
    (acc, quiz) => {
      const topic = quiz.topicName
      if (!acc[topic]) acc[topic] = []
      acc[topic].push(quiz)
      return acc
    },
    {} as Record<string, QuizItem[]>
  ), [quizzes])

  return (
    <motion.div
      initial={LIST_INITIAL}
      animate={LIST_ANIMATE}
      className="max-w-3xl mx-auto pb-8"
    >
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight mb-1.5 text-foreground">
          Tests
        </h1>
        <p className="text-sm text-muted-foreground">
          Take the Pre-Test before a lesson and the Post-Test after to check your understanding.
        </p>
      </div>

      {/* Topics with Quizzes */}
      <div className="space-y-6">
        {Object.entries(groupedByTopic).map(([topicName, topicQuizzes]) => (
          <div key={topicName}>
            {/* Topic Header */}
            <h2 className="text-sm font-semibold mb-2.5 text-foreground">
              {topicName}
            </h2>

            {/* Quiz Cards */}
            <div className="space-y-2">
              {topicQuizzes.map((quiz, idx) => (
                <motion.div
                  key={quiz.id}
                  initial={ITEM_INITIAL}
                  animate={ITEM_ANIMATE}
                  transition={{ delay: idx * 0.04, duration: 0.15 }}
                >
                  <Card
                    className={cn(
                      'p-4 transition-colors duration-150',
                      quiz.isLocked
                        ? 'opacity-60'
                        : 'hover:border-muted-foreground/25'
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-sm font-medium text-foreground">
                            {quiz.title}
                          </h3>
                          {quiz.isCompleted && (
                            <CheckCircle2
                              size={15}
                              className="text-success flex-shrink-0"
                            />
                          )}
                          {quiz.isLocked && (
                            <Lock
                              size={14}
                              className="text-muted-foreground flex-shrink-0"
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>{quiz.questionCount} questions</span>
                          {quiz.lastAttemptScore !== undefined && (
                            <>
                              <span>·</span>
                              <span>
                                Best score: {quiz.lastAttemptScore}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => !quiz.isLocked && onSelectQuiz(quiz.id)}
                        disabled={quiz.isLocked}
                        size="sm"
                        variant={quiz.isCompleted ? 'outline' : 'default'}
                        className="flex-shrink-0"
                      >
                        {quiz.isLocked ? (
                          <Lock size={14} />
                        ) : quiz.isCompleted ? (
                          <>
                            Retake
                            <ChevronRight size={14} />
                          </>
                        ) : (
                          <>
                            Start
                            <ChevronRight size={14} />
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {quizzes.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No quizzes available for this subject yet.
          </p>
          <p className="text-xs text-muted-foreground">
            Complete lessons to unlock quizzes.
          </p>
        </Card>
      )}
    </motion.div>
  )
}
