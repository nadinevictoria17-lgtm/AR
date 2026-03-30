import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold transition bg-muted text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}
