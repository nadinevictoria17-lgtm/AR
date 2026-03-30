import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'icon'
  children: ReactNode
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition disabled:opacity-50'

  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ghost: 'text-foreground hover:bg-muted',
    destructive: 'text-destructive hover:bg-destructive/10',
  }

  const sizeStyles = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
    icon: 'h-10 w-10',
  }

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    />
  )
}
