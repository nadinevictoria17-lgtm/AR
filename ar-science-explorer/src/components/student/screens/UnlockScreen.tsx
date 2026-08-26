import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../../store/useAppStore'
import { cn } from '../../../lib/utils'
import { SUBJECT_STYLES } from '../../../lib/variants'
import { KeyRound, CheckCircle2, Lock, ArrowLeft } from 'lucide-react'
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
  const { unlocked, applyAccessCode } = useAppStore(
    useShallow(s => ({ unlocked: s.unlocked, applyAccessCode: s.applyAccessCode }))
  )
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const entries = Object.entries(unlocked) as [SubjectKey, boolean][]
  const locked = entries.filter(([, v]) => !v).map(([k]) => k)

  return (
    <div className="space-y-5 pb-10">
      <BackNav onClick={() => navigate('/app/home')} label="Back to Home" />

      {/* ── Hero: unlock form as the full-bleed dark banner ─────────── */}
      <div className="rounded-xl border border-border bg-foreground text-background p-6 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <KeyRound size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Unlock subjects</h1>
            <p className="text-[13px] text-background/55">Enter an access code from your teacher.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <Input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setMessage(null) }}
            placeholder="e.g. UNLOCK2"
            className="flex-1 font-mono tracking-widest bg-background/10 border-background/15 text-background placeholder:text-background/40"
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
      </div>

      {/* ── Bento grid: one tile per subject, sized by lock state ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {entries.map(([subject, isUnlocked]) => {
          const s = SUBJECT_STYLES[subject]
          return (
            <Card key={subject} className={cn('p-5', !isUnlocked && 'opacity-70')}>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-4', s.bg, s.text)}>
                {isUnlocked ? <CheckCircle2 size={17} /> : <Lock size={16} className="text-muted-foreground" />}
              </div>
              <p className="text-sm font-medium text-foreground capitalize">{subject}</p>
              <p className={cn('text-xs mt-0.5', isUnlocked ? 'text-success' : 'text-muted-foreground')}>
                {isUnlocked ? 'Unlocked' : 'Locked'}
              </p>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">{locked.length > 0 ? `${locked.length} subject${locked.length > 1 ? 's' : ''} still locked` : 'All subjects unlocked'}</p>
        <Button variant="outline" onClick={() => navigate('/app/home')}>
          Continue to dashboard
        </Button>
      </div>
    </div>
  )
}
