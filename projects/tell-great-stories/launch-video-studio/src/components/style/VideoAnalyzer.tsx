'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, Select } from '@/components/ui';
import { VIDEO_CAPABLE_MODELS } from '@/types/settings';
import type { ReferenceVideo } from '@/types/project';

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
      width="16"
      height="16"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
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
 * YouTube icon
 */
function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width="16"
      height="16"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

/**
 * External link icon
 */
function ExternalLinkIcon({ className }: { className?: string }) {
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
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

export interface VideoAnalyzerProps {
  /** Current reference videos */
  videos: ReferenceVideo[];
  /** Callback when a video is analyzed */
  onAnalyze: (url: string, model: string) => Promise<void>;
  /** Callback when a video is deleted */
  onDelete: (videoId: string) => void;
  /** Whether analysis is in progress */
  isAnalyzing?: boolean;
  /** Video ID being deleted */
  isDeleting?: string | null;
  /** Additional class name */
  className?: string;
}

/**
 * Video analyzer component - simplified version for URL input
 */
export function VideoAnalyzer({
  videos,
  onAnalyze,
  onDelete,
  isAnalyzing = false,
  isDeleting,
  className,
}: VideoAnalyzerProps) {
  const [urlInput, setUrlInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(VIDEO_CAPABLE_MODELS[0].id);

  const handleAddVideo = async () => {
    if (!urlInput.trim()) return;
    await onAnalyze(urlInput.trim(), selectedModel);
    setUrlInput('');
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Input area */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-zinc-500 block mb-1.5">
            YouTube URL
          </label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={isAnalyzing}
            className={cn(
              'w-full h-9 px-3 text-sm rounded-md border border-zinc-200 bg-transparent',
              'focus:outline-none focus:ring-1 focus:ring-zinc-950',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'placeholder:text-zinc-400'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAnalyzing) {
                handleAddVideo();
              }
            }}
          />
        </div>
        <div className="w-56">
          <label className="text-xs font-medium text-zinc-500 block mb-1.5">
            Model
          </label>
          <Select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isAnalyzing}
            options={VIDEO_CAPABLE_MODELS.map((m) => ({
              value: m.id,
              label: m.name,
            }))}
          />
        </div>
        <Button
          onClick={handleAddVideo}
          disabled={!urlInput.trim() || isAnalyzing}
          loading={isAnalyzing}
          icon={<PlusIcon />}
        >
          Analyze
        </Button>
      </div>

      {/* Video list - compact horizontal chips */}
      {videos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {videos.map((video) => (
            <div
              key={video.id}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full text-sm',
                isDeleting === video.id && 'opacity-50'
              )}
            >
              <YouTubeIcon className="text-red-600 flex-shrink-0" />
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 hover:text-zinc-900 flex items-center gap-1 max-w-[200px] truncate"
                title={video.title}
              >
                {video.title}
                <ExternalLinkIcon className="flex-shrink-0" />
              </a>
              <button
                type="button"
                onClick={() => onDelete(video.id)}
                disabled={isDeleting === video.id}
                className="p-0.5 text-zinc-400 hover:text-red-500 transition-colors"
                aria-label="Remove video"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {videos.length === 0 && (
        <p className="text-xs text-zinc-400">
          Paste a YouTube URL above to analyze a reference video. Insights will populate the categories below.
        </p>
      )}
    </div>
  );
}
