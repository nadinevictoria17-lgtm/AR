import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'secondary'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors border',
        variant === 'default' && 'bg-primary text-primary-foreground border-transparent',
        variant === 'outline' && 'bg-background text-foreground border-border',
        variant === 'secondary' && 'bg-muted text-muted-foreground border-border',
        className
      )}
      {...props}
    />
  )
}
