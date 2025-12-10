'use client';

import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import type { Message } from '@/types/chat';

/**
 * Chat container props
 */
export interface ChatContainerProps {
  /** Messages to display */
  messages: Message[];
  /** Whether the AI is currently responding */
  isLoading?: boolean;
  /** Whether the current message is streaming */
  isStreaming?: boolean;
  /** ID of the message currently streaming */
  streamingMessageId?: string;
  /** Callback when user sends a message */
  onSendMessage: (message: string) => void;
  /** Input placeholder */
  inputPlaceholder?: string;
}

/**
 * Chat container component
 * Full chat interface with message list and input
 */
export function ChatContainer({
  messages,
  isLoading = false,
  isStreaming = false,
  streamingMessageId,
  onSendMessage,
  inputPlaceholder,
}: ChatContainerProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        streamingMessageId={streamingMessageId}
      />

      {/* Input */}
      <ChatInput
        onSubmit={onSendMessage}
        disabled={isLoading || isStreaming}
        placeholder={inputPlaceholder}
      />
    </div>
  );
}
