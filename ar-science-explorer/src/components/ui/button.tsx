import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'ghost-secondary' | 'destructive' | 'outline' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm hover:shadow-md',
    ghost: 'text-foreground hover:bg-muted',
    'ghost-secondary': 'text-muted-foreground hover:text-foreground hover:bg-muted',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md',
    outline: 'bg-background border border-border text-foreground hover:bg-muted',
    link: 'text-primary underline-offset-4 hover:underline',
  }

  const sizeStyles = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
    lg: 'px-8 py-3 text-base',
    icon: 'h-10 w-10 p-0',
  }

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="mr-2 animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
