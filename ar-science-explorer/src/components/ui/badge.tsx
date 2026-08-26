import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'warning' | 'success'
  size?: 'sm' | 'md'
}

export function Badge({ className, variant = 'default', size = 'sm', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-primary text-primary-foreground border-transparent',
    outline: 'bg-background text-foreground border-border',
    secondary: 'bg-muted text-muted-foreground border-border',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    success: 'bg-success/10 text-success border-success/20',
  }

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-bold transition-colors border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}
