import { useEffect, useState } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { StudentSidebar } from '../components/layout/StudentSidebar'
import { Toaster, ErrorModal } from '../components/ui/Notifications'
import { cn } from '../lib/utils'
import { Menu } from 'lucide-react'

export default function AppPage() {
  const { theme, currentStudentId } = useAppStore()
  const navigate = useNavigate()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (!currentStudentId) navigate('/login')
  }, [currentStudentId, navigate])

  return (
    <div className={cn('flex min-h-dvh bg-surface text-foreground', theme)}>
      <StudentSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <Toaster />
      <ErrorModal />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="sticky top-0 z-30 md:hidden bg-surface/95 backdrop-blur border-b border-border px-4 py-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
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
