import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../../store/useAppStore'
import { cn } from '../../../lib/utils'
import { KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react'
import type { SubjectKey } from '../../../types'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

const SUBJECT_STYLES: Record<SubjectKey, { border: string; badge: string }> = {
  biology:   { border: 'border-subject-biology/25',   badge: 'bg-subject-biology/15 text-subject-biology border-subject-biology/30' },
  chemistry: { border: 'border-subject-chemistry/25', badge: 'bg-subject-chemistry/15 text-subject-chemistry border-subject-chemistry/30' },
}

function BackNav({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <ArrowLeft size={14} />
      {label}
    </button>
  )
}

export function UnlockScreen() {
  const { unlocked, applyAccessCode, setScreen } = useAppStore()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const locked = (Object.entries(unlocked) as [SubjectKey, boolean][])
    .filter(([, v]) => !v)
    .map(([k]) => k)

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <BackNav onClick={() => setScreen('home')} label="Back to Home" />
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <KeyRound size={18} className="text-primary" /> Unlock Subjects
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Enter an access code from your teacher to unlock new subjects.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Access Code</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setMessage(null) }}
            placeholder="e.g. UNLOCK2"
            className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={async () => {
              const res = await applyAccessCode(code)
              if (res.invalid) setMessage('Invalid code. Ask your teacher for the correct access code.')
              else setMessage(`Unlocked: ${res.unlocked.join(', ')}`)
              setCode('')
            }}
            className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Unlock
          </button>
        </div>
        {message && (
          <p className={cn('mt-3 text-sm', message.startsWith('Unlocked') ? 'text-primary' : 'text-destructive')}>
            {message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.entries(unlocked) as [SubjectKey, boolean][]).map(([subject, isUnlocked]) => {
          const s = SUBJECT_STYLES[subject]
          return (
            <div key={subject} className={cn('rounded-2xl border p-4 bg-card flex items-center gap-3', s.border)}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.badge)}>
                <CheckCircle2 size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground capitalize">{subject}</p>
                <p className="text-xs text-muted-foreground">{isUnlocked ? 'Unlocked' : 'Locked'}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{locked.length > 0 ? `${locked.length} subjects still locked` : 'All subjects unlocked'}</p>
        <button onClick={() => setScreen('home')} className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
          Continue to Dashboard
        </button>
      </div>
    </motion.div>
  )
}
