import { cn } from '../../../lib/utils'
import { SUBJECT_STYLES } from '../../../lib/variants'
import { useNavigate } from 'react-router-dom'
import { Atom, ArrowRight, FlaskConical, Dna, Zap } from 'lucide-react'
import { Button } from '../../ui/button'

const SUBJECT_ICONS = { chemistry: FlaskConical, biology: Dna, physics: Zap } as const

export function GetStartedScreen() {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/app/home')
  }

  return (
    <div className="min-h-full flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left: brand + CTA */}
        <div className="text-center md:text-left">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-6 mx-auto md:mx-0">
            <Atom size={24} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-1.5">AR Science Explorer</h1>
          <p className="text-sm text-muted-foreground mb-8">Pasig Catholic College · Grade 7</p>
          <Button size="lg" onClick={handleStart} className="px-8">
            Get started <ArrowRight size={15} />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">Tap to begin your science journey</p>
        </div>

        {/* Right: irregular bento preview of the three subjects */}
        <div className="grid grid-cols-2 gap-3">
          {(['chemistry', 'biology', 'physics'] as const).map((s, i) => {
            const Icon = SUBJECT_ICONS[s]
            const style = SUBJECT_STYLES[s]
            return (
              <div
                key={s}
                className={cn(
                  'rounded-xl border border-border bg-card p-5',
                  i === 0 && 'col-span-2'
                )}
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-4', style.bg, style.text)}>
                  <Icon size={18} />
                </div>
                <p className="text-sm font-medium text-foreground capitalize">{s}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
