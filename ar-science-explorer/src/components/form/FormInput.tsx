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
          <label className="block text-[13px] font-medium text-foreground mb-1.5">
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
              'w-full h-9 px-3 rounded-md bg-background border text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring',
              icon && 'pl-9',
              error
                ? 'border-destructive focus:ring-destructive/40'
                : 'border-border',
              className
            )}
            {...props}
          />

          {error && (
            <AlertCircle
              size={15}
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
