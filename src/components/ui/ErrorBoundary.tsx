'use client'

import { Component, type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-error/20 bg-error/5 mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-error">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-text mb-2">Something went wrong</h1>
            <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
              An unexpected error occurred. Please try again or reload the page.
            </p>
            {this.state.error && (
              <details className="text-left mb-6 max-w-md">
                <summary className="text-xs text-text-dim cursor-pointer hover:text-text-muted transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-surface-alt text-xs text-error overflow-x-auto border border-border">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-lg font-medium
                  bg-accent text-[#050505] hover:brightness-110 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-lg
                  border border-border bg-surface-alt text-text hover:bg-surface hover:border-text-dim/30 transition-all"
              >
                Reload Page
              </button>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}
