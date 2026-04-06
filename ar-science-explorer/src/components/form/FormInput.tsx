import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

/**
 * Reusable FormInput with validation feedback
 * Shows error state, error message, and validation styles
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3 rounded-xl bg-muted border-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all',
              icon && 'pl-10',
              error
                ? 'border-destructive/50 focus:border-destructive'
                : 'border-border focus:border-primary/50',
              className
            )}
            {...props}
          />

          {error && (
            <AlertCircle
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive flex-shrink-0"
            />
          )}
        </div>

        {error && (
          <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-xs text-muted-foreground mt-1.5">{helperText}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
