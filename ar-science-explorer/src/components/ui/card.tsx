import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

export function Card({ className, size = 'md', interactive = false, ...props }: CardProps) {
  const sizeStyles = {
    sm: 'rounded-lg border border-border shadow-sm',
    md: 'rounded-2xl border border-border shadow-sm',
    lg: 'rounded-3xl border border-border shadow-lg',
  }

  return (
    <div
      className={cn(
        'bg-card',
        sizeStyles[size],
        interactive && 'hover:border-primary/30 hover:shadow-md transition-all cursor-pointer',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4 border-b border-border/50', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold text-lg text-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />
}

export function CardAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 px-6 pb-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4 border-t border-border/50 flex gap-3 justify-end', className)} {...props} />
}
