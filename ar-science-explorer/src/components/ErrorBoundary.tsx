import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the entire app.
 *
 * Features:
 * - Catches errors in render, lifecycle methods, and constructors
 * - Logs error details to console
 * - Provides reset button to try again
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('[ErrorBoundary] An error was caught:', error)
    console.error('[ErrorBoundary] Error info:', errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    // Optionally, redirect to home page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface text-foreground flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle size={32} className="text-destructive" />
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-center mb-2">
                Something Went Wrong
              </h1>
              <p className="text-muted-foreground text-center text-sm mb-6">
                An unexpected error occurred. Try refreshing the page or contact support.
              </p>

              {/* Error Details (Dev Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-muted rounded-xl border border-border/50">
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer font-semibold mb-2">
                        Stack Trace
                      </summary>
                      <pre className="text-muted-foreground overflow-auto max-h-40 font-mono text-[10px]">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={this.handleReset}
                  className="w-full h-11 font-bold rounded-xl"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/login')}
                  className="w-full h-11 font-bold rounded-xl"
                >
                  Back to Login
                </Button>
              </div>
            </div>

            {/* Support Info */}
            <p className="text-xs text-muted-foreground text-center mt-6">
              Error ID: {this.state.error?.message.substring(0, 8) || 'unknown'}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
