'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Icons - Lucide style (shadcn uses Lucide icons)
 */
function PlusIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-3 w-3', className)}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

export interface StoryBriefListFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  editable?: boolean;
  placeholder?: string;
  helperText?: string;
}

export function StoryBriefListField({
  label,
  values,
  onChange,
  editable = true,
  placeholder = 'No items yet...',
  helperText,
}: StoryBriefListFieldProps) {
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  function handleAddItem() {
    const trimmed = newItem.trim();
    if (trimmed) {
      onChange([...values, trimmed]);
      setNewItem('');
    }
  }

  function handleRemoveItem(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function handleEditItem(index: number, newValue: string) {
    const trimmed = newValue.trim();
    if (trimmed) {
      const updated = [...values];
      updated[index] = trimmed;
      onChange(updated);
    }
    setEditingIndex(null);
    setEditValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent, action: () => void) {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditValue('');
      setNewItem('');
    }
  }

  const hasItems = values.length > 0;

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="text-sm font-semibold text-zinc-900">
          {label}
        </label>
        {/* Helper text */}
        {helperText && (
          <p className="text-xs text-zinc-500 mt-1">
            {helperText}
          </p>
        )}
      </div>

      {/* Items list */}
      {hasItems ? (
        <ul className="space-y-2 mb-3">
          {values.map((item, index) => (
            <li
              key={index}
              className="group flex items-start gap-2"
            >
              <span className="text-zinc-400 text-sm mt-0.5">&bull;</span>

              {editingIndex === index ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleEditItem(index, editValue))}
                  onBlur={() => handleEditItem(index, editValue)}
                  autoFocus
                  className={cn(
                    'flex-1 h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm',
                    'placeholder:text-zinc-500',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950'
                  )}
                />
              ) : (
                <>
                  <span
                    className={cn(
                      'flex-1 text-sm text-zinc-900 leading-relaxed',
                      editable && 'cursor-text hover:text-zinc-600'
                    )}
                    onClick={() => {
                      if (editable) {
                        setEditingIndex(index);
                        setEditValue(item);
                      }
                    }}
                  >
                    {item}
                  </span>

                  {editable && (
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className={cn(
                        'p-1 rounded-md text-zinc-400',
                        'opacity-0 group-hover:opacity-100',
                        'hover:bg-red-50 hover:text-red-500',
                        'transition-all',
                        'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950'
                      )}
                      aria-label="Remove item"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 italic mb-3">
          {placeholder}
        </p>
      )}

      {/* Add new item */}
      {editable && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleAddItem)}
            placeholder="Add new item..."
            className={cn(
              'flex-1 h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm',
              'placeholder:text-zinc-500',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
          <button
            onClick={handleAddItem}
            disabled={!newItem.trim()}
            className={cn(
              'inline-flex items-center justify-center rounded-md h-9 w-9',
              'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900',
              'transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950',
              'disabled:pointer-events-none disabled:opacity-50'
            )}
            aria-label="Add item"
          >
            <PlusIcon />
          </button>
        </div>
      )}
    </div>
  );
}
