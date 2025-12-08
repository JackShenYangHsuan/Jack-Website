'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import type { StyleCategories, StyleCategoryKey, StyleInsight } from '@/types/project';

/**
 * Pencil icon for edit
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
      className={className}
      width="14"
      height="14"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

/**
 * X icon for delete
 */
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
      className={className}
      width="14"
      height="14"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/**
 * Plus icon
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
      className={className}
      width="14"
      height="14"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

/**
 * Check icon
 */
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
      className={className}
      width="14"
      height="14"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

interface StyleCategoryCardProps {
  categoryKey: StyleCategoryKey;
  label: string;
  description: string;
  insights: StyleInsight[];
  onUpdateInsight: (insightId: string, text: string) => void;
  onDeleteInsight: (insightId: string) => void;
  onAddInsight: (text: string) => void;
}

function StyleCategoryCard({
  categoryKey,
  label,
  description,
  insights,
  onUpdateInsight,
  onDeleteInsight,
  onAddInsight,
}: StyleCategoryCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const handleStartEdit = (insight: StyleInsight) => {
    setEditingId(insight.id);
    setEditText(insight.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      onUpdateInsight(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleAddNew = () => {
    if (newText.trim()) {
      onAddInsight(newText.trim());
      setNewText('');
      setIsAdding(false);
    }
  };

  return (
    <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200">
        <h4 className="text-sm font-semibold text-zinc-900">{label}</h4>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>

      {/* Insights list */}
      <div className="flex-1 p-3 overflow-y-auto max-h-[200px]">
        {insights.length === 0 && !isAdding ? (
          <p className="text-xs text-zinc-400 text-center py-4">
            No insights yet. Analyze videos to add insights.
          </p>
        ) : (
          <ul className="space-y-2">
            {insights.map((insight) => (
              <li key={insight.id} className="group">
                {editingId === insight.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full text-xs p-2 border border-zinc-200 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        <XIcon />
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 text-green-500 hover:text-green-600"
                      >
                        <CheckIcon />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-400 mt-0.5">•</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-700 leading-relaxed">
                        {insight.text}
                      </p>
                      {insight.videoTitle && insight.videoId !== 'manual' && (
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                          from: {insight.videoTitle}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(insight)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                        title="Edit"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => onDeleteInsight(insight.id)}
                        className="p-1 text-zinc-400 hover:text-red-500"
                        title="Delete"
                      >
                        <XIcon />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}

            {/* Add new insight */}
            {isAdding && (
              <li>
                <div className="flex flex-col gap-2">
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter new insight..."
                    className="w-full text-xs p-2 border border-zinc-200 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewText('');
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-600"
                    >
                      <XIcon />
                    </button>
                    <button
                      onClick={handleAddNew}
                      className="p-1 text-green-500 hover:text-green-600"
                    >
                      <CheckIcon />
                    </button>
                  </div>
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Add button */}
      {!isAdding && (
        <div className="px-3 pb-3">
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 py-1.5 border border-dashed border-zinc-200 rounded-md hover:border-zinc-300 transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Add insight
          </button>
        </div>
      )}
    </div>
  );
}

export interface StyleCategoryGridProps {
  categories: StyleCategories;
  onUpdateInsight: (categoryKey: StyleCategoryKey, insightId: string, text: string) => void;
  onDeleteInsight: (categoryKey: StyleCategoryKey, insightId: string) => void;
  onAddInsight: (categoryKey: StyleCategoryKey, text: string) => void;
  className?: string;
}

const CATEGORY_ORDER: StyleCategoryKey[] = [
  'colorPalette',
  'typographyStyle',
  'motionDesign',
  'pacingRhythm',
  'visualMetaphors',
  'transitionStyles',
];

export function StyleCategoryGrid({
  categories,
  onUpdateInsight,
  onDeleteInsight,
  onAddInsight,
  className,
}: StyleCategoryGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {CATEGORY_ORDER.map((key) => {
        const category = categories[key];
        return (
          <StyleCategoryCard
            key={key}
            categoryKey={key}
            label={category.label}
            description={category.description}
            insights={category.insights}
            onUpdateInsight={(insightId, text) => onUpdateInsight(key, insightId, text)}
            onDeleteInsight={(insightId) => onDeleteInsight(key, insightId)}
            onAddInsight={(text) => onAddInsight(key, text)}
          />
        );
      })}
    </div>
  );
}
