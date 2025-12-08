'use client';

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
  className,
}: SceneCardProps) {
  return (
    <div
      className={cn(
        'border border-zinc-200 rounded-lg bg-white overflow-hidden group',
        className
      )}
    >
      <div className="flex">
        {/* Scene image - show sketch, generated image, or placeholder */}
        <div className="w-48 shrink-0 bg-zinc-100 flex items-center justify-center relative">
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
          <p className="text-sm text-zinc-700 mb-3 line-clamp-2">
            {scene.visualDescription || (
              <span className="text-zinc-400 italic">No visual description</span>
            )}
          </p>

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
