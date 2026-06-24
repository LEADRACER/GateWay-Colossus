interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-[#ff3355]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm text-[#3399ff] hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}
