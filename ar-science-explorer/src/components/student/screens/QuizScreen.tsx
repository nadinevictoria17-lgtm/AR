import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { useQuizStore } from '../../../store/useQuizStore'
import { useStorageData } from '../../../hooks/useStorageData'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'
import { ContentSkeleton } from '../../ui/skeleton'
import { SUBJECTS } from '../../../data/subjects'
import { QUIZ_QUESTIONS } from '../../../data/quiz'
import { LESSONS } from '../../../data/lessons'
import { storage } from '../../../lib/storage'
import { QuizUnlockDialog } from '../../quiz/QuizUnlockDialog'
import { QuizListView } from '../../quiz/QuizListView'
import { QuizPlayerView } from '../../quiz/QuizPlayerView'
import { QuizResultsView } from '../../quiz/QuizResultsView'
import { AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { pageVariants } from '../../../lib/variants'
import { Button } from '../../ui/button'
import { db } from '../../../lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import type { StudentRecord, QuizAttempt } from '../../../types'
import { Card } from '../../ui/card'
import type { SubjectKey, BuiltInQuestion } from '../../../types'

const SUBJECT_ORDER: SubjectKey[] = ['chemistry', 'biology', 'physics']

export function QuizScreen() {
  const { currentStudentId, unlockSubject, setScreen } = useAppStore(
    useShallow((s) => ({
      currentStudentId: s.currentStudentId,
      unlockSubject:    s.unlockSubject,
      setScreen:        s.setScreen,
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
    runningQuizId,
    setRunningQuizId,
    setActiveQuizSubject,
  } = useQuizStore(useShallow((s) => ({
    activeQuizSubject: s.activeQuizSubject,
    setActiveQuizSubject: s.setActiveQuizSubject,
    initQuiz:          s.initQuiz,
    quizQuestions:     s.quizQuestions,
    quizIndex:         s.quizIndex,
    submitAnswer:      s.submitAnswer,
    nextQuestion:      s.nextQuestion,
    quizScore:         s.quizScore,
    useHint:           s.useHint,
    quizHintsUsed:     s.quizHintsUsed,
    resetQuiz:         s.resetQuiz,
    runningQuizId:     s.runningQuizId,
    setRunningQuizId:  s.setRunningQuizId,
  })))

  const navigate = useNavigate()
  const { data, isLoading } = useStorageData()
  const showSkeleton = useDeferredLoading(isLoading)

  // Subscribe to real-time student updates for quiz unlock status
  const [studentRealtime, setStudentRealtime] = useState<StudentRecord | null>(null)
  useEffect(() => {
    if (!currentStudentId) return
    const unsub = onSnapshot(
      doc(db, 'students', currentStudentId),
      (snap) => {
        if (snap.exists()) {
          setStudentRealtime(snap.data() as StudentRecord)
        }
      },
      () => {} // Ignore errors, fallback to useStorageData
    )
    return () => unsub()
  }, [currentStudentId])

  // State
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
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
  // Use real-time data if available, otherwise fallback to useStorageData
  const activeStudent = studentRealtime || studentRecord

  const completedQuizIds = useMemo(
    () => new Set(activeStudent?.completedQuizIds ?? []),
    [activeStudent?.completedQuizIds]
  )
  const unlockedQuizIds = useMemo(
    () => new Set(activeStudent?.unlockedQuizIds ?? []),
    [activeStudent?.unlockedQuizIds]
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
            isLocked: !unlockedQuizIds.has(q.id),
            questionCount: q.questions.length,
          }))
        )
      } else if (lessonIds.length > 0) {
        // Create one quiz per lesson (5 questions each)
        for (const lessonId of lessonIds) {
          const lessonQuestions = QUIZ_QUESTIONS.filter((q) => q.subject === subject && q.lessonId === lessonId)
          const lesson = LESSONS.find((l) => l.id === lessonId)
          const quizId = `builtin-${lessonId}`
          result.push({
            id: quizId,
            title: lesson?.title || `${lessonId.toUpperCase()} Quiz`,
            topicName: topic.name,
            isCompleted: completedQuizIds.has(quizId),
            isLocked: !unlockedQuizIds.has(quizId),
            questionCount: lessonQuestions.length,
          })
        }
      }
    }
    return result
  }, [subject, topics, data.quizzes, completedQuizIds, unlockedQuizIds])

  const question = quizQuestions[quizIndex]
  const inQuiz = quizQuestions.length > 0
  const scoreSubject = activeQuizSubject || null

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

    // First check if quiz is unlocked (quiz unlock code required)
    // Quiz must be explicitly unlocked to take it, even if previously completed
    if (!unlockedQuizIds.has(quizId)) {
      const quizTitle = quizzes.find((q) => q.id === quizId)?.title || 'Quiz'
      setPendingUnlockQuiz({ id: quizId, title: quizTitle })
      setShowUnlockDialog(true)
      return
    }

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
    setActiveQuizSubject(subject)
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
        // Wait for store to update or calculate correct total
        const isCorrect = selected === question.correctIndex
        const finalCount = quizScore + (isCorrect ? 1 : 0)
        const pct = Math.round((finalCount / quizQuestions.length) * 100)
        
        console.log(`[Quiz Debug] Entering Final Save Block. Student: ${currentStudentId}, Total Correct: ${finalCount}`)
      
      // SUPER FAIL-SAFE: Look at the questions themselves to find the ID
      const firstQuestion = quizQuestions[0] as any
      const deducedLessonId = firstQuestion?.lessonId || firstQuestion?.id?.split('-')[1]
      const resolvedId = runningQuizId || (deducedLessonId ? `builtin-${deducedLessonId}` : activeQuizSubject ? `builtin-${activeQuizSubject}` : 'unknown-quiz')
      
      try {
        const resolvedSubject = (scoreSubject || (resolvedId?.startsWith('builtin-') 
          ? QUIZ_QUESTIONS.find(q => q.lessonId === resolvedId.replace('builtin-', ''))?.subject
          : data.quizzes.find(q => q.id === resolvedId)?.subject) || 'chemistry') as SubjectKey;

        const attempt: QuizAttempt = {
          id: `attempt-${resolvedId}-${currentStudentId || 'unknown'}-${Date.now()}`,
          quizId: resolvedId,
          studentId: currentStudentId || 'unknown',
          attemptNumber: (studentRecord?.quizAttempts?.filter(a => a.quizId === resolvedId).length || 0) + 1,
          score: pct,
          totalQuestions: quizQuestions.length,
          correctAnswers: finalCount,
          answers: newAnswers,
          timestamp: new Date().toISOString(),
          locked: true,
        }

        console.log(`[Quiz Debug] Calling storage.completeQuiz for:`, resolvedId)
        await storage.completeQuiz(attempt, resolvedSubject)

        // Manual local lock to be 100% sure the UI updates even if onSnapshot lags
        await storage.lockContent(currentStudentId || '', resolvedId, 'quiz')
        
        if (runningQuizIsLastInSubject) {
          const idx = SUBJECT_ORDER.indexOf(resolvedSubject as SubjectKey)
          const nextSubject = SUBJECT_ORDER[idx + 1]
          if (nextSubject) unlockSubject(nextSubject)
        }
      } catch (error) {
        console.error(`[Quiz] Save failed:`, error)
      } finally {
      }

      setFinalScorePct(pct)
      setFinalCorrectCount(finalCount)
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
  }, [resetQuiz, setScreen, navigate])

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

        // Fallback subject detection
        const resolvedSubject = scoreSubject || (runningQuizId.startsWith('builtin-') 
          ? QUIZ_QUESTIONS.find(q => q.lessonId === runningQuizId.replace('builtin-', ''))?.subject
          : data.quizzes.find(q => q.id === runningQuizId)?.subject) || 'chemistry';

        console.log(`[Quiz] Saving early exit results: ${runningQuizId}, score: ${pct}%, subject: ${resolvedSubject}`)

        const attempt: QuizAttempt = {
          id: `attempt-${runningQuizId}-${currentStudentId}-${Date.now()}`,
          quizId: runningQuizId,
          studentId: currentStudentId,
          attemptNumber: (studentRecord?.quizAttempts?.filter(a => a.quizId === runningQuizId).length || 0) + 1,
          score: pct,
          totalQuestions: quizQuestions.length,
          correctAnswers: correctCount,
          answers: finalAnswers,
          timestamp: new Date().toISOString(),
          locked: true,
        }

      // setIsSaving replaced
        try {
          // Use consolidated atomic update
          await storage.completeQuiz(attempt, resolvedSubject as SubjectKey)
          console.log(`[Quiz] Early exit saved successfully`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        } finally {
        }
      } catch (error) {
        console.error(`[Quiz] CRITICAL ERROR during early exit save:`, error)
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
    setPendingUnlockQuiz(null)
    // Wait for Firestore to sync the unlockedQuizIds before attempting to start
    // This ensures the quiz list updates and shows the quiz as unlocked
    await new Promise(resolve => setTimeout(resolve, 500))
    // Quiz list will auto-update from Firestore, student can click to start
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
