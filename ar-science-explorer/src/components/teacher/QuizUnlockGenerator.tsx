import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Copy, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useQuizAttempt } from '../../hooks/useQuizAttempt'
import type { StudentRecord, TeacherQuiz } from '../../types'

interface QuizUnlockGeneratorProps {
  student: StudentRecord
  quiz: TeacherQuiz
  onClose: () => void
}

export function QuizUnlockGenerator({ student, quiz, onClose }: QuizUnlockGeneratorProps) {
  const quizAttempt = useQuizAttempt()
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerateCode = async () => {
    const code = await quizAttempt.unlockForRetake(student.studentId, quiz.id)
    if (code) {
      setGeneratedCode(code)
    }
  }

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-foreground text-lg mb-1">Unlock Quiz for Retake</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Generate a code to allow {student.name} ({student.studentId}) to retake {quiz.title}
        </p>

        {!generatedCode ? (
          <>
            <button
              onClick={handleGenerateCode}
              className="w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Generate Unlock Code
            </button>
            <button
              onClick={onClose}
              className="w-full mt-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="bg-muted rounded-xl p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-2">Unlock Code</p>
              <p className="text-2xl font-bold text-foreground tracking-widest text-center font-mono">
                {generatedCode}
              </p>
            </div>

            <button
              onClick={handleCopyCode}
              className={cn(
                'w-full px-4 py-2 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2',
                copied
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted'
              )}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Code
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Share this code with the student. Valid for 7 days.
            </p>

            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </>
        )}
      </div>
    </motion.div>,
    document.body
  )
}
