'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, useToast } from '@/components/ui';
import { PhaseStepper } from '@/components/navigation';
import { cn } from '@/lib/utils';
import type { Project, AudioData, TimelineData, VideoClipsData, MusicTrack } from '@/types/project';

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
 * Upload icon
 */
function UploadIcon({ className }: { className?: string }) {
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
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

/**
 * Trash icon
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
      width="16"
      height="16"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

/**
 * Volume icon
 */
function VolumeIcon({ className }: { className?: string }) {
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
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
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
 * Music Clip Selector - A sliding bracket to select which portion of music to use
 */
interface MusicClipSelectorProps {
  track: MusicTrack;
  videoDuration: number;
  onClipStartChange: (clipStart: number) => void;
}

function MusicClipSelector({ track, videoDuration, onClipStartChange }: MusicClipSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bracketRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localClipStart, setLocalClipStart] = useState(track.clipStart || 0);
  const dragOffsetRef = useRef(0);
  const clipStartRef = useRef(localClipStart);

  // Keep ref in sync with state for use in event handlers
  useEffect(() => {
    clipStartRef.current = localClipStart;
  }, [localClipStart]);

  // Calculate bracket width as percentage of track
  const bracketWidthPercent = Math.min((videoDuration / track.duration) * 100, 100);

  // Calculate bracket position as percentage
  const maxClipStart = Math.max(0, track.duration - videoDuration);
  const bracketLeftPercent = maxClipStart > 0 ? (localClipStart / track.duration) * 100 : 0;

  // Handle mouse down - record where on the bracket we clicked
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current || !bracketRef.current) return;

    const bracketRect = bracketRef.current.getBoundingClientRect();
    // Store the offset from the left edge of the bracket where we clicked
    dragOffsetRef.current = e.clientX - bracketRect.left;

    setIsDragging(true);
  }, []);

  // Handle click on track background to jump bracket to position
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = rect.width;

    // Calculate where the center of the bracket should be
    const bracketWidthPx = (bracketWidthPercent / 100) * trackWidth;
    const targetLeftPx = clickX - bracketWidthPx / 2;

    // Convert to percentage and then to clipStart
    const targetLeftPercent = Math.max(0, Math.min(100 - bracketWidthPercent, (targetLeftPx / trackWidth) * 100));
    const newClipStart = (targetLeftPercent / 100) * track.duration;

    setLocalClipStart(newClipStart);
    onClipStartChange(newClipStart);
  }, [isDragging, bracketWidthPercent, track.duration, onClipStartChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const trackWidth = rect.width;

      // Calculate where the left edge of the bracket should be
      // based on mouse position minus the offset where we grabbed it
      const bracketLeftPx = e.clientX - rect.left - dragOffsetRef.current;

      // Convert to clip start time
      const bracketWidthPx = (bracketWidthPercent / 100) * trackWidth;
      const maxLeftPx = trackWidth - bracketWidthPx;
      const clampedLeftPx = Math.max(0, Math.min(maxLeftPx, bracketLeftPx));

      const newClipStart = (clampedLeftPx / trackWidth) * track.duration;

      setLocalClipStart(newClipStart);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Use ref to get latest value
      onClipStartChange(clipStartRef.current);
    };

    // Use passive: false for smoother handling
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, bracketWidthPercent, track.duration, onClipStartChange]);

  // Sync local state with prop when track changes externally
  useEffect(() => {
    if (!isDragging) {
      setLocalClipStart(track.clipStart || 0);
    }
  }, [track.clipStart, isDragging]);

  // Generate stable waveform bars (memoized)
  const waveformBars = useRef(
    Array.from({ length: 50 }, (_, i) => 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10)
  ).current;

  // If music is shorter than video, no selection needed
  if (track.duration <= videoDuration) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Music Selection</span>
          <span className="text-xs text-zinc-400">
            Music will loop ({formatTime(track.duration)} / {formatTime(videoDuration)})
          </span>
        </div>
        <div className="h-10 bg-zinc-100 rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-100 border-2 border-purple-400 rounded-lg flex items-center justify-center">
            <span className="text-xs text-purple-600 font-medium">Full Track (will loop)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">Select Music Clip</span>
        <span className="text-xs text-zinc-400">
          {formatTime(localClipStart)} - {formatTime(localClipStart + videoDuration)} of {formatTime(track.duration)}
        </span>
      </div>

      {/* Track timeline */}
      <div
        ref={containerRef}
        className="h-10 bg-zinc-100 rounded-lg relative overflow-hidden cursor-pointer select-none"
        onClick={handleTrackClick}
      >
        {/* Background track visualization */}
        <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
          {/* Simple waveform visualization - now stable */}
          <div className="flex-1 flex items-center justify-around h-6">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className="w-0.5 bg-zinc-300 rounded-full"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        {/* Selection bracket */}
        <div
          ref={bracketRef}
          className={cn(
            "absolute top-0 bottom-0 bg-purple-200/80 border-2 border-purple-500 rounded-lg select-none",
            isDragging ? "cursor-grabbing bg-purple-300/80" : "cursor-grab"
          )}
          style={{
            left: `${bracketLeftPercent}%`,
            width: `${bracketWidthPercent}%`,
            // Remove transition during drag for immediate response
            transition: isDragging ? 'none' : 'left 0.1s ease-out',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Left handle */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-purple-500 rounded-l-lg flex items-center justify-center">
            <div className="w-0.5 h-4 bg-white rounded-full" />
          </div>

          {/* Right handle */}
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-purple-500 rounded-r-lg flex items-center justify-center">
            <div className="w-0.5 h-4 bg-white rounded-full" />
          </div>

          {/* Label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-purple-700 font-medium bg-purple-100/80 px-2 py-0.5 rounded">
              {formatTime(videoDuration)}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-400 mt-1">
        Drag the bracket to select which part of the music plays with your video
      </p>
    </div>
  );
}

interface AudioPageProps {
  params: Promise<{ id: string }>;
}

export default function AudioPage({ params }: AudioPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [audio, setAudio] = useState<AudioData | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [videoClips, setVideoClips] = useState<VideoClipsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const musicFileInputRef = useRef<HTMLInputElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [musicVolume, setMusicVolume] = useState(0.5);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const musicAudioRef = useRef<HTMLAudioElement>(null);

  // Track if we should auto-play after loading
  const shouldAutoPlayRef = useRef(false);

  // Use ref to track playing state for event handlers (avoids stale closure)
  const isPlayingRef = useRef(false);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Get the music track (single track only)
  const musicTrack = audio?.musicTracks?.[0];

  // Load project and audio data
  const loadData = useCallback(async () => {
    try {
      const [projectRes, audioRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/audio`),
      ]);

      if (!projectRes.ok) {
        throw new Error('Failed to load project');
      }

      const projectData = await projectRes.json();
      setProject(projectData.project);
      setTimeline(projectData.project.timeline);
      setVideoClips(projectData.project.videoClips);

      if (audioRes.ok) {
        const audioData = await audioRes.json();
        setAudio(audioData.audio);
        if (audioData.audio?.musicVolume !== undefined) {
          setMusicVolume(audioData.audio.musicVolume);
        }
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

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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

  // Upload music file
  const uploadMusic = async (file: File) => {
    setUploadingMusic(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/projects/${projectId}/audio/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload music');
      }

      const data = await res.json();
      setAudio(data.audio);

      // Get the audio duration after loading
      const audioEl = new Audio(data.track.audioUrl);
      audioEl.addEventListener('loadedmetadata', async () => {
        // Update the track with actual duration
        await fetch(`/api/projects/${projectId}/audio`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update-music',
            trackId: data.track.id,
            musicTrack: { duration: audioEl.duration, clipStart: 0 },
          }),
        });
        // Reload audio data
        const audioRes = await fetch(`/api/projects/${projectId}/audio`);
        if (audioRes.ok) {
          const audioData = await audioRes.json();
          setAudio(audioData.audio);
        }
      });

      addToast({ type: 'success', message: 'Music uploaded successfully!' });
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to upload music',
      });
    } finally {
      setUploadingMusic(false);
      if (musicFileInputRef.current) {
        musicFileInputRef.current.value = '';
      }
    }
  };

  // Handle file input change
  const handleMusicFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMusic(file);
    }
  };

  // Remove a music track
  const removeMusic = async (trackId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/audio`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove-music',
          trackId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove music');
      }

      const data = await res.json();
      setAudio(data.audio);
      addToast({ type: 'success', message: 'Music track removed' });
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to remove music',
      });
    }
  };

  // Update music volume
  const handleVolumeChange = async (value: number) => {
    setMusicVolume(value);
    if (musicAudioRef.current) {
      musicAudioRef.current.volume = value;
    }

    try {
      await fetch(`/api/projects/${projectId}/audio`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-volume',
          musicVolume: value,
        }),
      });
    } catch (err) {
      console.error('Failed to update volume:', err);
    }
  };

  // Update music clip start
  const handleClipStartChange = async (clipStart: number) => {
    if (!musicTrack) return;

    try {
      await fetch(`/api/projects/${projectId}/audio`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-music',
          trackId: musicTrack.id,
          musicTrack: { clipStart },
        }),
      });

      // Update local state
      setAudio(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          musicTracks: prev.musicTracks.map(t =>
            t.id === musicTrack.id ? { ...t, clipStart } : t
          ),
        };
      });
    } catch (err) {
      console.error('Failed to update clip start:', err);
    }
  };

  // Finalize audio and proceed
  const finalizeAudio = async () => {
    setIsConfirming(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/audio`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to finalize audio');
      }

      // Update project status to export
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'export' }),
      });

      addToast({ type: 'success', message: 'Audio finalized!' });
      router.push(`/projects/${projectId}/export`);
    } catch (err) {
      addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to finalize audio',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Get video clip by ID
  const getVideoClipById = useCallback((videoClipId: string) => {
    return videoClips?.clips.find((c) => c.id === videoClipId);
  }, [videoClips]);

  // Handle video ended - move to next clip and continue playing
  function handleVideoEnded() {
    if (!timeline) return;

    if (currentClipIndex < timeline.clips.length - 1) {
      // Set flag to auto-play next clip BEFORE changing index
      shouldAutoPlayRef.current = true;
      setCurrentClipIndex(currentClipIndex + 1);
      // Music will continue playing - sync handled in handleTimeUpdate
    } else {
      // End of all clips - loop back to start and stop
      shouldAutoPlayRef.current = false;
      setCurrentClipIndex(0);
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
      }
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

    // Set up loadeddata handler to play once loaded
    const handleLoaded = () => {
      if (shouldAutoPlayRef.current) {
        video.play().catch((err) => {
          console.log('Auto-play prevented:', err);
        });
        // Ensure music is also playing when video auto-plays
        if (musicAudioRef.current && musicTrack && musicTrack.duration > 0 && isPlayingRef.current) {
          if (musicAudioRef.current.paused) {
            musicAudioRef.current.play().catch(() => {});
          }
        }
      }
    };

    video.addEventListener('loadeddata', handleLoaded, { once: true });

    // Set the source and load
    video.src = videoClip.videoUrl;
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
    };
  }, [currentClipIndex, timeline, getVideoClipById, musicTrack]);

  // Update current time and sync music
  function handleTimeUpdate() {
    if (!previewVideoRef.current || !timeline) return;

    // Calculate total elapsed time across all clips
    let totalTime = 0;
    for (let i = 0; i < currentClipIndex; i++) {
      const clip = timeline.clips[i];
      const videoClip = getVideoClipById(clip.videoClipId);
      totalTime += videoClip?.duration || 0;
    }
    totalTime += previewVideoRef.current.currentTime;
    setCurrentTime(totalTime);

    // Sync music position - use ref to get current playing state
    if (musicAudioRef.current && musicTrack && musicTrack.duration > 0 && isPlayingRef.current) {
      const clipStart = musicTrack.clipStart || 0;
      const targetMusicTime = clipStart + totalTime;

      // If music is shorter than video, loop it
      const effectiveMusicTime = targetMusicTime % musicTrack.duration;

      // Only adjust if significantly out of sync (more than 0.3 seconds)
      const currentMusicTime = musicAudioRef.current.currentTime;
      if (Math.abs(currentMusicTime - effectiveMusicTime) > 0.3) {
        musicAudioRef.current.currentTime = effectiveMusicTime;
      }

      // Make sure music is playing if video is playing
      if (musicAudioRef.current.paused) {
        musicAudioRef.current.play().catch(() => {});
      }
    }
  }

  // Toggle play/pause
  function togglePlayback() {
    if (previewVideoRef.current) {
      if (previewVideoRef.current.paused) {
        shouldAutoPlayRef.current = true;
        isPlayingRef.current = true;
        setIsPlaying(true);

        previewVideoRef.current.play().catch(() => {});

        // Start music from correct position
        if (musicAudioRef.current && musicTrack && musicTrack.duration > 0) {
          const clipStart = musicTrack.clipStart || 0;
          const targetMusicTime = clipStart + currentTime;
          const effectiveMusicTime = targetMusicTime % musicTrack.duration;

          // Ensure not muted and volume is set
          musicAudioRef.current.muted = false;
          musicAudioRef.current.volume = musicVolume;
          musicAudioRef.current.currentTime = effectiveMusicTime;
          musicAudioRef.current.play().catch(() => {});
        }
      } else {
        shouldAutoPlayRef.current = false;
        isPlayingRef.current = false;
        previewVideoRef.current.pause();
        musicAudioRef.current?.pause();
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
        setCurrentClipIndex(i);
        const clipTime = time - accumulatedTime;
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

    // Sync music position on seek
    if (musicAudioRef.current && musicTrack) {
      const clipStart = musicTrack.clipStart || 0;
      const targetMusicTime = clipStart + time;
      const effectiveMusicTime = targetMusicTime % musicTrack.duration;
      musicAudioRef.current.currentTime = effectiveMusicTime;
    }
  }, [timeline, getVideoClipById, musicTrack]);

  // Skip controls
  function handleSkipBack() {
    handleSeek(0);
  }

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

  // Load music when audio data changes
  useEffect(() => {
    if (!musicTrack || !musicAudioRef.current) return;

    if (musicTrack.audioUrl) {
      musicAudioRef.current.src = musicTrack.audioUrl;
      musicAudioRef.current.volume = musicVolume;
      musicAudioRef.current.loop = true;
      musicAudioRef.current.load();
    }
  }, [musicTrack, musicVolume]);

  // Get current clip
  const currentClip = timeline?.clips[currentClipIndex];
  const currentVideoClip = currentClip ? getVideoClipById(currentClip.videoClipId) : null;

  // Total timeline duration
  const totalDuration = timeline?.totalDuration || 0;

  // Check if we have music
  const hasMusic = musicTrack && musicTrack.audioUrl;

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
      {/* Hidden audio element for music playback */}
      <audio ref={musicAudioRef} className="hidden" />

      {/* Hidden file input */}
      <input
        ref={musicFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
        onChange={handleMusicFileChange}
        className="hidden"
      />

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
            <p className="text-[13px] text-zinc-500">Phase 7: Audio</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={finalizeAudio}
            loading={isConfirming}
            size="sm"
            icon={<CheckIcon className="w-4 h-4" />}
          >
            Continue to Export
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[220px] shrink-0 bg-zinc-50 border-r border-zinc-200 p-4 overflow-y-auto">
          <PhaseStepper projectId={projectId} currentPhase={project.status} activePhase="audio" />
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
                      {/* Music indicator */}
                      {hasMusic && (
                        <div className="absolute top-3 right-3">
                          <span className={cn(
                            "px-2 py-1 text-white text-xs rounded flex items-center gap-1",
                            isPlaying ? "bg-purple-600" : "bg-purple-600/60"
                          )}>
                            <MusicIcon className="w-3 h-3" />
                            {isPlaying ? "Playing" : "Music"}
                          </span>
                        </div>
                      )}
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

              {/* Background Music Section */}
              <div className="mt-8 p-6 bg-zinc-50 rounded-lg border border-zinc-200">
                <h3 className="text-sm font-medium text-zinc-900 mb-4 flex items-center gap-2">
                  <MusicIcon className="w-4 h-4" />
                  Background Music
                </h3>

                {/* Existing music track */}
                {musicTrack ? (
                  <div className="space-y-3 mb-4">
                    <div className="p-4 bg-white rounded-lg border border-zinc-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900">
                            {musicTrack.name}
                          </span>
                          {musicTrack.duration > 0 && (
                            <span className="text-xs text-zinc-500">
                              {formatTime(musicTrack.duration)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeMusic(musicTrack.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Remove track"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Audio preview */}
                      {musicTrack.audioUrl && (
                        <audio controls src={musicTrack.audioUrl} className="w-full h-8 mb-3" />
                      )}

                      {/* Music clip selector */}
                      {musicTrack.duration > 0 && totalDuration > 0 && (
                        <MusicClipSelector
                          track={musicTrack}
                          videoDuration={totalDuration}
                          onClipStartChange={handleClipStartChange}
                        />
                      )}
                    </div>

                    {/* Volume control */}
                    <div className="flex items-center gap-3 pt-2">
                      <VolumeIcon className="w-4 h-4 text-zinc-500" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={musicVolume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-zinc-500 w-8">
                        {Math.round(musicVolume * 100)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 mb-4">
                    No background music added yet. Upload an audio file to add music to your video.
                  </p>
                )}

                {/* Upload button - only show if no music yet */}
                {!musicTrack && (
                  <>
                    <button
                      onClick={() => musicFileInputRef.current?.click()}
                      disabled={uploadingMusic}
                      className={cn(
                        "w-full px-4 py-3 border-2 border-dashed border-zinc-200 rounded-lg text-sm transition-colors",
                        "hover:border-zinc-300 hover:bg-white",
                        uploadingMusic && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {uploadingMusic ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                          <span className="text-zinc-500">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-zinc-500">
                          <UploadIcon className="w-4 h-4" />
                          <span>Upload Music File</span>
                        </div>
                      )}
                    </button>
                    <p className="text-xs text-zinc-400 mt-2 text-center">
                      Supports MP3, WAV, OGG, M4A, AAC
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
