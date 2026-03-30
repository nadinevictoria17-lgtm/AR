import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, User, Lock, Moon, Sun, LogIn } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/utils'
import { CredentialField } from '../components/auth/CredentialField'
import { validateIdentifier, validatePassword } from '../lib/auth'
import { storage } from '../lib/storage'

type Role = 'student' | 'teacher'

export default function LoginPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme, setCurrentStudentId, setScreen } = useAppStore()

  const [role, setRole] = useState<Role>('student')
  const [id, setId] = useState('000000')
  const [password, setPassword] = useState('123456')
  const [showPass, setShowPass] = useState(false)
  const [idError, setIdError] = useState('')
  const [passError, setPassError] = useState('')

  const handleIdChange = (v: string) => {
    if (role === 'student') {
      setId(v.replace(/\D/g, '').slice(0, 6))
    } else {
      setId(v)
    }
    setIdError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ie = validateIdentifier(role, id)
    const pe = validatePassword(role, password)
    setIdError(ie)
    setPassError(pe)
    if (ie || pe) return
    if (role === 'student') {
      storage.ensureStudentRecord(id)
      setCurrentStudentId(id)
      setScreen('unlock')
      navigate('/app')
    } else {
      navigate('/teacher')
    }
  }

  return (
    <div className={cn('min-h-screen', theme)}>
      <div className="min-h-dvh w-full flex bg-surface text-foreground">
        <aside className="hidden md:flex w-64 border-r border-border bg-background p-6 flex-col justify-between">
          <div>
            <AtomLogo />
            <h1 className="mt-5 text-2xl font-bold leading-tight">AR Science <span className="text-gradient">Explorer</span></h1>
            <p className="mt-2 text-xs text-muted-foreground">Pasig Catholic College · Grade 7</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Authentication</p>
            <p>Lessons</p>
            <p>Labs</p>
            <p>AR Experiments</p>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-10">
            <div className="md:hidden flex items-center gap-3 mb-6">
              <AtomLogo size="sm" />
              <div>
                <h1 className="text-lg font-bold">AR Science Explorer</h1>
                <p className="text-xs text-muted-foreground">Grade 7 Learning App</p>
              </div>
            </div>
            <div className="w-full max-w-md ml-auto mr-auto">
              <button
                onClick={toggleTheme}
                className="ml-auto mb-6 flex w-9 h-9 rounded-xl items-center justify-center bg-muted text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
                <p className="text-sm text-muted-foreground mb-8">Sign in to continue to your science dashboard</p>

                <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8">
                  {(['student', 'teacher'] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r)
                        setId(r === 'student' ? '000000' : 'teacher.debug@school.edu')
                        setPassword('123456')
                        setIdError('')
                        setPassError('')
                      }}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200',
                        role === r ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <CredentialField
                    label={role === 'student' ? 'Student ID' : 'Email Address'}
                    value={id}
                    onChange={handleIdChange}
                    onBlur={() => setIdError(validateIdentifier(role, id))}
                    placeholder={role === 'student' ? '000000' : 'teacher.debug@school.edu'}
                    type={role === 'teacher' ? 'email' : 'text'}
                    error={idError}
                    icon={User}
                  />

                  <CredentialField
                    label="Password"
                    value={password}
                    onChange={(value) => { setPassword(value); setPassError('') }}
                    onBlur={() => setPassError(validatePassword(role, password))}
                    placeholder="any password"
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

                  <div className="text-right">
                    <button type="button" className="text-xs text-primary font-semibold hover:underline">
                      Forgot password?
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm btn-glow hover:bg-primary/90 transition-all"
                  >
                    <LogIn size={16} />
                    Sign In as {role === 'student' ? 'Student' : 'Teacher'}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function AtomLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 80 : 110
  return (
    <div className="relative" style={{ width: dim, height: dim }}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full z-10"
        style={{
          width: dim * 0.3,
          height: dim * 0.3,
          background: 'radial-gradient(circle at 35% 30%, hsl(var(--subject-physics)), hsl(var(--primary)))',
          boxShadow: '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.3)',
        }}
      />
      {[
        { color: 'hsl(var(--subject-physics))', dir: 'normal', i: 0 },
        { color: 'hsl(var(--subject-chemistry))', dir: 'reverse', i: 1 },
        { color: 'hsl(var(--subject-earth))', dir: 'normal', i: 2 },
      ].map(({ color, dir, i }) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: color,
            borderWidth: '1.5px',
            opacity: 0.6,
            animation: `orbit ${2.8 + i * 0.6}s linear infinite ${dir}`,
            animationDelay: `${i * 0.3}s`,
            transform: `rotateX(70deg) rotateZ(${i * 60}deg)`,
          }}
        >
          <div
            className="absolute w-2 h-2 rounded-full -top-1 left-1/2 -translate-x-1/2"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
        </div>
      ))}
    </div>
  )
}
