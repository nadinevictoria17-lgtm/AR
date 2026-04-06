import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getUnlockCodeData } from '../../lib/unlockCodeManager'
import { storage } from '../../lib/storage'
import { useAppStore } from '../../store/useAppStore'

interface AccessCodeModalProps {
  isOpen: boolean
  onClose: () => void
  targetId: string
  type: 'lesson' | 'quiz'
  title: string
  onSuccess: () => void
}

export function AccessCodeModal({ isOpen, onClose, targetId, type, title, onSuccess }: AccessCodeModalProps) {
  const { currentStudentId, unlockSubject } = useAppStore()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleUnlock = async () => {
    if (!code.trim() || !currentStudentId) return
    
    setStatus('loading')
    setMessage('')

    try {
      const data = await getUnlockCodeData(code.trim().toUpperCase())
      
      if (!data) {
        setStatus('error')
        setMessage('Invalid access code. Please check with your teacher.')
        return
      }

      // Validate code type and target
      let isValid = false
      if (data.type === 'subject' && data.subjects) {
        // Subject codes unlock entire subjects
        for (const sub of data.subjects) {
          unlockSubject(sub)
        }
        isValid = true
      } else if (data.type === type && data.targetId === targetId) {
        // Specific lesson/quiz code
        isValid = true
      } else if (data.type === type && !data.targetId) {
        // Universal lesson/quiz code (if implemented)
        isValid = true
      }

      if (isValid) {
        const success = await storage.unlockContent(currentStudentId, targetId, type)
        if (success) {
          setStatus('success')
          setMessage(`${type === 'lesson' ? 'Lesson' : 'Quiz'} unlocked successfully!`)
          setTimeout(() => {
            onSuccess()
            onClose()
            setCode('')
            setStatus('idle')
          }, 1500)
        } else {
          throw new Error('Storage update failed')
        }
      } else {
        setStatus('error')
        setMessage(`This code is not for this ${type}.`)
      }
    } catch (err) {
      console.error('Unlock error:', err)
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }

  // Ensure hydration matches and document is available
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
                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Teacher Access Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE HERE"
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full px-5 py-4 bg-muted/50 border-2 border-border rounded-2xl text-xl font-mono font-black text-center tracking-widest focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  autoFocus
                />
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-2xl flex items-start gap-3 text-sm font-medium",
                    status === 'error' ? "bg-red-500/10 text-red-600 border border-red-500/20" : "bg-green-500/10 text-green-600 border border-green-500/20"
                  )}
                >
                  {status === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
                  {message}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-4 rounded-2xl border border-border font-bold text-muted-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnlock}
                  disabled={!code.trim() || status === 'loading' || status === 'success'}
                  className="px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>Unlock Now</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
