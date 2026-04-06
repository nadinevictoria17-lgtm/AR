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
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2 text-foreground">
          Quizzes
        </h1>
        <p className="text-muted-foreground">
          Complete quizzes to test your understanding and unlock new content.
        </p>
      </div>

      {/* Topics with Quizzes */}
      <div className="space-y-6">
        {Object.entries(groupedByTopic).map(([topicName, topicQuizzes]) => (
          <div key={topicName}>
            {/* Topic Header */}
            <h2 className="text-lg font-bold mb-3 text-foreground">
              {topicName}
            </h2>

            {/* Quiz Cards */}
            <div className="space-y-2">
              {topicQuizzes.map((quiz, idx) => (
                <motion.div
                  key={quiz.id}
                  initial={ITEM_INITIAL}
                  animate={ITEM_ANIMATE}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card
                    className={cn(
                      'p-4 cursor-pointer transition-all border-border',
                      quiz.isLocked
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:border-primary hover:shadow-lg'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-foreground">
                            {quiz.title}
                          </h3>
                          {quiz.isCompleted && (
                            <CheckCircle2
                              size={18}
                              className="text-success flex-shrink-0"
                            />
                          )}
                          {quiz.isLocked && (
                            <Lock
                              size={18}
                              className="text-muted-foreground flex-shrink-0"
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={14} />
                          <span>{quiz.questionCount} questions</span>
                          {quiz.lastAttemptScore !== undefined && (
                            <>
                              <span>•</span>
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
                        className="flex-shrink-0 ml-4"
                      >
                        {quiz.isLocked ? (
                          <Lock size={16} />
                        ) : quiz.isCompleted ? (
                          <>
                            Retake
                            <ChevronRight size={16} className="ml-1" />
                          </>
                        ) : (
                          <>
                            Start
                            <ChevronRight size={16} className="ml-1" />
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
        <Card className="p-12 text-center border-border">
          <p className="text-muted-foreground mb-4">
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
