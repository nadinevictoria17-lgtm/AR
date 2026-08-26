import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

export function Card({ className, size = 'md', interactive = false, ...props }: CardProps) {
  const sizeStyles = {
    sm: 'rounded-lg border border-border shadow-xs',
    md: 'rounded-xl border border-border shadow-xs',
    lg: 'rounded-2xl border border-border shadow-sm',
  }

  return (
    <div
      className={cn(
        'bg-card',
        sizeStyles[size],
        interactive && 'hover:border-muted-foreground/25 hover:shadow-sm transition-all duration-150 cursor-pointer',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4 border-b border-border', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold text-[15px] tracking-tight text-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardAction({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3 px-5 pb-4', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4 border-t border-border flex gap-2.5 justify-end', className)} {...props} />
}
