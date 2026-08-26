import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
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
        setMessage(`Code "${normalized}" isn't valid. Check with your teacher.`)
        return
      }

      // Validate student-specific code
      if (data.targetStudentId && data.targetStudentId !== currentStudentId) {
        setStatus('error')
        setMessage(`Code "${normalized}" is assigned to a different student.`)
        return
      }

      // Check if this student has already used this code (one-time use for lesson/subject codes)
      if (data.usedByStudentIds?.includes(currentStudentId)) {
        setStatus('error')
        setMessage(`Code "${normalized}" has already been used. Ask your teacher for a new one.`)
        return
      }

      // ── Subject code with specific week/lesson list ──
      if (data.type === 'subject' && data.lessonIds?.length) {
        if (!data.lessonIds.includes(targetId)) {
          setStatus('error')
          setMessage(`Code "${normalized}" isn't valid for this lesson.`)
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
          setMessage(`Code "${normalized}" isn't valid for this test.`)
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
          setMessage(`Code "${normalized}" has already been used. Ask your teacher for a new one.`)
          return
        }
        if (data.targetId && data.targetId !== targetId) {
          setStatus('error')
          setMessage(`Code "${normalized}" isn't valid for this test.`)
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
          setMessage(`Code "${normalized}" isn't valid for this lesson.`)
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
      setMessage(`Code "${normalized}" isn't for this ${type === 'quiz' ? 'test' : type}.`)
    } catch (err) {
      console.error('Unlock error:', err)
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" suppressHydrationWarning>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {status === 'success' ? (
                // The unlock is a real accomplishment moment for a student —
                // worth a beat of genuine feedback instead of a form field
                // just quietly turning green and vanishing 1.5s later.
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-10 flex flex-col items-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="relative w-16 h-16 mb-4"
                  >
                    <div className="absolute inset-0 rounded-full bg-success/15 flex items-center justify-center text-success">
                      <CheckCircle2 size={32} />
                    </div>
                    {/* Three subject-colored dots ping outward once — a small
                        callback to the AtomLogo motif instead of a generic
                        confetti burst, so it still reads as this product. */}
                    {['hsl(var(--subject-biology))', 'hsl(var(--subject-chemistry))', 'hsl(var(--subject-physics))'].map((color, i) => (
                      <motion.span
                        key={color}
                        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ background: color }}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{
                          x: Math.cos((i * 2 * Math.PI) / 3) * 34,
                          y: Math.sin((i * 2 * Math.PI) / 3) * 34,
                          opacity: 0,
                        }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    ))}
                  </motion.div>
                  <h3 className="font-semibold text-foreground">Unlocked!</h3>
                  <p className="text-sm text-muted-foreground mt-1">{message}</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <KeyRound size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Unlock Access</h3>
                        <p className="text-xs text-muted-foreground">Required for {title}</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      aria-label="Close"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Teacher Access Code
                      </label>
                      <Input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE HERE"
                        disabled={status === 'loading'}
                        autoFocus
                        className="text-xl font-mono font-semibold text-center tracking-widest h-auto py-4"
                      />
                    </div>

                    {message && status === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg flex items-start gap-3 text-sm font-medium border bg-destructive/10 text-destructive border-destructive/20"
                      >
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        {message}
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
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
                        disabled={!code.trim() || status === 'loading'}
                        isLoading={status === 'loading'}
                      >
                        {status !== 'loading' && 'Unlock Now'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
