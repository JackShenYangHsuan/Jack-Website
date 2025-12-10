'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatTime } from './Timeline';
import type { TimelineClip, TransitionType } from '@/types/project';
import { TRANSITION_TYPE_LABELS } from '@/types/project';

interface VideoClipData {
  videoUrl: string;
  duration: number;
  thumbnailUrl?: string;
}

interface VideoClipCardProps {
  clip: TimelineClip;
  videoClip: VideoClipData | undefined;
  pixelsPerSecond: number;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onTransitionChange: (transition: TransitionType) => void;
}

/**
 * Individual video clip in the timeline
 */
function VideoClipCard({
  clip,
  videoClip,
  pixelsPerSecond,
  isSelected,
  isPlaying,
  onSelect,
  onTransitionChange,
}: VideoClipCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showTransitionMenu, setShowTransitionMenu] = useState(false);

  const effectiveDuration = clip.duration - clip.trimStart - clip.trimEnd;
  const width = Math.max(effectiveDuration * pixelsPerSecond, 60);
  const left = clip.startTime * pixelsPerSecond;

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && isSelected) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        // Show first frame when not playing
        if (videoRef.current.currentTime === 0) {
          videoRef.current.currentTime = 0.1;
        }
      }
    }
  }, [isPlaying, isSelected]);

  return (
    <div
      className={cn(
        'absolute top-1 bottom-1 rounded-lg overflow-hidden cursor-pointer transition-all group',
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-800 z-20'
          : 'hover:ring-1 hover:ring-zinc-500 z-10'
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      onClick={onSelect}
    >
      {/* Video thumbnail/preview */}
      <div className="absolute inset-0 bg-zinc-700">
        {videoClip ? (
          <video
            ref={videoRef}
            src={videoClip.videoUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
            No video
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Scene badge - top left */}
      <div className="absolute top-1.5 left-2 flex items-center gap-1.5 z-10">
        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-medium rounded shadow">
          {clip.sceneOrder}
        </span>
      </div>

      {/* Duration badge - top right */}
      <div className="absolute top-1.5 right-2 z-10">
        <span className="px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded">
          {formatTime(effectiveDuration)}
        </span>
      </div>

      {/* Transition indicator - bottom left */}
      {clip.transition !== 'cut' && (
        <div className="absolute bottom-1.5 left-2 z-10">
          <span className="px-1.5 py-0.5 bg-purple-600/90 text-white text-[10px] rounded">
            {TRANSITION_TYPE_LABELS[clip.transition]}
          </span>
        </div>
      )}

      {/* Trim handles (shown on hover) */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500/50 opacity-0 group-hover:opacity-100 cursor-ew-resize transition-opacity" />
      <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-500/50 opacity-0 group-hover:opacity-100 cursor-ew-resize transition-opacity" />

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

interface TransitionMarkerProps {
  position: number;
  transition: TransitionType;
  onClick: () => void;
  isSelected: boolean;
}

/**
 * Transition indicator between clips
 */
function TransitionMarker({ position, transition, onClick, isSelected }: TransitionMarkerProps) {
  if (transition === 'cut') return null;

  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer z-30 transition-all',
        isSelected
          ? 'bg-purple-500 text-white scale-110'
          : 'bg-zinc-700 text-zinc-300 hover:bg-purple-600 hover:text-white'
      )}
      style={{ left: `${position - 12}px` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={TRANSITION_TYPE_LABELS[transition]}
    >
      <TransitionIcon transition={transition} />
    </div>
  );
}

function TransitionIcon({ transition }: { transition: TransitionType }) {
  // Simple icons for different transitions
  switch (transition) {
    case 'fade':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="2" width="4" height="8" opacity="0.3" />
          <rect x="7" y="2" width="4" height="8" />
        </svg>
      );
    case 'dissolve':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="4" cy="6" r="3" opacity="0.5" />
          <circle cx="8" cy="6" r="3" opacity="0.5" />
        </svg>
      );
    case 'wipe':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 2 L6 6 L2 10 Z" />
          <path d="M10 2 L6 6 L10 10 Z" opacity="0.3" />
        </svg>
      );
    case 'morph':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="3" width="4" height="6" />
          <path d="M7 6 L11 3 L11 9 Z" opacity="0.6" />
        </svg>
      );
    default:
      return null;
  }
}

interface VideoTrackProps {
  clips: TimelineClip[];
  getVideoClip: (videoClipId: string) => VideoClipData | undefined;
  pixelsPerSecond: number;
  selectedClipIndex: number;
  isPlaying: boolean;
  onSelectClip: (index: number) => void;
  onTransitionChange: (clipId: string, transition: TransitionType) => void;
  onSelectTransition?: (clipIndex: number) => void;
}

/**
 * Video track component showing all clips
 */
export function VideoTrack({
  clips,
  getVideoClip,
  pixelsPerSecond,
  selectedClipIndex,
  isPlaying,
  onSelectClip,
  onTransitionChange,
  onSelectTransition,
}: VideoTrackProps) {
  return (
    <div className="relative h-24 bg-zinc-800/50">
      {/* Track label */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-zinc-900 border-r border-zinc-700 flex items-center justify-center z-20">
        <div className="flex flex-col items-center gap-0.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
          </svg>
          <span className="text-[10px] text-zinc-400 font-medium">VIDEO</span>
        </div>
      </div>

      {/* Clips area */}
      <div className="absolute left-20 right-0 top-0 bottom-0 overflow-hidden">
        {clips.map((clip, index) => {
          const videoClip = getVideoClip(clip.videoClipId);
          const nextClip = clips[index + 1];

          return (
            <div key={clip.id}>
              <VideoClipCard
                clip={clip}
                videoClip={videoClip}
                pixelsPerSecond={pixelsPerSecond}
                isSelected={index === selectedClipIndex}
                isPlaying={isPlaying && index === selectedClipIndex}
                onSelect={() => onSelectClip(index)}
                onTransitionChange={(t) => onTransitionChange(clip.id, t)}
              />

              {/* Transition marker between clips */}
              {nextClip && clip.transition !== 'cut' && (
                <TransitionMarker
                  position={(clip.startTime + clip.duration) * pixelsPerSecond}
                  transition={clip.transition}
                  isSelected={index === selectedClipIndex}
                  onClick={() => onSelectTransition?.(index)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VideoTrack;
