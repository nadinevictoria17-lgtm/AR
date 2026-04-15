import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Lock, Check, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { storage } from '../../lib/storage'
import { useQuizAttempt } from '../../hooks/useQuizAttempt'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface QuizUnlockDialogProps {
  studentId: string
  quizId: string
  quizTitle: string
  onUnlock: () => void
  onCancel: () => void
}

export function QuizUnlockDialog({
  studentId,
  quizId,
  quizTitle,
  onUnlock,
  onCancel,
}: QuizUnlockDialogProps) {
  const quizAttempt = useQuizAttempt()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    if (!code.trim() || status !== 'idle') return

    setStatus('checking')
    const success = await quizAttempt.applyUnlockCode(studentId, quizId, code.trim().toUpperCase())

    if (success) {
      // Add quiz to unlockedQuizIds so it shows as unlocked in the UI
      await storage.unlockContent(studentId, quizId, 'quiz')
      setStatus('success')
      setTimeout(onUnlock, 1200)
    } else {
      setStatus('error')
      setErrorMessage('Invalid or expired code. Please check and try again.')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCancel}
      suppressHydrationWarning
    >
      <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()} suppressHydrationWarning>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Lock size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Unlock Quiz</h3>
            <p className="text-xs text-muted-foreground">{quizTitle}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          This quiz is locked. Enter the unlock code provided by your teacher to retake it.
        </p>

        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Enter unlock code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={status !== 'idle'}
            className={cn(
              'font-mono text-center tracking-widest uppercase',
              status === 'error' && 'border-destructive focus:ring-destructive/50 bg-destructive/5'
            )}
          />

          {status === 'error' && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive flex items-center gap-1">
              <X size={12} /> {errorMessage}
            </motion.p>
          )}

          {status === 'success' && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-success">
              <Check size={16} /> Code accepted! Reloading...
            </motion.div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={status !== 'idle'}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!code.trim() || status !== 'idle'}
            isLoading={status === 'checking'}
            className="flex-1"
          >
            {status === 'checking' ? 'Checking...' : 'Unlock'}
          </Button>
        </div>
      </div>
    </motion.div>,
    document.body
  )
}
