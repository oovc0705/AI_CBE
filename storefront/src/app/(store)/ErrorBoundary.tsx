'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Global ErrorBoundary - catches render errors and shows a friendly fallback UI.
 * In production, errors are logged via console.error only (no external service).
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Production: only error-level logs allowed
    console.error(
      '[ErrorBoundary] Uncaught error:',
      error.message,
      '\nComponent stack:',
      errorInfo.componentStack,
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 mb-6 rounded-full bg-error/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-h2 font-bold text-gray-900 mb-3">
            Something went wrong
          </h1>
          <p className="text-body-base text-gray-500 mb-8 max-w-md">
            An unexpected error occurred. Please try again or go back to the homepage.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={this.handleRetry}
              className="btn-primary active:scale-95"
            >
              Try Again
            </button>
            <a href="/" className="btn-outline active:scale-95">
              Back to Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
