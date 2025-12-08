'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';

/**
 * Message bubble props
 */
export interface MessageBubbleProps {
  /** Message to display */
  message: Message;
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
}

/**
 * Message bubble component - Geist design system
 */
export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex w-full animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3',
          isUser && [
            'bg-[#111111] text-[#ffffff]',
            'rounded-br-md'
          ],
          isAssistant && [
            'bg-[#fafafa]',
            'border border-[#eaeaea]',
            'rounded-bl-md'
          ]
        )}
      >
        {/* Message content with markdown-like styling */}
        <div
          className={cn(
            'prose text-sm leading-relaxed',
            isUser && 'text-[#ffffff]',
            isAssistant && 'text-[#111111]'
          )}
        >
          {message.content.split('\n').map((paragraph, i) => {
            if (!paragraph.trim()) {
              return <br key={i} />;
            }

            // Check for bold text (**text**)
            const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
            const formattedParts = parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={j} className="font-semibold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            });

            return (
              <p key={i} className="mb-2 last:mb-0">
                {formattedParts}
              </p>
            );
          })}

          {/* Streaming cursor */}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  );
}
