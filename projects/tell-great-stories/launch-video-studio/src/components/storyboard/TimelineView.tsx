'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SHOT_TYPE_LABELS } from '@/types/project';
import type { StoryboardScene } from '@/types/project';

/**
 * Grip/drag handle icon
 */
function GripIcon({ className }: { className?: string }) {
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
      <circle cx="9" cy="5" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="19" r="1" fill="currentColor" />
      <circle cx="15" cy="5" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="19" r="1" fill="currentColor" />
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
      width="12"
      height="12"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

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
      width="12"
      height="12"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

interface TimelineSceneProps {
  scene: StoryboardScene;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  cumulativeTime: number;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

/**
 * Individual scene marker on the timeline
 */
function TimelineScene({
  scene,
  isSelected,
  onSelect,
  onEdit,
  cumulativeTime,
  index,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: TimelineSceneProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center cursor-pointer group transition-all relative',
        'w-[200px] shrink-0',
        isDragging && 'opacity-50 scale-95',
        isDragOver && 'scale-105'
      )}
      onClick={onSelect}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
    >
      {/* Drop indicator */}
      {isDragOver && (
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
      )}
      {/* Pin marker and connecting line */}
      <div className="relative flex flex-col items-center">
        {/* Timestamp badge */}
        <div
          className={cn(
            'px-2 py-1 rounded-md font-mono text-xs transition-all',
            isSelected
              ? 'bg-zinc-900 text-white scale-105 shadow-lg'
              : 'bg-zinc-200 text-zinc-600 group-hover:bg-zinc-300'
          )}
        >
          {formatTime(cumulativeTime)}
        </div>

        {/* Vertical pin line */}
        <div
          className={cn(
            'w-0.5 h-4 transition-colors',
            isSelected ? 'bg-zinc-900' : 'bg-zinc-300 group-hover:bg-zinc-400'
          )}
        />

        {/* Pin point */}
        <div
          className={cn(
            'w-3 h-3 rounded-full border-2 transition-all',
            isSelected
              ? 'bg-zinc-900 border-zinc-900'
              : 'bg-white border-zinc-300 group-hover:border-zinc-400'
          )}
        />
      </div>

      {/* Scene thumbnail card */}
      <div
        className={cn(
          'mt-3 w-full rounded-lg overflow-hidden border-2 transition-all',
          isSelected
            ? 'border-zinc-900 shadow-lg'
            : 'border-zinc-200 group-hover:border-zinc-300 group-hover:shadow-md'
        )}
      >
        {/* Thumbnail */}
        <div className="aspect-video bg-zinc-100 relative">
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
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl font-bold text-zinc-300">{scene.order}</span>
            </div>
          )}

          {/* Duration badge */}
          <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <ClockIcon className="w-2.5 h-2.5" />
            {scene.duration}s
          </div>

          {/* Edit button on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <PencilIcon />
          </button>
        </div>

        {/* Scene info */}
        <div className="p-2 bg-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <GripIcon className="w-3 h-3 text-zinc-300 cursor-grab active:cursor-grabbing" />
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
                {SHOT_TYPE_LABELS[scene.shotType]}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              {formatTime(cumulativeTime)}
            </span>
          </div>
          <p className="text-xs text-zinc-700 line-clamp-2 leading-tight">
            {scene.visualDescription || 'No description'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface TimelineViewProps {
  scenes: StoryboardScene[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onEditScene: (scene: StoryboardScene) => void;
  onReorderScenes?: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

/**
 * Horizontal timeline view for storyboard scenes
 */
export function TimelineView({
  scenes,
  selectedSceneId,
  onSelectScene,
  onEditScene,
  onReorderScenes,
  className,
}: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && index !== dragIndex) {
      setDragOverIndex(index);
    }
  }, [dragIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex && onReorderScenes) {
      onReorderScenes(fromIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [onReorderScenes]);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        scrollEl.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [scenes]);

  // Scroll by amount
  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Calculate cumulative times
  const cumulativeTimes: number[] = [];
  let cumulative = 0;
  for (const scene of scenes) {
    cumulativeTimes.push(cumulative);
    cumulative += scene.duration;
  }

  if (scenes.length === 0) {
    return (
      <div className={cn('p-8 text-center text-zinc-500', className)}>
        No scenes to display
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-400)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:shadow-xl transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy(400)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:shadow-xl transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Timeline container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent pb-4"
      >
        {/* Timeline track */}
        <div className="relative min-w-max px-8 pt-4">
          {/* Horizontal line connecting all scenes */}
          <div className="absolute left-8 right-8 top-[76px] h-0.5 bg-zinc-200" />

          {/* Scene markers */}
          <div className="flex gap-6">
            {scenes.map((scene, index) => (
              <TimelineScene
                key={scene.id}
                scene={scene}
                isSelected={selectedSceneId === scene.id}
                onSelect={() => onSelectScene(scene.id)}
                onEdit={() => onEditScene(scene)}
                cumulativeTime={cumulativeTimes[index]}
                index={index}
                isDragging={dragIndex === index}
                isDragOver={dragOverIndex === index}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            ))}
          </div>

          {/* Timeline ruler */}
          <div className="mt-6 flex gap-6 px-[84px]">
            {scenes.map((scene, index) => (
              <div key={scene.id} className="w-[200px] shrink-0 flex justify-center">
                <span className="text-[10px] text-zinc-400 font-mono">
                  {formatTime(cumulativeTimes[index])} - {formatTime(cumulativeTimes[index] + scene.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total duration indicator */}
      <div className="text-center mt-2 text-sm text-zinc-500">
        Total: {formatTime(cumulative)} ({scenes.length} scenes)
      </div>
    </div>
  );
}
