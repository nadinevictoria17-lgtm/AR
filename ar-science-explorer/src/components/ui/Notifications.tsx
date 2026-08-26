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
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-[380px]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'relative grid gap-1 p-3.5 rounded-lg border shadow-popover bg-card',
              t.type === 'success'     && 'border-success/25',
              t.type === 'destructive' && 'border-destructive/25',
              t.type === 'warning'     && 'border-warning/25',
              t.type === 'info'        && 'border-border'
            )}
          >
            <div className="flex items-start gap-2.5">
              {t.type === 'success'     && <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-success" />}
              {t.type === 'destructive' && <AlertCircle  size={17} className="shrink-0 mt-0.5 text-destructive" />}
              {t.type === 'warning'     && <AlertCircle  size={17} className="shrink-0 mt-0.5 text-warning" />}
              {t.type === 'info'        && <Info         size={17} className="shrink-0 mt-0.5 text-primary" />}

              <div className="flex-1 min-w-0">
                {t.title && <p className="text-[13px] font-semibold leading-tight mb-0.5 text-foreground">{t.title}</p>}
                <p className="text-[13px] text-muted-foreground leading-snug">{t.description}</p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="p-1 -m-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X size={13} />
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
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-xl p-6 shadow-popover"
          >
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{errorModal.title}</h3>
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
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-xl p-6 shadow-popover"
          >
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning mb-4">
              <AlertCircle size={20} />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{confirmModal.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{confirmModal.message}</p>
            <div className="flex gap-2.5">
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
