import { motion } from 'framer-motion'
import { Camera } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { SUBJECT_STYLES } from '../../../lib/variants'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../ui/button'
import { AtomLogo } from '../../ui/AtomLogo'

export function GetStartedScreen() {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/app/home')
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center text-center px-6 py-16">
      <AtomLogo className="mb-8" />
      <h1 className="text-3xl font-bold text-foreground mb-2">AR Science Explorer</h1>
      <p className="text-sm text-muted-foreground mb-6 font-medium">Pasig Catholic College · Grade 7</p>

      {/* Jordan (first-timer) red flag from the design critique: nothing explained
          the AR marker mechanic before "Get Started". One plain sentence fixes it. */}
      <div className="flex items-start gap-2.5 max-w-xs mb-8 text-left bg-muted/60 border border-border rounded-lg px-3.5 py-3">
        <Camera size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Each lesson comes with a printed marker sheet — scan it with your camera to see the model in AR.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {(['chemistry', 'biology', 'physics'] as const).map((s) => (
          <span key={s} className={cn('px-3 py-1 rounded-full border text-xs font-medium capitalize', SUBJECT_STYLES[s].badge)}>{s}</span>
        ))}
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="mb-4">
        <Button size="lg" onClick={handleStart} className="px-10">
          Get Started
        </Button>
      </motion.div>
      <p className="text-xs text-muted-foreground">Tap to begin your science journey</p>
    </div>
  )
}
