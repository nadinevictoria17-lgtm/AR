/**
 * A small circular progress indicator — real utility (at-a-glance percent
 * complete), not decoration. The stroke animates in once on mount, which is
 * the kind of "meaningful moment" delight the design system calls for
 * (mastery/progress), not a manufactured celebration for an ordinary click.
 */
import { motion } from 'framer-motion'

export function ProgressRing({
  percent,
  size = 56,
  strokeWidth = 5,
  className,
}: {
  percent: number
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
    </div>
  )
}
