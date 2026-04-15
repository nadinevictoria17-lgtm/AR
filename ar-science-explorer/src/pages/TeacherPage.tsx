import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Menu } from 'lucide-react'
import { TeacherSidebar } from '../components/layout/TeacherSidebar'
import { Toaster, ErrorModal, ConfirmModal } from '../components/ui/Notifications'
import { cn } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'
import { firebaseSignOut } from '../lib/firebaseAuth'

export function TeacherPage() {
  const { theme, toggleTheme } = useAppStore(
    useShallow(s => ({ theme: s.theme, toggleTheme: s.toggleTheme }))
  )
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await firebaseSignOut()
    // replace: true removes the current teacher route from history so
    // the back button cannot return to a protected page after logout
    navigate('/login', { replace: true })
  }

  return (
    <div className={cn('flex min-h-dvh bg-surface text-foreground font-sans', theme)}>
      <Toaster />
      <ErrorModal />
      <ConfirmModal />
      <TeacherSidebar
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-30 md:hidden bg-surface/90 backdrop-blur border-b border-border px-4 py-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
