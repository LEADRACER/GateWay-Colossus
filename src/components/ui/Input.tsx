import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, className = '', ...props }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim transition-all duration-150 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent-gloss ${
            error
              ? 'border-error/50 focus:border-error focus:ring-error/20'
              : 'border-border focus:border-accent/50'
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-error">{error}</span>
        )}
        {hint && !error && (
          <span className="text-xs text-text-dim">{hint}</span>
        )}
      </div>
    )
  },
)
