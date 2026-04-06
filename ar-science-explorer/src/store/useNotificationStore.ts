import { create } from 'zustand'

export type NotificationType = 'success' | 'destructive' | 'info' | 'warning'

export interface Toast {
  id: string
  title?: string
  description: string
  type: NotificationType
}

interface ConfirmModalState {
  title:          string
  message:        string
  confirmLabel?:  string
  /** Visual variant of the confirm button. Defaults to 'destructive'. */
  confirmVariant?: 'default' | 'destructive'
  show:           boolean
  onConfirm?:     () => void | Promise<void>
  onCancel?:      () => void
}

interface NotificationState {
  toasts: Toast[]
  showToast:    (toast: Omit<Toast, 'id'>) => void
  removeToast:  (id: string) => void

  errorModal: { title: string; message: string; show: boolean }
  showErrorModal: (title: string, message: string) => void
  hideErrorModal: () => void

  confirmModal: ConfirmModalState
  showConfirmModal: (
    title:          string,
    message:        string,
    onConfirm?:     () => void | Promise<void>,
    onCancel?:      () => void,
    confirmLabel?:  string,
    confirmVariant?: 'default' | 'destructive'
  ) => void
  hideConfirmModal: () => void

  loading:    boolean
  setLoading: (loading: boolean) => void
}

let loadingTimeout: ReturnType<typeof setTimeout> | null = null

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],
  showToast: (t) => {
    const id = Math.random().toString(36).slice(2, 9)
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    setTimeout(() => get().removeToast(id), 5000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  errorModal: { title: '', message: '', show: false },
  showErrorModal: (title, message) => set({ errorModal: { title, message, show: true } }),
  hideErrorModal: () => set({ errorModal: { ...get().errorModal, show: false } }),

  confirmModal: { title: '', message: '', confirmLabel: 'Delete', confirmVariant: 'destructive', show: false },
  showConfirmModal: (title, message, onConfirm, onCancel, confirmLabel = 'Delete', confirmVariant = 'destructive') =>
    set({ confirmModal: { title, message, confirmLabel, confirmVariant, show: true, onConfirm, onCancel } }),
  hideConfirmModal: () => set({ confirmModal: { ...get().confirmModal, show: false } }),

  loading: false,
  setLoading: (l) => {
    set({ loading: l })

    if (l) {
      if (loadingTimeout) clearTimeout(loadingTimeout)
      loadingTimeout = setTimeout(() => {
        if (get().loading) {
          get().showErrorModal(
            'Connection Slow',
            'This is taking longer than expected. Please check your internet connection or try refreshing the page.'
          )
        }
      }, 10000)
    } else {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
        loadingTimeout = null
      }
    }
  },
}))
