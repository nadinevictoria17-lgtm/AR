import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Brain, BookOpen, Users, Lock,
  ChevronLeft, ChevronRight, LogOut, Atom, X, Sun, Moon,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { NavLink } from 'react-router-dom'

interface Props {
  onLogout?: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

const SIDEBAR_TRANSITION = { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } as const

const NAV_ITEMS: { path: string; icon: LucideIcon; label: string }[] = [
  { path: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/teacher/quizzes',   icon: Brain,           label: 'Quizzes' },
  { path: '/teacher/lessons',   icon: BookOpen,        label: 'Lessons' },
  { path: '/teacher/students',  icon: Users,           label: 'Students' },
  { path: '/teacher/codes',     icon: Lock,            label: 'Access Codes' },
]

function SidebarInner({
  onLogout,
  theme,
  onToggleTheme,
  collapsed,
  isMobile = false,
  onMobileClose,
}: {
  onLogout?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  collapsed: boolean;
  isMobile?: boolean;
  onMobileClose?: () => void;
}) {
  return (
    <>
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-border',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Atom size={15} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">AR Science</p>
                <p className="text-[10px] text-muted-foreground truncate">Teacher Portal</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Atom size={15} className="text-primary" />
          </div>
        )}
        {isMobile && !collapsed && (
          <button
            onClick={onMobileClose}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          return (
            <NavLink
              key={path}
              to={path}
              onClick={() => {
                if (isMobile) onMobileClose?.()
              }}
              title={collapsed ? label : undefined}
              className={({ isActive }) => cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={cn('shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="truncate overflow-hidden whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !collapsed && (
                    <motion.div
                      layoutId={isMobile ? 'teacherActiveIndicatorMobile' : 'teacherActiveIndicator'}
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                    />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-2 py-3 border-t border-border space-y-1">
        <button
          onClick={onToggleTheme}
          title={collapsed ? 'Toggle theme' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all',
            collapsed && 'justify-center px-2'
          )}
        >
          {theme === 'dark' ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="truncate overflow-hidden whitespace-nowrap"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut size={16} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="truncate overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  )
}

export function TeacherSidebar({ onLogout, theme, onToggleTheme, mobileOpen, onMobileClose }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  // The static `style.width` sets the correct width on the very first React
  // paint so there is no flash-of-collapsed-sidebar before Framer Motion's
  // JavaScript take-over (which happens one frame later).
  const sidebarWidth = collapsed ? 72 : 240

  return (
    <>
      <motion.aside
        initial={false}
        style={{ width: sidebarWidth }}
        animate={{ width: sidebarWidth }}
        transition={SIDEBAR_TRANSITION}
        className="hidden md:flex relative flex-shrink-0 h-dvh sticky top-0 flex-col bg-background border-r border-border overflow-hidden"
      >
        <SidebarInner onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors z-10"
          aria-label="Toggle sidebar width"
        >
          {collapsed
            ? <ChevronRight size={12} className="text-muted-foreground" />
            : <ChevronLeft size={12} className="text-muted-foreground" />
          }
        </button>
      </motion.aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="md:hidden fixed inset-0 bg-black/40 z-40"
              aria-label="Close sidebar overlay"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[320px] bg-background border-r border-border flex flex-col"
            >
              <SidebarInner
                onLogout={onLogout}
                theme={theme}
                onToggleTheme={onToggleTheme}
                collapsed={false}
                isMobile
                onMobileClose={onMobileClose}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
