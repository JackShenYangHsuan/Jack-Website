'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Error page props
 */
interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div
          className={cn(
            'w-16 h-16 mx-auto mb-6 rounded-full',
            'bg-[#fff1f0]',
            'flex items-center justify-center text-[#e5484d]'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="32"
            height="32"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-[#111111] mb-2">
          Something went wrong
        </h1>

        <p className="text-[#666666] mb-6">
          An unexpected error occurred. Please try again.
        </p>

        {error.message && (
          <p className="text-sm text-[#e5484d] bg-[#fff1f0] rounded-md p-3 mb-6 font-mono">
            {error.message}
          </p>
        )}

        <div className="flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className={cn(
              'px-4 py-2 rounded-md font-medium',
              'bg-[#111111] text-[#ffffff]',
              'hover:bg-[#333333] transition-colors'
            )}
          >
            Try Again
          </button>

          <a
            href="/projects"
            className={cn(
              'px-4 py-2 rounded-md font-medium',
              'border border-[#eaeaea] text-[#111111]',
              'hover:bg-[#fafafa] transition-colors'
            )}
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
