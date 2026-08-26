import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '../../lib/utils'
import { getUnlockCodeData, trackCodeUsage } from '../../lib/unlockCodeManager'
import { storage } from '../../lib/storage'
import { useAppStore } from '../../store/useAppStore'
import { builtinQuizId } from '../../lib/quizId'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface AccessCodeModalProps {
  isOpen: boolean
  onClose: () => void
  targetId: string
  type: 'lesson' | 'quiz'
  title: string
  onSuccess: () => void
}

export function AccessCodeModal({ isOpen, onClose, targetId, type, title, onSuccess }: AccessCodeModalProps) {
  const { currentStudentId, unlockSubject } = useAppStore(
    useShallow(s => ({ currentStudentId: s.currentStudentId, unlockSubject: s.unlockSubject }))
  )
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleUnlock = async () => {
    if (!code.trim() || !currentStudentId) return

    setStatus('loading')
    setMessage('')

    try {
      const normalized = code.trim().toUpperCase()

      // ── 1. Try quiz retake codes (auto-generated, stored in quizUnlockCodes) ──
      if (type === 'quiz') {
        const quizId = builtinQuizId(targetId, 'post')
        const applied = await storage.applyQuizUnlockCode(currentStudentId, quizId, normalized)
        if (applied) {
          await storage.markQuizAsRetakeable(currentStudentId, quizId)
          // Add quiz to unlockedQuizIds so it shows as unlocked in the UI
          await storage.unlockContent(currentStudentId, quizId, 'quiz')
          setStatus('success')
          setMessage('Test unlocked successfully!')
          setTimeout(() => { onSuccess(); onClose(); setCode(''); setStatus('idle') }, 1500)
          return
        }
      }

      // ── 2. Try lesson/subject unlock codes (stored in unlockCodes) ──
      const data = await getUnlockCodeData(normalized)

      if (!data) {
        setStatus('error')
        setMessage('Invalid access code. Please check with your teacher.')
        return
      }

      // Validate student-specific code
      if (data.targetStudentId && data.targetStudentId !== currentStudentId) {
        setStatus('error')
        setMessage('This code is assigned to a different student.')
        return
      }

      // Check if this student has already used this code (one-time use for lesson/subject codes)
      if (data.usedByStudentIds?.includes(currentStudentId)) {
        setStatus('error')
        setMessage('This code has already been used. Ask your teacher for a new one.')
        return
      }

      // ── Subject code with specific week/lesson list ──
      if (data.type === 'subject' && data.lessonIds?.length) {
        if (!data.lessonIds.includes(targetId)) {
          setStatus('error')
          setMessage('This code is not valid for this lesson.')
          return
        }
        // Unlock only the listed lessons in Firestore (not the whole subject)
        await Promise.all(data.lessonIds.map(id => storage.unlockContent(currentStudentId, id, 'lesson')))
        await trackCodeUsage(normalized, currentStudentId)
        setStatus('success')
        setMessage('Lesson unlocked successfully!')
        setTimeout(() => { onSuccess(); onClose(); setCode(''); setStatus('idle') }, 1500)
        return
      }

      // ── Full subject unlock code (no specific lesson IDs) ──
      if (data.type === 'subject' && data.subjects?.length) {
        for (const sub of data.subjects) unlockSubject(sub)
        await trackCodeUsage(normalized, currentStudentId)
        setStatus('success')
        setMessage('Subject unlocked successfully!')
        setTimeout(() => { onSuccess(); onClose(); setCode(''); setStatus('idle') }, 1500)
        return
      }

      // ── Test Unlock code (type === 'lesson' for first-time test access) ──
      if (data.type === 'lesson' && type === 'quiz') {
        if (data.targetId && data.targetId !== targetId) {
          setStatus('error')
          setMessage('This code is not valid for this test.')
          return
        }
        const quizId = builtinQuizId(targetId, 'post')
        const success = await storage.unlockContent(currentStudentId, quizId, 'quiz')
        if (success) {
          await trackCodeUsage(normalized, currentStudentId)
          setStatus('success')
          setMessage('Test unlocked successfully!')
          setTimeout(() => { onSuccess(); onClose(); setCode(''); setStatus('idle') }, 1500)
        } else {
          throw new Error('Storage update failed')
        }
        return
      }

      // ── Manually-created test retake code (stored as type 'quiz' in unlockCodes) ──
      if (data.type === 'quiz' && type === 'quiz') {
        // Enforce one-time use
        if (data.isUsed) {
          setStatus('error')
          setMessage('This code has already been used. Ask your teacher for a new one.')
          return
        }
        if (data.targetId && data.targetId !== targetId) {
          setStatus('error')
          setMessage('This code is not valid for this test.')
          return
        }

        // Validate: the post-test must be completed before allowing a retake.
        // Accept the legacy unsuffixed id too, for records saved before the pre/post split.
        const student = (await storage.getAll()).students.find(s => s.studentId === currentStudentId)
        const quizId = builtinQuizId(targetId, 'post')
        const legacyId = `builtin-${targetId}`
        if (!student?.completedQuizIds.includes(quizId) && !student?.completedQuizIds.includes(legacyId)) {
          setStatus('error')
          setMessage('You must complete the test first before using a retake code.')
          return
        }

        await storage.markQuizAsRetakeable(currentStudentId, quizId)
        // Add quiz to unlockedQuizIds so it shows as unlocked in the UI
        await storage.unlockContent(currentStudentId, quizId, 'quiz')
        await trackCodeUsage(normalized, currentStudentId, true) // markAsUsed=true (1-time use)
        setStatus('success')
        setMessage('Test unlocked for retake!')
        setTimeout(() => { onSuccess(); onClose(); setCode(''); setStatus('idle') }, 1500)
        return
      }

      // ── Specific lesson code (type === 'lesson') ──
      if (data.type === 'lesson' && type === 'lesson') {
        if (data.targetId && data.targetId !== targetId) {
          setStatus('error')
          setMessage('This code is not valid for this lesson.')
          return
        }
        const success = await storage.unlockContent(currentStudentId, targetId, 'lesson')
        if (success) {
          await trackCodeUsage(normalized, currentStudentId)
          setStatus('success')
          setMessage('Lesson unlocked successfully!')
          setTimeout(() => { onSuccess(); onClose(); setCode(''); setStatus('idle') }, 1500)
        } else {
          throw new Error('Storage update failed')
        }
        return
      }

      setStatus('error')
      setMessage(`This code is not for this ${type === 'quiz' ? 'test' : type}.`)
    } catch (err) {
      console.error('Unlock error:', err)
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" suppressHydrationWarning>
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-card border border-border rounded-xl shadow-popover overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Unlock access</h3>
                  <p className="text-[11px] text-muted-foreground">Required for {title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">
                  Teacher access code
                </label>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  disabled={status === 'loading' || status === 'success'}
                  autoFocus
                  className="text-base font-mono text-center tracking-widest h-11"
                />
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    'p-3 rounded-md flex items-start gap-2.5 text-[13px] border',
                    status === 'error'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-success/10 text-success border-success/20'
                  )}
                >
                  {status === 'error'
                    ? <AlertCircle  size={16} className="shrink-0 mt-0.5" />
                    : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  }
                  {message}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleUnlock}
                  disabled={!code.trim() || status === 'loading' || status === 'success'}
                  isLoading={status === 'loading'}
                >
                  {status !== 'loading' && 'Unlock now'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
