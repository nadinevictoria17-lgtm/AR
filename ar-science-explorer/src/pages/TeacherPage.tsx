import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { TeacherSidebar } from '../components/layout/TeacherSidebar'
import { cn } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'

export function TeacherPage() {
  const { theme, toggleTheme } = useAppStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className={cn('flex min-h-dvh bg-surface text-foreground font-sans', theme)}>
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
