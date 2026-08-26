import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import type { LucideIcon } from 'lucide-react'

interface CredentialFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  error?: string;
  icon: LucideIcon;
  rightSlot?: React.ReactNode;
  maxLength?: number;
}

export function CredentialField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  error,
  icon: Icon,
  rightSlot,
  maxLength,
}: CredentialFieldProps) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-foreground mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'w-full h-10 pl-9 rounded-md bg-background border text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring',
            rightSlot ? 'pr-10' : 'pr-3.5',
            error ? 'border-destructive' : 'border-border'
          )}
        />
        {rightSlot ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="mt-1.5 text-xs text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
