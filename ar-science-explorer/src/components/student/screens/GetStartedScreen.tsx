import { motion } from 'framer-motion'
import { useAppStore } from '../../../store/useAppStore'
import { cn } from '../../../lib/utils'
import { pageVariants, SUBJECT_STYLES } from '../../../lib/variants'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'

export function GetStartedScreen() {
  const { setScreen } = useAppStore()
  const navigate = useNavigate()

  const handleStart = () => {
    setScreen('home')
    navigate('/app/home')
  }

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate"
      className="min-h-full flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-10"
          style={{ background: 'radial-gradient(circle at 35% 30%, hsl(var(--subject-chemistry)), hsl(var(--primary)))', boxShadow: '0 0 24px hsl(var(--primary) / 0.6)' }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute inset-0 rounded-full border opacity-60"
            style={{
              borderColor: ['hsl(var(--subject-chemistry))', 'hsl(var(--subject-biology))', 'hsl(var(--subject-physics))'][i],
              animation: `orbit ${2.8 + i * 0.6}s linear infinite ${i % 2 === 0 ? 'normal' : 'reverse'}`,
              transform: `rotateX(70deg) rotateZ(${i * 60}deg)`,
            }}>
            <div className="absolute w-2.5 h-2.5 rounded-full -top-1.5 left-1/2 -translate-x-1/2"
              style={{ background: ['hsl(var(--subject-chemistry))', 'hsl(var(--subject-biology))', 'hsl(var(--subject-physics))'][i] }} />
          </div>
        ))}
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">AR Science<br /><span className="text-gradient">Explorer</span></h1>
      <p className="text-sm text-muted-foreground mb-2 font-medium">Pasig Catholic College · Grade 7</p>
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {(['chemistry', 'biology', 'physics'] as const).map((s) => (
          <span key={s} className={cn('px-3 py-1 rounded-full border text-xs font-semibold capitalize', SUBJECT_STYLES[s].badge)}>{s}</span>
        ))}
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="mb-4">
        <Button size="lg" onClick={handleStart} className="px-10 rounded-2xl btn-glow font-bold">
          Get Started
        </Button>
      </motion.div>
      <p className="text-xs text-muted-foreground">Tap to begin your science journey</p>
    </motion.div>
  )
}
