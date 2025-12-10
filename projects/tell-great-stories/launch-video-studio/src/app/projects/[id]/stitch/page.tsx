'use client';

import { useState, useEffect, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, useToast } from '@/components/ui';
import { PhaseStepper } from '@/components/navigation';
import { cn } from '@/lib/utils';
import { isTimelineComplete } from '@/types/project';
import type {
  Project,
  TimelineData,
  TimelineClip,
  VideoClipsData,
  Storyboard,
  ClipSpeed,
} from '@/types/project';

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
 * Skip back icon
 */
function SkipBackIcon({ className }: { className?: string }) {
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
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" />
    </svg>
  );
}

/**
 * Skip forward icon
 */
function SkipForwardIcon({ className }: { className?: string }) {
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
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
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

/**
 * Format time as MM:SS.ms
 */
function formatTimeDetailed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

interface StitchPageProps {
  params: Promise<{ id: string }>;
}

export default function StitchPage({ params }: StitchPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [videoClips, setVideoClips] = useState<VideoClipsData | null>(null);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Load project data and auto-create timeline if needed
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          if (response.status === 404) {
            addToast({ type: 'error', message: 'Project not found' });
            router.push('/projects');
            return;
          }
          throw new Error('Failed to load project');
        }
        const data = await response.json();
        setProject(data.project);
        setStoryboard(data.project.storyboard);
        setVideoClips(data.project.videoClips);

        // Auto-create timeline if not exists but we have approved videos
        if (!data.project.timeline && data.project.videoClips?.clips.some((c: { isApproved: boolean; status: string }) => c.isApproved && c.status === 'completed')) {
          // Auto-create timeline
          const timelineResponse = await fetch(`/api/projects/${projectId}/timeline`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          if (timelineResponse.ok) {
            const timelineData = await timelineResponse.json();
            setTimeline(timelineData.timeline);
          }
        } else {
          setTimeline(data.project.timeline);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        addToast({ type: 'error', message: 'Failed to load project' });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [projectId, router, addToast]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayback();
          break;
        case 'Home':
          e.preventDefault();
          handleSeek(0);
          break;
        case 'End':
          e.preventDefault();
          if (timeline) {
            handleSeek(timeline.totalDuration);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (timeline) {
            handleSeek(Math.min(timeline.totalDuration, currentTime + 1));
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, timeline, isPlaying]);

  // Get video clip data by ID
  const getVideoClipById = useCallback((videoClipId: string) => {
    return videoClips?.clips.find((c) => c.id === videoClipId);
  }, [videoClips]);

  // Create timeline from approved clips
  async function handleCreateTimeline() {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create timeline');
      }

      const data = await response.json();
      setTimeline(data.timeline);
      addToast({
        type: 'success',
        message: `Timeline created with ${data.timeline.clips.length} clips!`,
      });
    } catch (error) {
      console.error('Error creating timeline:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create timeline',
      });
    } finally {
      setIsCreating(false);
    }
  }

  // Update clip playback speed
  async function handleSpeedChange(clipId: string, speed: ClipSpeed) {
    try {
      const response = await fetch(`/api/projects/${projectId}/timeline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-speed',
          clipId,
          speed,
        }),
      });

      if (!response.ok) throw new Error('Failed to update speed');

      const data = await response.json();
      setTimeline(data.timeline);
      // The useEffect watching timeline will apply the playback rate
    } catch (error) {
      console.error('Error updating speed:', error);
      addToast({ type: 'error', message: 'Failed to update speed' });
    }
  }

  // Finalize timeline and continue
  async function handleFinalize() {
    setIsConfirming(true);
    try {
      // First finalize the timeline
      const timelineResponse = await fetch(`/api/projects/${projectId}/timeline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize' }),
      });

      if (!timelineResponse.ok) throw new Error('Failed to finalize timeline');

      // Then update project status
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'audio' }),
      });

      if (!response.ok) throw new Error('Failed to update project status');

      addToast({ type: 'success', message: 'Timeline finalized!' });
      router.push(`/projects/${projectId}/audio`);
    } catch (error) {
      console.error('Error finalizing:', error);
      addToast({ type: 'error', message: 'Failed to finalize timeline' });
    } finally {
      setIsConfirming(false);
    }
  }

  // Track if we should auto-play after loading
  const shouldAutoPlayRef = useRef(false);

  // Handle video ended - move to next clip and continue playing
  function handleVideoEnded() {
    if (!timeline) return;

    if (currentClipIndex < timeline.clips.length - 1) {
      // Set flag to auto-play next clip BEFORE changing index
      shouldAutoPlayRef.current = true;
      setCurrentClipIndex(currentClipIndex + 1);
    } else {
      // End of all clips - loop back to start and stop
      shouldAutoPlayRef.current = false;
      setCurrentClipIndex(0);
      setIsPlaying(false);
    }
  }

  // Load video when clip index changes (source changes)
  useEffect(() => {
    if (!previewVideoRef.current || !timeline) return;

    const clip = timeline.clips[currentClipIndex];
    if (!clip) return;

    const videoClip = getVideoClipById(clip.videoClipId);
    if (!videoClip) return;

    const video = previewVideoRef.current;

    // Set up loadeddata handler to play once loaded
    const handleLoaded = () => {
      // Apply playback speed setting
      video.playbackRate = clip.speed ?? 1;

      if (shouldAutoPlayRef.current) {
        video.play().catch((err) => {
          console.log('Auto-play prevented:', err);
        });
      }
    };

    video.addEventListener('loadeddata', handleLoaded, { once: true });

    // Set the source and load
    video.src = videoClip.videoUrl;
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
    };
  }, [currentClipIndex, getVideoClipById]);

  // Apply playback speed when timeline clip speed changes (without reloading video)
  useEffect(() => {
    if (!previewVideoRef.current || !timeline) return;

    const clip = timeline.clips[currentClipIndex];
    if (!clip) return;

    const targetSpeed = clip.speed ?? 1;
    if (previewVideoRef.current.playbackRate !== targetSpeed) {
      previewVideoRef.current.playbackRate = targetSpeed;
    }
  }, [timeline, currentClipIndex]);

  // Update current time for the overall timeline
  function handleTimeUpdate() {
    if (!previewVideoRef.current || !timeline) return;

    // Calculate total time played so far
    let totalTime = 0;
    for (let i = 0; i < currentClipIndex; i++) {
      const clip = timeline.clips[i];
      const videoClip = getVideoClipById(clip.videoClipId);
      totalTime += videoClip?.duration || 0;
    }
    totalTime += previewVideoRef.current.currentTime;
    setCurrentTime(totalTime);
  }

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

  // Seek to specific time
  const handleSeek = useCallback((time: number) => {
    if (!timeline || !previewVideoRef.current) return;

    // Find which clip this time falls in
    let accumulatedTime = 0;
    for (let i = 0; i < timeline.clips.length; i++) {
      const clip = timeline.clips[i];
      const videoClip = getVideoClipById(clip.videoClipId);
      const clipDuration = videoClip?.duration || clip.duration;

      if (time < accumulatedTime + clipDuration) {
        // Found the clip
        setCurrentClipIndex(i);
        const clipTime = time - accumulatedTime;
        // Need to wait for the video to change before seeking
        setTimeout(() => {
          if (previewVideoRef.current) {
            previewVideoRef.current.currentTime = clipTime;
          }
        }, 50);
        break;
      }
      accumulatedTime += clipDuration;
    }

    setCurrentTime(time);
  }, [timeline, getVideoClipById]);

  // Skip to start
  function handleSkipBack() {
    handleSeek(0);
  }

  // Skip to end
  function handleSkipForward() {
    if (timeline) {
      handleSeek(timeline.totalDuration);
    }
  }

  // Get scene start time
  const getSceneStartTime = useCallback((sceneOrder: number): number => {
    if (!timeline) return 0;
    let startTime = 0;
    for (const clip of timeline.clips) {
      if (clip.sceneOrder >= sceneOrder) break;
      const videoClip = getVideoClipById(clip.videoClipId);
      startTime += videoClip?.duration || 0;
    }
    return startTime;
  }, [timeline, getVideoClipById]);

  // Get current clip based on index
  const currentClip = timeline?.clips[currentClipIndex];
  const currentVideoClip = currentClip ? getVideoClipById(currentClip.videoClipId) : null;

  if (isLoading) {
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

  if (!storyboard || !videoClips) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Complete the Videos phase first</p>
          <Link
            href={`/projects/${projectId}/videos`}
            className="text-zinc-900 underline"
          >
            Go to Videos
          </Link>
        </div>
      </div>
    );
  }

  const canContinue = timeline && timeline.clips.length > 0;
  const totalDuration = timeline?.totalDuration || 0;

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
            <p className="text-[13px] text-zinc-500">Phase 6: Stitch</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            {timeline?.clips.length || 0} clips
          </span>
          {!timeline ? (
            <Button
              onClick={handleCreateTimeline}
              loading={isCreating}
              size="sm"
            >
              Create Timeline
            </Button>
          ) : (
            <Button
              onClick={handleFinalize}
              loading={isConfirming}
              disabled={!canContinue}
              size="sm"
              icon={<CheckIcon className="w-4 h-4" />}
            >
              Continue to Audio
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[220px] shrink-0 bg-zinc-50 border-r border-zinc-200 p-4 overflow-y-auto">
          <PhaseStepper projectId={projectId} currentPhase={project.status} activePhase="stitch" />
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
                        onTimeUpdate={handleTimeUpdate}
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

                {/* Playback controls */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    onClick={handleSkipBack}
                    className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <SkipBackIcon className="w-5 h-5" />
                  </button>
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
                  <button
                    onClick={handleSkipForward}
                    className="p-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <SkipForwardIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Time display */}
                <div className="mt-2 text-center text-sm text-zinc-500">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </div>

                {/* Timeline scrubber */}
                {timeline && timeline.clips.length > 0 && (
                  <div className="mt-4">
                    <div
                      className="h-2 bg-zinc-200 rounded-full cursor-pointer relative"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        handleSeek(percent * totalDuration);
                      }}
                    >
                      <div
                        className="h-full bg-zinc-900 rounded-full transition-all"
                        style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Clip thumbnails */}
              {timeline && timeline.clips.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-zinc-900 mb-4">Timeline Clips</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {timeline.clips.map((clip, index) => {
                      const videoClip = getVideoClipById(clip.videoClipId);
                      return (
                        <button
                          key={clip.id}
                          onClick={() => {
                            setCurrentClipIndex(index);
                            handleSeek(getSceneStartTime(clip.sceneOrder));
                          }}
                          className={cn(
                            'shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all',
                            currentClipIndex === index
                              ? 'border-zinc-900 ring-2 ring-zinc-900/20'
                              : 'border-zinc-200 hover:border-zinc-300'
                          )}
                        >
                          <div className="aspect-video bg-zinc-100 relative">
                            {videoClip && (
                              <video
                                src={videoClip.videoUrl}
                                className="w-full h-full object-cover"
                                muted
                              />
                            )}
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded">
                              {clip.sceneOrder}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clip details */}
              {currentClip && (
                <div className="mt-8 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                  <h3 className="text-sm font-medium text-zinc-900 mb-4">Clip Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Duration</label>
                      <p className="text-sm text-zinc-900">{formatTimeDetailed(currentClip.duration)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Start Time</label>
                      <p className="text-sm text-zinc-900">{formatTimeDetailed(currentClip.startTime)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 block mb-1">Speed</label>
                      <div className="flex gap-1">
                        {([1, 1.2, 1.5, 2] as ClipSpeed[]).map((speed) => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedChange(currentClip.id, speed)}
                            className={cn(
                              'flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors',
                              (currentClip.speed ?? 1) === speed
                                ? 'bg-zinc-900 text-white'
                                : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                            )}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No timeline state */}
              {!timeline && (
                <div className="text-center py-12">
                  <p className="text-zinc-500 mb-4">
                    No timeline created yet. Create one to start stitching your video clips.
                  </p>
                  <Button onClick={handleCreateTimeline} loading={isCreating}>
                    Create Timeline
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
