'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SHOT_TYPE_LABELS } from '@/types/project';
import type { StoryboardScene, KeyframeImage } from '@/types/project';

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
      width="12"
      height="12"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Logo icon
 */
function LogoIcon({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
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

interface TimelineSceneProps {
  scene: StoryboardScene;
  images: KeyframeImage[];
  isSelected: boolean;
  isGenerating: boolean;
  onSelect: () => void;
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
  images,
  isSelected,
  isGenerating,
  onSelect,
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
  const approvedImage = images.find(img => img.isApproved);
  const hasImages = images.length > 0;

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
            approvedImage
              ? 'bg-green-500 border-green-500'
              : isSelected
                ? 'bg-zinc-900 border-zinc-900'
                : 'bg-white border-zinc-300 group-hover:border-zinc-400'
          )}
        />
      </div>

      {/* Scene thumbnail card */}
      <div
        className={cn(
          'mt-3 w-full rounded-lg overflow-hidden border-2 transition-all',
          approvedImage
            ? 'border-green-500 shadow-lg shadow-green-500/20'
            : isSelected
              ? 'border-zinc-900 shadow-lg'
              : 'border-zinc-200 group-hover:border-zinc-300 group-hover:shadow-md'
        )}
      >
        {/* Thumbnail */}
        <div className="aspect-video bg-zinc-100 relative">
          {approvedImage ? (
            <Image
              src={approvedImage.imageUrl}
              alt={`Scene ${scene.order}`}
              fill
              className="object-cover"
            />
          ) : hasImages ? (
            <Image
              src={images[0].imageUrl}
              alt={`Scene ${scene.order}`}
              fill
              className="object-cover opacity-60"
            />
          ) : isGenerating ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            </div>
          ) : scene.sketchUrl ? (
            <Image
              src={scene.sketchUrl}
              alt={`Scene ${scene.order} sketch`}
              fill
              className="object-cover opacity-40"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl font-bold text-zinc-300">{scene.order}</span>
            </div>
          )}

          {/* Status badges */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
            {approvedImage && (
              <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] rounded flex items-center gap-0.5">
                <CheckIcon className="w-2.5 h-2.5" />
                Approved
              </span>
            )}
            {scene.logoAppropriate && (
              <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded flex items-center gap-0.5">
                <LogoIcon className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <ClockIcon className="w-2.5 h-2.5" />
            {scene.duration}s
          </div>

          {/* Image count badge */}
          {hasImages && !approvedImage && (
            <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
              {images.length} image{images.length > 1 ? 's' : ''}
            </div>
          )}
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
              Scene {scene.order}
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

export interface ImagesTimelineViewProps {
  scenes: StoryboardScene[];
  images: KeyframeImage[];
  selectedSceneId: string | null;
  generatingScenes: Set<string>;
  isGeneratingAll: boolean;
  onSelectScene: (sceneId: string) => void;
  onReorderScenes?: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

/**
 * Horizontal timeline view for images phase
 */
export function ImagesTimelineView({
  scenes,
  images,
  selectedSceneId,
  generatingScenes,
  isGeneratingAll,
  onSelectScene,
  onReorderScenes,
  className,
}: ImagesTimelineViewProps) {
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

  // Calculate approval stats
  const approvedCount = scenes.filter(scene =>
    images.some(img => img.sceneId === scene.id && img.isApproved)
  ).length;

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
                images={images.filter(img => img.sceneId === scene.id)}
                isSelected={selectedSceneId === scene.id}
                index={index}
                isDragging={dragIndex === index}
                isDragOver={dragOverIndex === index}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                isGenerating={isGeneratingAll || generatingScenes.has(scene.id)}
                onSelect={() => onSelectScene(scene.id)}
                cumulativeTime={cumulativeTimes[index]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-4 mt-2 text-sm text-zinc-500">
        <span>Total: {formatTime(cumulative)}</span>
        <span className="w-px h-4 bg-zinc-200" />
        <span>{scenes.length} scenes</span>
        <span className="w-px h-4 bg-zinc-200" />
        <span className={approvedCount === scenes.length ? 'text-green-600' : ''}>
          {approvedCount}/{scenes.length} approved
        </span>
      </div>
    </div>
  );
}
