import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className = '', ...props }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm text-[#a3a3a3]">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full rounded border bg-[#111] px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#00ff41]/50 ${
            error ? 'border-[#ff3355]' : 'border-[#333]'
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-[#ff3355]">{error}</span>
        )}
      </div>
    )
  },
)
