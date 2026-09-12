'use client';

/**
 * Route-level error boundary for the (store) route group.
 * Next.js App Router automatically wraps routes with this component.
 */
export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Production: only error-level logs
  console.error('[StoreError]', error.message);

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
          onClick={reset}
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
