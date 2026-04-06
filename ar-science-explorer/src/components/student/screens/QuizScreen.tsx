import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { useQuizStore } from '../../../store/useQuizStore'
import { useQuizAttempt } from '../../../hooks/useQuizAttempt'
import { useStorageData } from '../../../hooks/useStorageData'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'
import { ContentSkeleton } from '../../ui/skeleton'
import { SUBJECTS } from '../../../data/subjects'
import { QUIZ_QUESTIONS } from '../../../data/quiz'
import { storage } from '../../../lib/storage'
import { QuizUnlockDialog } from '../../quiz/QuizUnlockDialog'
import { QuizListView } from '../../quiz/QuizListView'
import { QuizPlayerView } from '../../quiz/QuizPlayerView'
import { QuizResultsView } from '../../quiz/QuizResultsView'
import { AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { pageVariants } from '../../../lib/variants'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import type { SubjectKey, BuiltInQuestion } from '../../../types'

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology']

export function QuizScreen() {
  const { currentStudentId, unlockSubject, setScreen, activeLessonId } = useAppStore(
    useShallow((s) => ({
      currentStudentId: s.currentStudentId,
      unlockSubject:    s.unlockSubject,
      setScreen:        s.setScreen,
      activeLessonId:   s.activeLessonId,
    }))
  )

  const {
    activeQuizSubject,
    initQuiz,
    quizQuestions,
    quizIndex,
    submitAnswer,
    nextQuestion,
    quizScore,
    useHint,
    quizHintsUsed,
    resetQuiz,
  } = useQuizStore(useShallow((s) => ({
    activeQuizSubject: s.activeQuizSubject,
    initQuiz:          s.initQuiz,
    quizQuestions:     s.quizQuestions,
    quizIndex:         s.quizIndex,
    submitAnswer:      s.submitAnswer,
    nextQuestion:      s.nextQuestion,
    quizScore:         s.quizScore,
    useHint:           s.useHint,
    quizHintsUsed:     s.quizHintsUsed,
    resetQuiz:         s.resetQuiz,
  })))

  const quizAttemptHook = useQuizAttempt()
  const navigate = useNavigate()
  const { data, isLoading } = useStorageData()
  const showSkeleton = useDeferredLoading(isLoading)

  // State
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [runningSubject, setRunningSubject] = useState<SubjectKey | null>(null)
  const [runningQuizId, setRunningQuizId] = useState<string | null>(null)
  const [runningQuizIsLastInSubject, setRunningQuizIsLastInSubject] = useState(false)
  const [finalScorePct,     setFinalScorePct]     = useState<number>(0)
  const [finalCorrectCount, setFinalCorrectCount] = useState<number>(0)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)
  const [pendingUnlockQuiz, setPendingUnlockQuiz] = useState<{ id: string; title: string } | null>(null)
  const [showBackConfirmation, setShowBackConfirmation] = useState(false)

  // Computed
  const studentRecord = useMemo(
    () => currentStudentId ? data.students.find((s) => s.studentId === currentStudentId) : null,
    [data.students, currentStudentId]
  )
  const completedQuizIds = useMemo(
    () => new Set(studentRecord?.completedQuizIds ?? []),
    [studentRecord?.completedQuizIds]
  )

  const subject: SubjectKey | null = activeQuizSubject ?? null
  const subjectData = useMemo(
    () => subject ? SUBJECTS.find((s) => s.id === subject) : null,
    [subject]
  )
  const topics = useMemo(() => subjectData?.topics ?? [], [subjectData])

  // Build quiz list
  const quizzes = useMemo(() => {
    if (!subject) return []

    const result = []
    for (const topic of topics) {
      const topicTeacherQuizzes = data.quizzes
        .filter((q) => q.subject === subject && (q.topicId ?? topics[0]?.id) === topic.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      // Get all lessons for this topic
      const lessonIds = [...new Set(QUIZ_QUESTIONS
        .filter((q) => q.subject === subject && q.topicId === topic.id && q.lessonId)
        .map((q) => q.lessonId!))]

      const hasTeacherQuizzes = topicTeacherQuizzes.length > 0

      if (hasTeacherQuizzes) {
        result.push(
          ...topicTeacherQuizzes.map((q) => ({
            id: q.id,
            title: q.title,
            topicName: topic.name,
            isCompleted: completedQuizIds.has(q.id),
            isLocked: false, // TODO: check prerequisites
            questionCount: q.questions.length,
          }))
        )
      } else if (lessonIds.length > 0) {
        // Create one quiz per lesson (5 questions each)
        for (const lessonId of lessonIds) {
          const lessonQuestions = QUIZ_QUESTIONS.filter((q) => q.subject === subject && q.lessonId === lessonId)
          result.push({
            id: `builtin-${lessonId}`,
            title: `${lessonId.toUpperCase()} Quiz`,
            topicName: topic.name,
            isCompleted: completedQuizIds.has(`builtin-${lessonId}`),
            isLocked: false,
            questionCount: lessonQuestions.length,
          })
        }
      }
    }
    return result
  }, [subject, topics, data.quizzes, completedQuizIds])

  const question = quizQuestions[quizIndex]
  const inQuiz = quizQuestions.length > 0
  const scoreSubject = runningSubject ?? activeQuizSubject ?? null

  // Derive quiz ID from lesson if not explicitly set (quiz started from ARLabScreen)
  useEffect(() => {
    if (inQuiz && !runningQuizId && activeLessonId) {
      const derivedQuizId = `builtin-${activeLessonId}`
      console.log(`[Quiz] Auto-detected quiz ID from lesson: ${derivedQuizId}`)
      setRunningQuizId(derivedQuizId)
    }
  }, [inQuiz, runningQuizId, activeLessonId])

  // Prevent browser back navigation during quiz
  useEffect(() => {
    if (!inQuiz) return

    // Push a dummy state when quiz starts so we can intercept back button
    window.history.pushState({ quizActive: true }, '')

    const handlePopState = () => {
      // Intercept back button - show confirmation instead of going back
      window.history.pushState({ quizActive: true }, '')
      setShowBackConfirmation(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [inQuiz])

  // Handlers
  const handleStartQuiz = async (quizId: string) => {
    if (!currentStudentId) return

    // Check quiz eligibility using centralized validation
    const eligibility = await storage.validateQuizEligibility(currentStudentId, quizId)
    if (!eligibility.canTake) {
      const quizTitle = quizzes.find((q) => q.id === quizId)?.title || 'Quiz'
      setPendingUnlockQuiz({ id: quizId, title: quizTitle })
      setShowUnlockDialog(true)
      return
    }

    // Get quiz questions from teacher quiz or built-in quiz
    const quiz = data.quizzes.find((q) => q.id === quizId)
    const isBuiltIn = quizId.startsWith('builtin-')
    const lessonId = isBuiltIn ? quizId.replace('builtin-', '') : null
    const quizQuestionsList = quiz?.questions ?? (lessonId ? QUIZ_QUESTIONS.filter((q) => q.lessonId === lessonId) : [])

    initQuiz(quizQuestionsList.length > 0 ? quizQuestionsList : QUIZ_QUESTIONS)
    setRunningSubject(subject)
    setRunningQuizId(quizId)
    setRunningQuizIsLastInSubject(quizzes.findIndex((q) => q.id === quizId) === quizzes.length - 1)
    setSelected(null)
    setShowResult(false)
    setQuizAnswers([])
  }

  const handleSelectAnswer = (optionIndex: number) => {
    setSelected(optionIndex)
  }

  const handleShowResult = async () => {
    if (selected === null) return

    submitAnswer(selected)
    const newAnswers = [...quizAnswers, selected]
    setQuizAnswers(newAnswers)
    const isLastQuestion = quizIndex >= quizQuestions.length - 1

    if (isLastQuestion) {
      const correctCount = quizScore + (selected === question.correctIndex ? 1 : 0)
      const pct = Math.round((correctCount / quizQuestions.length) * 100)

      // Save attempt
      if (currentStudentId && scoreSubject && runningQuizId) {
        try {
          console.log(`[Quiz] Completing quiz: ${runningQuizId}, score: ${pct}%, subject: ${scoreSubject}`)

          const saved = await quizAttemptHook.saveAttempt(
            currentStudentId,
            runningQuizId,
            pct,
            quizQuestions.length,
            correctCount,
            newAnswers
          )
          console.log(`[Quiz] Attempt saved: ${saved}`)

          await storage.saveStudentScore(currentStudentId, scoreSubject, pct)
          console.log(`[Quiz] Score saved: ${pct}%`)

          await storage.saveStudentQuizCompletion(currentStudentId, runningQuizId)
          console.log(`[Quiz] Completion recorded`)

          // Unlock next subject if last quiz
          if (runningQuizIsLastInSubject) {
            const idx = SUBJECT_ORDER.indexOf(scoreSubject)
            const nextSubject = SUBJECT_ORDER[idx + 1]
            if (nextSubject) {
              unlockSubject(nextSubject)
              console.log(`[Quiz] Unlocked next subject: ${nextSubject}`)
            }
          }
        } catch (error) {
          console.error(`[Quiz] Failed to save quiz completion:`, error)
        }
      }

      setFinalScorePct(pct)
      setFinalCorrectCount(correctCount)
      setShowResult(true)
    } else {
      nextQuestion()
      setSelected(null)
    }
  }

  const handleNextQuestion = () => {
    nextQuestion()
    setSelected(null)
  }


  const handleBackHome = useCallback(() => {
    resetQuiz()
    setRunningQuizId(null)
    setRunningQuizIsLastInSubject(false)
    setQuizAnswers([])
    setShowResult(false)
    setFinalScorePct(0)
    setFinalCorrectCount(0)
    setScreen('progress')
    navigate('/app/progress')
  }, [resetQuiz, setRunningQuizId, setRunningQuizIsLastInSubject, setScreen, navigate])

  const handleShowBackConfirmation = () => {
    setShowBackConfirmation(true)
  }

  const handleConfirmBack = async () => {
    setShowBackConfirmation(false)

    // Submit quiz with current answers (including current selection if submitted)
    if (currentStudentId && scoreSubject && runningQuizId && question) {
      try {
        // Count correct answers including current question if already answered
        let correctCount = quizScore
        if (quizIndex < quizAnswers.length) {
          // Current answer was already submitted
          if (quizAnswers[quizIndex] === question.correctIndex) {
            correctCount += 1
          }
        } else if (selected === question.correctIndex && quizAnswers.length === quizIndex) {
          // Current answer selected but not submitted yet
          correctCount += 1
        }

        const pct = Math.round((correctCount / quizQuestions.length) * 100)
        const finalAnswers = quizAnswers.length > quizIndex ? quizAnswers : [...quizAnswers, selected ?? -1]

        console.log(`[Quiz] Exiting quiz early: ${runningQuizId}, score: ${pct}%, subject: ${scoreSubject}`)

        // Save the attempt with completed answers
        const saved = await quizAttemptHook.saveAttempt(
          currentStudentId,
          runningQuizId,
          pct,
          quizQuestions.length,
          correctCount,
          finalAnswers
        )
        console.log(`[Quiz] Early exit attempt saved: ${saved}`)

        await storage.saveStudentScore(currentStudentId, scoreSubject, pct)
        console.log(`[Quiz] Early exit score saved: ${pct}%`)

        await storage.saveStudentQuizCompletion(currentStudentId, runningQuizId)
        console.log(`[Quiz] Early exit completion recorded`)
      } catch (error) {
        console.error(`[Quiz] Failed to save early exit:`, error)
      }
    }

    // Clean up state and navigate back
    resetQuiz()
    setRunningQuizId(null)
    setRunningQuizIsLastInSubject(false)
    setQuizAnswers([])
    setShowResult(false)
    setFinalScorePct(0)
    setFinalCorrectCount(0)
    setScreen('progress')
    navigate('/app/progress')
  }

  const handleCancelBack = () => {
    setShowBackConfirmation(false)
  }

  const handleUnlockSuccess = async () => {
    setShowUnlockDialog(false)
    if (pendingUnlockQuiz) {
      await handleStartQuiz(pendingUnlockQuiz.id)
    }
    setPendingUnlockQuiz(null)
  }

  if (showSkeleton) return <ContentSkeleton />

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      {/* Quiz List */}
      {!inQuiz && !showResult && (
        <QuizListView
          quizzes={quizzes}
          onSelectQuiz={handleStartQuiz}
        />
      )}

      {/* Quiz Player */}
      {inQuiz && !showResult && question && (
        <QuizPlayerView
          question={question as BuiltInQuestion}
          questionIndex={quizIndex}
          totalQuestions={quizQuestions.length}
          selectedAnswer={selected}
          showResult={false}
          hintsUsedCount={quizHintsUsed}
          onSelectAnswer={handleSelectAnswer}
          onShowResult={handleShowResult}
          onNextQuestion={handleNextQuestion}
          onUseHint={useHint}
          onBack={handleShowBackConfirmation}
        />
      )}

      {/* Quiz Results */}
      {showResult && (
        <QuizResultsView
          score={finalCorrectCount}
          totalQuestions={quizQuestions.length}
          hintsUsed={quizHintsUsed}
          passed={finalScorePct >= 70}
          onHome={handleBackHome}
          isLastQuiz={runningQuizIsLastInSubject}
          quizTitle={pendingUnlockQuiz?.title}
        />
      )}

      {/* Unlock Dialog */}
      <AnimatePresence>
        {showUnlockDialog && pendingUnlockQuiz && currentStudentId && (
          <QuizUnlockDialog
            studentId={currentStudentId}
            quizId={pendingUnlockQuiz.id}
            quizTitle={pendingUnlockQuiz.title}
            onUnlock={handleUnlockSuccess}
            onCancel={() => {
              setShowUnlockDialog(false)
              setPendingUnlockQuiz(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* Back Confirmation Modal */}
      <AnimatePresence>
        {showBackConfirmation && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelBack}
              className="fixed inset-0 bg-black/40 z-40"
              aria-label="Close confirmation modal"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <Card className="w-full max-w-sm mx-4 p-6 pointer-events-auto">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="text-destructive shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-foreground">Exit Quiz?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Going back will submit your quiz with your current answers.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelBack}
                    className="text-foreground"
                  >
                    Continue Quiz
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirmBack}
                  >
                    Submit & Exit
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
