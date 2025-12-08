'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { Message } from '@/types/chat';

/**
 * Message list props
 */
export interface MessageListProps {
  /** Messages to display */
  messages: Message[];
  /** Whether the AI is currently responding */
  isLoading?: boolean;
  /** Whether the current message is streaming */
  isStreaming?: boolean;
  /** ID of the message currently streaming */
  streamingMessageId?: string;
}

/**
 * Message list component
 * Scrollable list of chat messages
 */
export function MessageList({
  messages,
  isLoading = false,
  isStreaming = false,
  streamingMessageId,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isStreaming]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isStreaming={isStreaming && message.id === streamingMessageId}
        />
      ))}

      {/* Typing indicator when waiting for AI response */}
      {isLoading && !isStreaming && <TypingIndicator />}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
