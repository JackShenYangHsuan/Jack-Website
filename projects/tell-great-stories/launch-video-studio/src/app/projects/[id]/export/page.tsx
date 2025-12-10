'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, useToast } from '@/components/ui';
import { PhaseStepper } from '@/components/navigation';
import { cn } from '@/lib/utils';
import type { Project, TimelineData, VideoClipsData, AudioData, ExportData } from '@/types/project';

/**
 * Arrow left icon for back button
 */
function ArrowLeftIcon({ className }: { className?: string }) {
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
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/**
 * Download icon
 */
function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

/**
 * Play icon
 */
function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width="16"
      height="16"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

/**
 * Pause icon
 */
function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width="16"
      height="16"
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

/**
 * Film icon
 */
function FilmIcon({ className }: { className?: string }) {
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
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
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
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Music icon
 */
function MusicIcon({ className }: { className?: string }) {
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
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

/**
 * Loader icon
 */
function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
      width="16"
      height="16"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/**
 * Format time as MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface ExportPageProps {
  params: Promise<{ id: string }>;
}

export default function ExportPage({ params }: ExportPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [videoClips, setVideoClips] = useState<VideoClipsData | null>(null);
  const [audio, setAudio] = useState<AudioData | null>(null);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Export settings
  const [includeMusic, setIncludeMusic] = useState(true);
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p');

  // Preview playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const shouldAutoPlayRef = useRef(false);

  // Load project data
  const loadData = useCallback(async () => {
    try {
      const projectRes = await fetch(`/api/projects/${projectId}`);

      if (!projectRes.ok) {
        throw new Error('Failed to load project');
      }

      const projectData = await projectRes.json();
      setProject(projectData.project);
      setTimeline(projectData.project.timeline);
      setVideoClips(projectData.project.videoClips);
      setAudio(projectData.project.audio);
      setExportData(projectData.project.exportData);

      // If there's audio with music settings, use them
      if (projectData.project.audio?.musicVolume !== undefined) {
        setIncludeMusic(projectData.project.audio.musicTracks?.length > 0);
      }
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load data',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get video clip by ID
  const getVideoClipById = useCallback((videoClipId: string) => {
    return videoClips?.clips.find((c) => c.id === videoClipId);
  }, [videoClips]);

  // Handle video ended - move to next clip and continue playing
  function handleVideoEnded() {
    if (!timeline) return;

    if (currentClipIndex < timeline.clips.length - 1) {
      shouldAutoPlayRef.current = true;
      setCurrentClipIndex(currentClipIndex + 1);
    } else {
      shouldAutoPlayRef.current = false;
      setCurrentClipIndex(0);
      setIsPlaying(false);
    }
  }

  // Load and play video when clip index changes
  useEffect(() => {
    if (!previewVideoRef.current || !timeline) return;

    const clip = timeline.clips[currentClipIndex];
    if (!clip) return;

    const videoClip = getVideoClipById(clip.videoClipId);
    if (!videoClip) return;

    const video = previewVideoRef.current;

    const handleLoaded = () => {
      if (shouldAutoPlayRef.current) {
        video.play().catch((err) => {
          console.log('Auto-play prevented:', err);
        });
      }
    };

    video.addEventListener('loadeddata', handleLoaded, { once: true });
    video.src = videoClip.videoUrl;
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
    };
  }, [currentClipIndex, timeline, getVideoClipById]);

  // Toggle play/pause
  function togglePlayback() {
    if (previewVideoRef.current) {
      if (previewVideoRef.current.paused) {
        shouldAutoPlayRef.current = true;
        previewVideoRef.current.play();
        setIsPlaying(true);
      } else {
        shouldAutoPlayRef.current = false;
        previewVideoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }

  // Export video
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeMusic,
          resolution,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to export video');
      }

      // Poll for progress
      const pollProgress = async () => {
        const statusRes = await fetch(`/api/projects/${projectId}/export`);
        if (statusRes.ok) {
          const data = await statusRes.json();
          setExportProgress(data.progress || 0);
          setExportData(data.exportData);

          if (data.exportData?.status === 'exporting') {
            setTimeout(pollProgress, 1000);
          } else if (data.exportData?.status === 'completed') {
            setIsExporting(false);
            addToast({ type: 'success', message: 'Video exported successfully!' });
          } else if (data.exportData?.status === 'failed') {
            setIsExporting(false);
            addToast({ type: 'error', message: data.exportData.error || 'Export failed' });
          }
        }
      };

      // Start polling
      setTimeout(pollProgress, 1000);
    } catch (err) {
      setIsExporting(false);
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to export video',
      });
    }
  };

  // Download exported video
  const handleDownload = () => {
    if (exportData?.exportedVideoUrl) {
      const link = document.createElement('a');
      link.href = exportData.exportedVideoUrl;
      link.download = `${project?.name || 'video'}-export.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Mark project as complete
  const handleComplete = async () => {
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'complete' }),
      });

      addToast({ type: 'success', message: 'Project marked as complete!' });
      router.push('/projects');
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to complete project',
      });
    }
  };

  // Get current clip for preview
  const currentClip = timeline?.clips[currentClipIndex];
  const currentVideoClip = currentClip ? getVideoClipById(currentClip.videoClipId) : null;

  // Total timeline duration
  const totalDuration = timeline?.totalDuration || 0;

  // Check if we have music
  const hasMusic = audio?.musicTracks && audio.musicTracks.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-500 text-sm">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Project not found</p>
          <Link href="/projects" className="text-zinc-900 underline">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Complete the Stitch phase first</p>
          <Link
            href={`/projects/${projectId}/stitch`}
            className="text-zinc-900 underline"
          >
            Go to Stitch
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-200 bg-white flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="flex items-center justify-center w-8 h-8 rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="text-[15px] font-semibold text-zinc-900">{project.name}</h1>
            <p className="text-[13px] text-zinc-500">Phase 8: Export</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {exportData?.status === 'completed' && (
            <Button
              onClick={handleComplete}
              size="sm"
              icon={<CheckIcon className="w-4 h-4" />}
            >
              Finish Project
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[220px] shrink-0 bg-zinc-50 border-r border-zinc-200 p-4 overflow-y-auto">
          <PhaseStepper projectId={projectId} currentPhase={project.status} activePhase="export" />
        </aside>

        {/* Center content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto px-8 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Video Preview */}
              <div className="mb-6">
                <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
                  {currentVideoClip ? (
                    <>
                      <video
                        ref={previewVideoRef}
                        className="w-full h-full object-contain"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={handleVideoEnded}
                        muted
                        playsInline
                      />
                      {/* Scene indicator */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2 py-1 bg-zinc-900/80 text-white text-xs font-medium rounded">
                          Scene {currentClip?.sceneOrder}
                        </span>
                        <span className="px-2 py-1 bg-zinc-900/60 text-white text-xs rounded">
                          {currentClipIndex + 1} / {timeline?.clips.length || 0}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                      <p>No clips in timeline</p>
                    </div>
                  )}
                </div>

                {/* Play button */}
                <div className="mt-4 flex items-center justify-center">
                  <button
                    onClick={togglePlayback}
                    className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-colors"
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-5 h-5" />
                    ) : (
                      <PlayIcon className="w-5 h-5 ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Duration info */}
                <div className="mt-2 text-center text-sm text-zinc-500">
                  Total Duration: {formatTime(totalDuration)}
                </div>
              </div>

              {/* Export Settings */}
              <div className="mt-8 p-6 bg-zinc-50 rounded-lg border border-zinc-200">
                <h3 className="text-sm font-medium text-zinc-900 mb-4 flex items-center gap-2">
                  <FilmIcon className="w-4 h-4" />
                  Export Settings
                </h3>

                <div className="space-y-4">
                  {/* Resolution */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Resolution
                    </label>
                    <div className="flex gap-2">
                      {(['720p', '1080p', '4k'] as const).map((res) => (
                        <button
                          key={res}
                          onClick={() => setResolution(res)}
                          disabled={isExporting}
                          className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                            resolution === res
                              ? "bg-zinc-900 text-white"
                              : "bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300",
                            isExporting && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Include Music */}
                  {hasMusic && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="includeMusic"
                        checked={includeMusic}
                        onChange={(e) => setIncludeMusic(e.target.checked)}
                        disabled={isExporting}
                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      />
                      <label htmlFor="includeMusic" className="text-sm text-zinc-700 flex items-center gap-2">
                        <MusicIcon className="w-4 h-4" />
                        Include background music
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Button / Progress */}
              <div className="mt-6">
                {exportData?.status === 'completed' ? (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900">Export Complete!</p>
                          <p className="text-xs text-green-600">
                            Your video is ready to download
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleDownload}
                        size="sm"
                        icon={<DownloadIcon className="w-4 h-4" />}
                      >
                        Download MP4
                      </Button>
                    </div>
                  </div>
                ) : isExporting ? (
                  <div className="p-6 bg-white border border-zinc-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <LoaderIcon className="w-5 h-5 text-zinc-600" />
                      <span className="text-sm font-medium text-zinc-900">
                        Exporting video...
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 text-center">
                      {exportProgress}% complete
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleExport}
                    className="w-full"
                    size="lg"
                    icon={<FilmIcon className="w-5 h-5" />}
                  >
                    Export Video
                  </Button>
                )}
              </div>

              {/* Re-export option */}
              {exportData?.status === 'completed' && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleExport}
                    className="text-sm text-zinc-500 hover:text-zinc-900 underline"
                  >
                    Export again with different settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
