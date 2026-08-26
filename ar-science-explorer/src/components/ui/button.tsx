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
  const baseStyles = 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none select-none'

  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs',
    secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-muted',
    ghost: 'text-foreground hover:bg-muted',
    'ghost-secondary': 'text-muted-foreground hover:text-foreground hover:bg-muted',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs',
    outline: 'bg-background border border-border text-foreground hover:bg-muted hover:border-muted-foreground/30',
    link: 'text-primary underline-offset-4 hover:underline',
  }

  const sizeStyles = {
    default: 'h-9 px-4 text-sm',
    sm: 'h-8 px-3 text-[13px]',
    lg: 'h-11 px-6 text-[15px]',
    icon: 'h-9 w-9 p-0',
  }

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
