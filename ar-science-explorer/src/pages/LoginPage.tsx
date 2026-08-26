import { useState } from 'react'
import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { Eye, EyeOff, User, Lock, Moon, Sun, ArrowRight, Loader, Atom } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/utils'
import { CredentialField } from '../components/auth/CredentialField'
import { validateIdentifier, validatePassword } from '../lib/auth'
import { storage } from '../lib/storage'
import { firebaseStudentLogin, firebaseTeacherLogin } from '../lib/firebaseAuth'
import { Button } from '../components/ui/button'

type Role = 'student' | 'teacher'

export default function LoginPage() {
  const { theme, toggleTheme, setCurrentStudentId } = useAppStore(
    useShallow(s => ({ theme: s.theme, toggleTheme: s.toggleTheme, setCurrentStudentId: s.setCurrentStudentId }))
  )

  const [role, setRole] = useState<Role>('student')
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [idError, setIdError] = useState('')
  const [passError, setPassError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleIdChange = (v: string) => {
    if (role === 'student') {
      // Allow student ID (00-0000 format) or email address
      if (v.includes('@')) {
        // Full email address
        setId(v)
      } else {
        // Just student ID - auto-format as 00-0000
        const digitsOnly = v.replace(/\D/g, '').slice(0, 6)
        if (digitsOnly.length <= 2) {
          setId(digitsOnly)
        } else {
          const formatted = `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`
          setId(formatted)
        }
      }
    } else {
      setId(v)
    }
    setIdError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ie = validateIdentifier(role, id)
    const pe = validatePassword(role, password)
    setIdError(ie)
    setPassError(pe)
    if (ie || pe) return

    setIsLoading(true)

    try {
      if (role === 'student') {
        const cleanId = id.replace('-', '')
        const firebaseResult = await firebaseStudentLogin(cleanId, password)
        if (firebaseResult) {
          // Ensure the Firestore record exists before the app reads it.
          await storage.ensureStudentRecord(cleanId)
          // Seed Zustand so screens that read currentStudentId work immediately.
          setCurrentStudentId(cleanId)
          // No manual navigate — PublicOnlyRoute detects the new Firebase auth
          // state and redirects to /app automatically, avoiding a double-
          // navigation that causes the two-blink flash.
          return
        }

        setPassError('Invalid credentials. Check your internet connection and try again.')
      } else {
        // Guard: a student-format email is never a teacher, even if it
        // authenticates in Firebase. Reject before signing in.
        if (/^\d+@arscience\.school$/i.test(id.trim())) {
          setIdError('This is a student account. Use the Student tab to log in.')
          setIsLoading(false)
          return
        }
        const firebaseUser = await firebaseTeacherLogin(id, password)
        if (firebaseUser) {
          // Same reasoning: let PublicOnlyRoute drive the redirect so
          // TeacherRoute never sees isLoading:true → no skeleton flash.
          return
        }

        setIdError('Invalid email or password. Check your internet connection and try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setPassError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('min-h-screen', theme)}>
      <div className="min-h-dvh w-full flex bg-surface text-foreground">
        {/* ── Left panel: brand surface with a bento preview, no motion/glow ── */}
        <aside className="hidden md:flex w-[400px] shrink-0 border-r border-border bg-background p-8 flex-col justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Atom size={15} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">AR Science Explorer</span>
          </div>

          <div>
            <h1 className="text-[26px] font-semibold leading-[1.15] tracking-tight text-foreground mb-3">
              Science, seen up close.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px] mb-6">
              Augmented reality labs, lessons, and assessments for Grade 7 Science.
            </p>

            {/* Bento preview: irregular tiles, not a text list */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2 rounded-lg border border-border p-3.5">
                <p className="text-xs font-medium text-foreground">AR Labs</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Scan a marker, see it in 3D</p>
              </div>
              <div className="rounded-lg border border-border p-3.5">
                <p className="text-xs font-medium text-foreground">Lessons</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Guided study</p>
              </div>
              <div className="rounded-lg border border-border p-3.5">
                <p className="text-xs font-medium text-foreground">Tests</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Track progress</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Pasig Catholic College · Grade 7</p>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
          <div className="md:hidden flex items-center gap-2.5 px-4 py-4 border-b border-border">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Atom size={13} className="text-primary-foreground" />
            </div>
            <span className="text-[13px] font-semibold">AR Science Explorer</span>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
            <div className="w-full max-w-[360px]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">Continue to your dashboard</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </Button>
              </div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <div className="flex gap-1 p-1 bg-muted rounded-md mb-6">
                  {(['student', 'teacher'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r)
                        setId('')
                        setPassword('')
                        setIdError('')
                        setPassError('')
                      }}
                      className={cn(
                        'flex-1 py-1.5 rounded-[5px] text-[13px] font-medium capitalize transition-colors duration-150',
                        role === r
                          ? 'bg-card text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <CredentialField
                    label={role === 'student' ? 'Student ID' : 'Email address'}
                    value={id}
                    onChange={handleIdChange}
                    onBlur={() => setIdError(validateIdentifier(role, id))}
                    placeholder={role === 'student' ? '00-0000' : 'teacher@school.edu'}
                    type={role === 'teacher' ? 'email' : 'text'}
                    error={idError}
                    icon={User}
                  />

                  <CredentialField
                    label="Password"
                    value={password}
                    onChange={(value) => { setPassword(value); setPassError('') }}
                    onBlur={() => setPassError(validatePassword(role, password))}
                    placeholder="Enter your password"
                    type={showPass ? 'text' : 'password'}
                    error={passError}
                    icon={Lock}
                    maxLength={undefined}
                    rightSlot={(
                      <button
                        type="button"
                        onClick={() => setShowPass((p) => !p)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    isLoading={isLoading}
                    className="w-full h-10"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={14} className="animate-spin" />
                        Signing in
                      </>
                    ) : (
                      <>
                        Sign in as {role === 'student' ? 'student' : 'teacher'}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
