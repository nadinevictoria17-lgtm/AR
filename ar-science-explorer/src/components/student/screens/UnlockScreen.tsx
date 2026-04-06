import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../../../store/useAppStore'
import { cn } from '../../../lib/utils'
import { pageVariants, SUBJECT_STYLES } from '../../../lib/variants'
import { KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react'
import type { SubjectKey } from '../../../types'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Card } from '../../ui/card'

function BackNav({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="gap-1.5">
      <ArrowLeft size={14} />
      {label}
    </Button>
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

      <Card className="p-5">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Access Code</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setMessage(null) }}
            placeholder="e.g. UNLOCK2"
            className="flex-1 font-mono tracking-widest"
          />
          <Button
            onClick={async () => {
              const res = await applyAccessCode(code)
              if (res.invalid) setMessage('Invalid code. Ask your teacher for the correct access code.')
              else setMessage(`Unlocked: ${res.unlocked.join(', ')}`)
              setCode('')
            }}
            disabled={!code.trim()}
            className="sm:w-auto"
          >
            Unlock
          </Button>
        </div>
        {message && (
          <p className={cn('mt-3 text-sm font-medium', message.startsWith('Unlocked') ? 'text-success' : 'text-destructive')}>
            {message}
          </p>
        )}
      </Card>

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
        <Button variant="outline" onClick={() => setScreen('home')}>
          Continue to Dashboard
        </Button>
      </div>
    </motion.div>
  )
}
