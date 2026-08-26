import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useNotificationStore } from '../../store/useNotificationStore'
import { cn } from '../../lib/utils'
import { Button } from './button'

export function Toaster() {
  const { toasts, removeToast } = useNotificationStore(
    useShallow(s => ({ toasts: s.toasts, removeToast: s.removeToast }))
  )

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-[400px]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={cn(
              'relative grid gap-1 p-4 rounded-2xl border shadow-xl backdrop-blur-md',
              t.type === 'success'     && 'bg-success/10 border-success/20 text-success',
              t.type === 'destructive' && 'bg-destructive/10 border-destructive/20 text-destructive',
              t.type === 'warning'     && 'bg-warning/10 border-warning/20 text-warning',
              t.type === 'info'        && 'bg-primary/10 border-primary/20 text-primary'
            )}
          >
            <div className="flex items-start gap-3">
              {t.type === 'success'     && <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
              {t.type === 'destructive' && <AlertCircle  size={18} className="shrink-0 mt-0.5" />}
              {t.type === 'warning'     && <AlertCircle  size={18} className="shrink-0 mt-0.5" />}
              {t.type === 'info'        && <Info         size={18} className="shrink-0 mt-0.5" />}

              <div className="flex-1">
                {t.title && <p className="text-sm font-bold leading-tight mb-0.5">{t.title}</p>}
                <p className="text-sm opacity-90">{t.description}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-lg hover:bg-foreground/5 transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function ErrorModal() {
  const { errorModal, hideErrorModal } = useNotificationStore(
    useShallow(s => ({ errorModal: s.errorModal, hideErrorModal: s.hideErrorModal }))
  )

  return (
    <AnimatePresence>
      {errorModal.show && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hideErrorModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{errorModal.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{errorModal.message}</p>
            <Button onClick={hideErrorModal} className="w-full">
              Dismiss
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ConfirmModal() {
  const { confirmModal, hideConfirmModal } = useNotificationStore(
    useShallow(s => ({ confirmModal: s.confirmModal, hideConfirmModal: s.hideConfirmModal }))
  )

  const handleConfirm = async () => {
    hideConfirmModal()
    await confirmModal.onConfirm?.()
  }

  const handleCancel = () => {
    confirmModal.onCancel?.()
    hideConfirmModal()
  }

  return (
    <AnimatePresence>
      {confirmModal.show && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                Cancel
              </Button>
              <Button
                variant={confirmModal.confirmVariant ?? 'destructive'}
                onClick={handleConfirm}
                className="flex-1"
              >
                {confirmModal.confirmLabel ?? 'Delete'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
