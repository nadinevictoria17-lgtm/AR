import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '../../lib/utils'
import { getUnlockCodeData, trackCodeUsage } from '../../lib/unlockCodeManager'
import { storage } from '../../lib/storage'
import { useAppStore } from '../../store/useAppStore'
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
        const quizId = `builtin-${targetId}`
        const applied = await storage.applyQuizUnlockCode(currentStudentId, quizId, normalized)
        if (applied) {
          await storage.markQuizAsRetakeable(currentStudentId, quizId)
          setStatus('success')
          setMessage('Quiz unlocked successfully!')
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

      // ── Manually-created quiz retake code (stored as type 'quiz' in unlockCodes) ──
      if (data.type === 'quiz' && type === 'quiz') {
        // Enforce one-time use
        if (data.isUsed) {
          setStatus('error')
          setMessage('This code has already been used. Ask your teacher for a new one.')
          return
        }
        if (data.targetId && data.targetId !== targetId) {
          setStatus('error')
          setMessage('This code is not valid for this quiz.')
          return
        }
        const quizId = `builtin-${targetId}`
        await storage.markQuizAsRetakeable(currentStudentId, quizId)
        await trackCodeUsage(normalized, currentStudentId, true) // markAsUsed=true (1-time use)
        setStatus('success')
        setMessage('Quiz unlocked successfully!')
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
      setMessage(`This code is not for this ${type}.`)
    } catch (err) {
      console.error('Unlock error:', err)
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Unlock Access</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Required for {title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Teacher Access Code
                </label>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE HERE"
                  disabled={status === 'loading' || status === 'success'}
                  autoFocus
                  className="text-xl font-mono font-black text-center tracking-widest h-auto py-4"
                />
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'p-4 rounded-2xl flex items-start gap-3 text-sm font-medium border',
                    status === 'error'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-success/10 text-success border-success/20'
                  )}
                >
                  {status === 'error'
                    ? <AlertCircle  size={18} className="shrink-0 mt-0.5" />
                    : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                  }
                  {message}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onClose}
                  className="rounded-2xl"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleUnlock}
                  disabled={!code.trim() || status === 'loading' || status === 'success'}
                  isLoading={status === 'loading'}
                  className="rounded-2xl btn-glow"
                >
                  {status !== 'loading' && 'Unlock Now'}
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
