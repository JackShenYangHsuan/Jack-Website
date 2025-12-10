'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';

/**
 * Send icon - Geist style
 */
function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/**
 * Chat input props
 */
export interface ChatInputProps {
  /** Callback when message is submitted */
  onSubmit: (message: string) => void;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Chat input component - Geist design system
 */
export function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sendHovered, setSendHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus input after AI responds (disabled changes from true to false)
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    }
  }, [value]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
      setValue('');
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      style={{
        borderTop: '1px solid #e4e4e7',
        backgroundColor: '#ffffff',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '12px',
          borderRadius: '12px',
          border: isFocused ? '1px solid #18181b' : '1px solid #e4e4e7',
          boxShadow: isFocused ? '0 0 0 1px #18181b' : 'none',
          backgroundColor: '#fafafa',
          padding: '12px',
          transition: 'all 150ms',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            backgroundColor: 'transparent',
            color: '#18181b',
            fontSize: '14px',
            lineHeight: 1.6,
            border: 'none',
            outline: 'none',
            minHeight: '24px',
            maxHeight: '160px',
            padding: '4px 8px',
            fontFamily: 'inherit',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={!canSend}
          onMouseEnter={() => setSendHovered(true)}
          onMouseLeave={() => setSendHovered(false)}
          style={{
            flexShrink: 0,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            cursor: canSend ? 'pointer' : 'not-allowed',
            transition: 'all 150ms',
            backgroundColor: canSend ? '#18181b' : '#f4f4f5',
            color: canSend ? '#ffffff' : '#a1a1aa',
            transform: canSend && sendHovered ? 'scale(1.05)' : 'scale(1)',
          }}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>

      <p
        style={{
          fontSize: '12px',
          color: '#71717a',
          textAlign: 'center',
          marginTop: '12px',
        }}
      >
        Press{' '}
        <kbd
          style={{
            padding: '2px 6px',
            borderRadius: '6px',
            backgroundColor: '#f4f4f5',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          Enter
        </kbd>{' '}
        to send,{' '}
        <kbd
          style={{
            padding: '2px 6px',
            borderRadius: '6px',
            backgroundColor: '#f4f4f5',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          Shift + Enter
        </kbd>{' '}
        for new line
      </p>
    </div>
  );
}
