'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  SHOT_TYPE_LABELS,
  CAMERA_MOVEMENT_LABELS,
  TRANSITION_TYPE_LABELS,
} from '@/types/project';
import type { StoryboardScene } from '@/types/project';

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
 * Trash icon for delete
 */
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
      className={className}
      width="14"
      height="14"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

/**
 * Arrow up icon
 */
function ArrowUpIcon({ className }: { className?: string }) {
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
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}

/**
 * Arrow down icon
 */
function ArrowDownIcon({ className }: { className?: string }) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * Refresh icon for regenerate
 */
function RefreshIcon({ className }: { className?: string }) {
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
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

/**
 * Sparkles icon for enhance
 */
function SparklesIcon({ className }: { className?: string }) {
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

/**
 * Camera icon
 */
function CameraIcon({ className }: { className?: string }) {
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
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

/**
 * Clock icon
 */
function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export interface SceneCardProps {
  scene: StoryboardScene;
  index: number;
  totalScenes: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRegenerateSketch?: () => void;
  isRegeneratingSketch?: boolean;
  onEnhancePrompt?: () => void;
  isEnhancingPrompt?: boolean;
  onUpdateScene?: (updates: Partial<StoryboardScene>) => void;
  className?: string;
}

export function SceneCard({
  scene,
  index,
  totalScenes,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRegenerateSketch,
  isRegeneratingSketch,
  onEnhancePrompt,
  isEnhancingPrompt,
  onUpdateScene,
  className,
}: SceneCardProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(scene.visualDescription);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when scene prop changes (e.g., after enhance)
  useEffect(() => {
    setEditedDescription(scene.visualDescription);
  }, [scene.visualDescription]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditingDescription && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditingDescription]);

  const handleSaveDescription = () => {
    if (onUpdateScene && editedDescription !== scene.visualDescription) {
      onUpdateScene({ visualDescription: editedDescription });
    }
    setIsEditingDescription(false);
  };

  const handleCancelEdit = () => {
    setEditedDescription(scene.visualDescription);
    setIsEditingDescription(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSaveDescription();
    }
  };

  return (
    <div
      className={cn(
        'border border-zinc-200 rounded-lg bg-white overflow-hidden group',
        className
      )}
    >
      <div className="flex">
        {/* Scene image - show sketch, generated image, or placeholder */}
        <div className="w-48 shrink-0 bg-zinc-100 flex items-center justify-center relative group/image">
          {scene.imageUrl ? (
            <img
              src={scene.imageUrl}
              alt={`Scene ${scene.order}`}
              className="w-full h-full object-cover"
            />
          ) : scene.sketchUrl ? (
            <img
              src={scene.sketchUrl}
              alt={`Scene ${scene.order} sketch`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <span className="text-3xl font-bold text-zinc-300">{scene.order}</span>
              <p className="text-xs text-zinc-400 mt-1">No sketch</p>
            </div>
          )}
          {/* Regenerate sketch button - always visible */}
          {onRegenerateSketch && (
            <button
              onClick={onRegenerateSketch}
              disabled={isRegeneratingSketch}
              className={cn(
                'absolute top-2 left-2 p-1.5 rounded bg-black/60 text-white transition-colors',
                'hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="Regenerate sketch"
            >
              <RefreshIcon className={cn(isRegeneratingSketch && 'animate-spin')} />
            </button>
          )}
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            {scene.duration}s
          </div>
        </div>

        {/* Scene content */}
        <div className="flex-1 p-4 min-w-0">
          {/* Header with metadata */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">
                {SHOT_TYPE_LABELS[scene.shotType]}
              </span>
              <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded flex items-center gap-1">
                <CameraIcon className="w-3 h-3" />
                {CAMERA_MOVEMENT_LABELS[scene.cameraMovement]}
              </span>
              <span className="text-xs text-zinc-400">
                {TRANSITION_TYPE_LABELS[scene.transition]}
              </span>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ArrowUpIcon />
              </button>
              <button
                onClick={onMoveDown}
                disabled={index === totalScenes - 1}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ArrowDownIcon />
              </button>
              <button
                onClick={onEdit}
                className="p-1.5 text-zinc-400 hover:text-zinc-600"
                title="Edit scene"
              >
                <PencilIcon />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 text-zinc-400 hover:text-red-500"
                title="Delete scene"
              >
                <TrashIcon />
              </button>
            </div>
          </div>

          {/* Visual description */}
          <div className="mb-3">
            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  ref={textareaRef}
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSaveDescription}
                  className="w-full text-sm text-zinc-700 bg-zinc-50 border border-zinc-300 rounded-md p-2 resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the visual scene..."
                  rows={4}
                />
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>Press <kbd className="px-1 py-0.5 bg-zinc-100 rounded">Esc</kbd> to cancel</span>
                  <span>•</span>
                  <span><kbd className="px-1 py-0.5 bg-zinc-100 rounded">⌘+Enter</kbd> to save</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => onUpdateScene && setIsEditingDescription(true)}
                className={cn(
                  'text-sm text-zinc-700 whitespace-pre-wrap',
                  onUpdateScene && 'cursor-text hover:bg-zinc-50 rounded-md p-1 -m-1 transition-colors'
                )}
              >
                {scene.visualDescription || (
                  <span className="text-zinc-400 italic">Click to add visual description...</span>
                )}
              </div>
            )}
            {!isEditingDescription && onEnhancePrompt && scene.visualDescription && (
              <button
                onClick={onEnhancePrompt}
                disabled={isEnhancingPrompt}
                className={cn(
                  'mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  'bg-purple-50 text-purple-700 hover:bg-purple-100',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <SparklesIcon className={cn('w-3 h-3', isEnhancingPrompt && 'animate-pulse')} />
                {isEnhancingPrompt ? 'Enhancing...' : 'Enhance Prompt'}
              </button>
            )}
          </div>

          {/* Voiceover */}
          {scene.voiceover && (
            <div className="bg-zinc-50 rounded-md p-2 text-sm text-zinc-600 italic">
              &ldquo;{scene.voiceover}&rdquo;
            </div>
          )}

          {/* On-screen text */}
          {scene.onScreenText && (
            <div className="mt-2 text-xs text-zinc-500">
              <span className="font-medium">Text:</span> {scene.onScreenText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
