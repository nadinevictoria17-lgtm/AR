import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'
import { UnlockCodeManager } from '../UnlockCodeManager'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export function UnlockCodesTab() {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <KeyRound size={20} className="text-primary" /> Unlock Codes
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Generate and manage codes for subject unlocks and quiz retakes.</p>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">Quick Guide</p>
            <div className="space-y-4">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="text-sm font-semibold text-foreground mb-1">Subject Unlock Codes</p>
                <p className="text-xs text-muted-foreground italic">Generate these below to unlock entire subjects for all students.</p>
              </div>
              <div className="rounded-xl bg-muted/30 border border-border p-4 opacity-60">
                <p className="text-sm font-semibold text-foreground mb-1">Quiz Unlock Codes</p>
                <p className="text-xs text-muted-foreground italic">Generate these from the Students tab for specific students' retakes.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <UnlockCodeManager />
        </div>
      </div>
    </motion.div>
  )
}
