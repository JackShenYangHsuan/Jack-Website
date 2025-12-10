'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * Format seconds to mm:ss or hh:mm:ss
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to mm:ss.ms for detailed display
 */
export function formatTimeDetailed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Icons
export function PlayIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} width="20" height="20">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function PauseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} width="20" height="20">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

export function SkipBackIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} width="16" height="16">
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SkipForwardIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} width="16" height="16">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function ZoomInIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} width="16" height="16">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export function ZoomOutIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} width="16" height="16">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export function VolumeIcon({ className, muted }: { className?: string; muted?: boolean }) {
  if (muted) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} width="16" height="16">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} width="16" height="16">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

interface TimeRulerProps {
  totalDuration: number;
  pixelsPerSecond: number;
  scrollLeft: number;
}

/**
 * Time ruler showing marks at intervals
 */
export function TimeRuler({ totalDuration, pixelsPerSecond, scrollLeft }: TimeRulerProps) {
  // Determine tick interval based on zoom level
  let majorInterval = 10; // seconds
  let minorInterval = 1;

  if (pixelsPerSecond >= 80) {
    majorInterval = 5;
    minorInterval = 1;
  } else if (pixelsPerSecond >= 40) {
    majorInterval = 10;
    minorInterval = 2;
  } else if (pixelsPerSecond >= 20) {
    majorInterval = 15;
    minorInterval = 5;
  } else {
    majorInterval = 30;
    minorInterval = 10;
  }

  const ticks = [];
  const visibleStart = Math.max(0, Math.floor(scrollLeft / pixelsPerSecond) - 2);
  const visibleEnd = Math.min(totalDuration + 5, Math.ceil((scrollLeft + 2000) / pixelsPerSecond) + 2);

  for (let t = 0; t <= totalDuration + majorInterval; t += minorInterval) {
    if (t < visibleStart || t > visibleEnd) continue;

    const isMajor = t % majorInterval === 0;
    ticks.push(
      <div
        key={t}
        className="absolute top-0 flex flex-col items-center"
        style={{ left: `${t * pixelsPerSecond}px` }}
      >
        <div
          className={cn(
            'w-px',
            isMajor ? 'h-3 bg-zinc-400' : 'h-2 bg-zinc-600'
          )}
        />
        {isMajor && (
          <span className="text-[10px] text-zinc-400 mt-0.5 select-none">
            {formatTime(t)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative h-6 bg-zinc-900 border-b border-zinc-700"
      style={{ width: `${(totalDuration + 10) * pixelsPerSecond}px` }}
    >
      {ticks}
    </div>
  );
}

interface PlayheadProps {
  currentTime: number;
  pixelsPerSecond: number;
  height: number;
  onSeek?: (time: number) => void;
}

/**
 * Playhead indicator showing current position
 */
export function Playhead({ currentTime, pixelsPerSecond, height }: PlayheadProps) {
  const position = currentTime * pixelsPerSecond;

  return (
    <div
      className="absolute top-0 z-50 pointer-events-none"
      style={{
        left: `${position}px`,
        height: `${height}px`,
      }}
    >
      {/* Playhead triangle */}
      <div className="relative">
        <div
          className="absolute -left-2 -top-1 w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid #ef4444',
          }}
        />
        {/* Playhead line */}
        <div
          className="absolute left-0 top-2 w-0.5 bg-red-500"
          style={{ height: `${height - 8}px` }}
        />
      </div>
    </div>
  );
}

interface TimelineControlsProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  pixelsPerSecond: number;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (pps: number) => void;
  children?: React.ReactNode;
}

/**
 * Timeline transport controls
 */
export function TimelineControls({
  isPlaying,
  currentTime,
  totalDuration,
  pixelsPerSecond,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  children,
}: TimelineControlsProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700">
      {/* Left: Transport controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onSkipBack}
          className="p-2 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          title="Go to start (Home)"
        >
          <SkipBackIcon />
        </button>
        <button
          onClick={onPlayPause}
          className="p-2.5 rounded-full bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          onClick={onSkipForward}
          className="p-2 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          title="Go to end (End)"
        >
          <SkipForwardIcon />
        </button>

        {/* Time display */}
        <div className="ml-4 px-3 py-1.5 bg-zinc-800 rounded font-mono text-sm text-zinc-300 min-w-[140px] text-center">
          <span className="text-white">{formatTimeDetailed(currentTime)}</span>
          <span className="text-zinc-500 mx-1">/</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Center: Custom children (e.g., action buttons) */}
      <div className="flex items-center gap-2">
        {children}
      </div>

      {/* Right: Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          title="Zoom out"
          disabled={pixelsPerSecond <= 10}
        >
          <ZoomOutIcon className={pixelsPerSecond <= 10 ? 'opacity-30' : ''} />
        </button>
        <input
          type="range"
          min="10"
          max="100"
          value={pixelsPerSecond}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="w-24 accent-zinc-400"
          title={`Zoom: ${pixelsPerSecond}px/s`}
        />
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          title="Zoom in"
          disabled={pixelsPerSecond >= 100}
        >
          <ZoomInIcon className={pixelsPerSecond >= 100 ? 'opacity-30' : ''} />
        </button>
        <span className="text-xs text-zinc-500 w-12 text-right">{pixelsPerSecond}px/s</span>
      </div>
    </div>
  );
}

interface TimelineContainerProps {
  totalDuration: number;
  currentTime: number;
  pixelsPerSecond: number;
  onSeek: (time: number) => void;
  trackHeight?: number;
  children: React.ReactNode;
}

/**
 * Main timeline container with ruler, playhead, and tracks
 */
export function TimelineContainer({
  totalDuration,
  currentTime,
  pixelsPerSecond,
  onSeek,
  trackHeight = 200,
  children,
}: TimelineContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  // Handle clicking on timeline to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const time = Math.max(0, Math.min(x / pixelsPerSecond, totalDuration));
    onSeek(time);
  }, [pixelsPerSecond, totalDuration, onSeek]);

  // Handle dragging playhead
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDraggingPlayhead(true);
    handleTimelineClick(e);
  }, [handleTimelineClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingPlayhead || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const time = Math.max(0, Math.min(x / pixelsPerSecond, totalDuration));
    onSeek(time);
  }, [isDraggingPlayhead, pixelsPerSecond, totalDuration, onSeek]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false);
  }, []);

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollLeft(containerRef.current.scrollLeft);
    }
  }, []);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (!containerRef.current || isDraggingPlayhead) return;

    const playheadPosition = currentTime * pixelsPerSecond;
    const containerWidth = containerRef.current.clientWidth;
    const scrollLeft = containerRef.current.scrollLeft;

    // Keep playhead in the middle third of visible area
    const leftBound = scrollLeft + containerWidth * 0.2;
    const rightBound = scrollLeft + containerWidth * 0.8;

    if (playheadPosition < leftBound) {
      containerRef.current.scrollLeft = Math.max(0, playheadPosition - containerWidth * 0.2);
    } else if (playheadPosition > rightBound) {
      containerRef.current.scrollLeft = playheadPosition - containerWidth * 0.8;
    }
  }, [currentTime, pixelsPerSecond, isDraggingPlayhead]);

  const timelineWidth = (totalDuration + 10) * pixelsPerSecond;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-x-auto overflow-y-hidden bg-zinc-800 relative select-none"
      onScroll={handleScroll}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="relative"
        style={{ width: `${timelineWidth}px`, minWidth: '100%' }}
      >
        {/* Time ruler */}
        <div
          className="sticky top-0 z-30 cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          <TimeRuler
            totalDuration={totalDuration}
            pixelsPerSecond={pixelsPerSecond}
            scrollLeft={scrollLeft}
          />
        </div>

        {/* Tracks container */}
        <div
          className="relative"
          style={{ minHeight: `${trackHeight}px` }}
          onMouseDown={handleMouseDown}
        >
          {children}

          {/* Playhead */}
          <Playhead
            currentTime={currentTime}
            pixelsPerSecond={pixelsPerSecond}
            height={trackHeight + 24}
          />
        </div>
      </div>
    </div>
  );
}

// Export everything for convenience
export default {
  TimelineControls,
  TimelineContainer,
  TimeRuler,
  Playhead,
  formatTime,
  formatTimeDetailed,
};
