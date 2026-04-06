import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  charCount?: number
  maxChars?: number
}

/**
 * Reusable FormTextarea with validation feedback
 * Shows error state, error message, character count, and validation styles
 */
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, charCount, maxChars, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            className={cn(
              'w-full px-4 py-3 rounded-xl bg-background border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-destructive/50 focus:border-destructive focus:ring-destructive/50'
                : 'border-border',
              className
            )}
            {...props}
          />

          {error && (
            <AlertCircle
              size={18}
              className="absolute right-3 top-3 text-destructive flex-shrink-0"
            />
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <div>
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                {error}
              </p>
            )}

            {helperText && !error && (
              <p className="text-xs text-muted-foreground">{helperText}</p>
            )}
          </div>

          {maxChars && (
            <p
              className={cn(
                'text-xs font-medium',
                charCount && charCount > maxChars * 0.9
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground'
              )}
            >
              {charCount || 0} / {maxChars}
            </p>
          )}
        </div>
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
