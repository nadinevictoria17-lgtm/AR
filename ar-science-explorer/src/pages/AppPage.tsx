import { useState, useCallback, useEffect, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store/useAppStore'
import { useFirebaseAuth } from '../lib/firebaseAuthContext'
import { StudentSidebar } from '../components/layout/StudentSidebar'
import { Toaster, ErrorModal, ConfirmModal } from '../components/ui/Notifications'
import { ContentSkeleton } from '../components/ui/skeleton'
import { cn } from '../lib/utils'
import { LAYOUT, pageVariants } from '../lib/variants'
import { Menu } from 'lucide-react'

export default function AppPage() {
  const { theme, setCurrentStudentId } = useAppStore(
    useShallow(s => ({ theme: s.theme, setCurrentStudentId: s.setCurrentStudentId }))
  )
  const { studentId } = useFirebaseAuth()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const handleMobileClose = useCallback(() => setMobileSidebarOpen(false), [])

  // Sync Firebase studentId to store once when studentId becomes available
  useEffect(() => {
    if (studentId && !studentId.startsWith('teacher')) {
      setCurrentStudentId(studentId)
    }
  }, [studentId, setCurrentStudentId])

  return (
    <div className={cn('flex min-h-dvh bg-surface text-foreground', theme)}>
      <StudentSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleMobileClose}
      />
      <Toaster />
      <ErrorModal />
      <ConfirmModal />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-30 md:hidden bg-surface/95 backdrop-blur border-b border-border px-4 py-2.5">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu size={17} />
          </button>
        </div>
        <div className={cn('w-full mx-auto', LAYOUT.maxWidth, LAYOUT.padding, LAYOUT.spacing)}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Catches each lazy screen chunk here, INSIDE the persistent
                  layout/AnimatePresence — so loading a not-yet-fetched screen
                  never unmounts the sidebar or interrupts the page transition. */}
              <Suspense fallback={<ContentSkeleton />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
