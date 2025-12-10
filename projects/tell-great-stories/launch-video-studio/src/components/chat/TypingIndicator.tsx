'use client';

import { cn } from '@/lib/utils';

/**
 * Typing indicator component
 * Shows animated dots to indicate the AI is thinking
 */
export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div
        className={cn(
          'bg-[#fafafa] border border-[#eaeaea]',
          'rounded-2xl rounded-bl-sm',
          'px-4 py-3'
        )}
      >
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-[#888888] rounded-full typing-dot" />
          <span className="w-2 h-2 bg-[#888888] rounded-full typing-dot" />
          <span className="w-2 h-2 bg-[#888888] rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
}
