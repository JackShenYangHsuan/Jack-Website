'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Icons - Lucide style (shadcn uses Lucide icons)
 */
function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-3.5 w-3.5', className)}
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-3.5 w-3.5', className)}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-3.5 w-3.5', className)}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export interface StoryBriefFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  placeholder?: string;
  multiline?: boolean;
}

export function StoryBriefField({
  label,
  value,
  onChange,
  editable = true,
  placeholder = 'Not yet defined...',
  multiline = true,
}: StoryBriefFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleSave() {
    onChange(editValue.trim());
    setIsEditing(false);
  }

  function handleCancel() {
    setEditValue(value);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  }

  const hasValue = value.trim().length > 0;

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-900">
          {label}
        </label>
        {editable && !isEditing && hasValue && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center rounded-md p-1 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-900 transition-colors focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            aria-label={`Edit ${label}`}
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {/* Value / Editor */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={multiline ? 3 : 1}
            className={cn(
              'flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm',
              'placeholder:text-zinc-500',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'resize-none'
            )}
          />
          <div className="flex justify-end gap-1">
            <button
              onClick={handleCancel}
              className="inline-flex items-center justify-center rounded-md h-7 w-7 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              aria-label="Cancel"
            >
              <XIcon />
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-md h-7 w-7 text-emerald-600 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
              aria-label="Save"
            >
              <CheckIcon />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => editable && setIsEditing(true)}
          disabled={!editable}
          className={cn(
            'w-full text-left text-sm leading-relaxed',
            hasValue ? 'text-zinc-900' : 'text-zinc-500 italic',
            editable && 'cursor-text hover:text-zinc-600',
            !editable && 'cursor-default'
          )}
        >
          {hasValue ? value : placeholder}
        </button>
      )}
    </div>
  );
}
