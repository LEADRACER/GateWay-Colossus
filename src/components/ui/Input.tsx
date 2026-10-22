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
          className={`w-full rounded-none border bg-bg-raised px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim transition-colors duration-150 focus:outline-none focus:border-green/60 focus:ring-2 focus:ring-green/15 ${
            error
              ? 'border-error/50 focus:border-error focus:ring-error/20'
              : 'border-border focus:border-green/60'
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
