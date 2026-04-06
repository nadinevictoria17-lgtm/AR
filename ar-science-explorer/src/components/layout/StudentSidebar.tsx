import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, BookOpen, Trophy, ChevronLeft, ChevronRight, LogOut, Atom, Sun, Moon, X, AlertCircle, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import type { SubjectKey } from '../../types'

const SUBJECT_DOT: Record<SubjectKey, string> = {
  biology:   'bg-subject-biology',
  chemistry: 'bg-subject-chemistry',
}

const NAV_ITEMS: { path: string; icon: LucideIcon; label: string }[] = [
  { path: '/app/home', icon: Home, label: 'Home' },
  { path: '/app/learn', icon: BookOpen, label: 'AR + Learn' },
  { path: '/app/progress', icon: Trophy, label: 'Progress' },
]

interface StudentSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({
  collapsed,
  isMobile = false,
  onMobileClose,
}: {
  collapsed: boolean;
  isMobile?: boolean;
  onMobileClose?: () => void;
}) {
  const { theme, toggleTheme, unlocked, currentStudentId } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [showExitConfirmation, setShowExitConfirmation] = useState(false)
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null)

  const isInQuiz = location.pathname === '/app/quiz'

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (isInQuiz && path !== '/app/quiz') {
      e.preventDefault()
      setPendingNavPath(path)
      setShowExitConfirmation(true)
    }
  }

  const handleConfirmNavigation = () => {
    setShowExitConfirmation(false)
    if (pendingNavPath) {
      navigate(pendingNavPath)
    }
    setPendingNavPath(null)
  }

  const handleCancelNavigation = () => {
    setShowExitConfirmation(false)
    setPendingNavPath(null)
  }

  const unlockedSubjects = Object.entries(unlocked)
    .filter(([, v]) => v)
    .map(([k]) => k as SubjectKey)

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
                {currentStudentId && (
                  <p className="text-[10px] text-muted-foreground truncate">{currentStudentId}</p>
                )}
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
          // Custom active detection: AR + Learn is active on /learn, /arlab, or /quiz
          const isLearningPath = path === '/app/learn' && (location.pathname === '/app/learn' || location.pathname === '/app/arlab' || location.pathname === '/app/quiz')
          const customIsActive = isLearningPath || (path !== '/app/learn' && location.pathname === path)

          return (
            <NavLink
              key={path}
              to={path}
              onClick={(e) => {
                handleNavClick(e, path)
                if (isMobile) onMobileClose?.()
              }}
              title={collapsed ? label : undefined}
              className={({ isActive }) => {
                const active = customIsActive || isActive
                return cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )
              }}
            >
              {({ isActive }) => {
                const active = customIsActive || isActive
                return (
                  <>
                    <Icon size={18} className={cn('shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
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
                    {active && !collapsed && (
                      <motion.div
                        layoutId={isMobile ? 'studentActiveIndicatorMobile' : 'studentActiveIndicator'}
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                      />
                    )}
                  </>
                )
              }}
            </NavLink>
          )
        })}

        {!collapsed && unlockedSubjects.length > 0 && (
          <div className="pt-4 px-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Unlocked
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unlockedSubjects.map((s) => (
                <div key={s} className={cn('w-2 h-2 rounded-full', SUBJECT_DOT[s])} title={s} />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="px-2 py-3 border-t border-border space-y-1">
        <button
          onClick={toggleTheme}
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
          onClick={() => { window.location.href = '/login' }}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all',
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

      {/* Quiz Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirmation && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelNavigation}
              className="fixed inset-0 bg-black/40 z-40"
              aria-label="Close confirmation modal"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <Card className="w-full max-w-sm mx-4 p-6 pointer-events-auto">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="text-destructive shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-foreground">Exit Quiz?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Going back will submit your quiz with your current answers.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelNavigation}
                    className="text-foreground"
                  >
                    Continue Quiz
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleConfirmNavigation}
                  >
                    Submit & Exit
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export function StudentSidebar({ mobileOpen, onMobileClose }: StudentSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex relative flex-shrink-0 h-dvh sticky top-0 flex-col bg-background border-r border-border overflow-hidden"
      >
        <SidebarContent collapsed={collapsed} />
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
              <SidebarContent
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
