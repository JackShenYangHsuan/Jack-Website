'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, useToast } from '@/components/ui';
import { PhaseStepper } from '@/components/navigation';
import { VideosTimelineView } from '@/components/videos';
import { cn } from '@/lib/utils';
import { isVideoClipsComplete } from '@/types/project';
import type {
  Project,
  VideoClipsData,
  VideoClip,
  StoryboardScene,
  Storyboard,
  KeyframesData,
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
 * Video/play icon for generation
 */
function VideoIcon({ className }: { className?: string }) {
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
      <polygon points="5 3 19 12 5 21 5 3" />
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
      width="16"
      height="16"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
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
 * Edit icon
 */
function EditIcon({ className }: { className?: string }) {
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
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

/**
 * List/grid icon
 */
function ListIcon({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

/**
 * Timeline icon
 */
function TimelineIcon({ className }: { className?: string }) {
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
      <line x1="3" y1="12" x2="21" y2="12" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  );
}

interface SceneVideoCardProps {
  scene: StoryboardScene;
  clips: VideoClip[];
  sourceImage: string | null;
  isGenerating: boolean;
  onApprove: (clipId: string) => void;
  onDelete: (clipId: string) => void;
  onRegenerate: (sceneId: string) => void;
  onUpdateVideoPrompt: (sceneId: string, prompt: string) => void;
}

/**
 * Card showing a scene, its source keyframe, and generated video clips
 */
function SceneVideoCard({
  scene,
  clips,
  sourceImage,
  isGenerating,
  onApprove,
  onDelete,
  onRegenerate,
  onUpdateVideoPrompt,
}: SceneVideoCardProps) {
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState(scene.customVideoPrompt || '');
  const [isSaving, setIsSaving] = useState(false);

  const approvedClip = clips.find((c) => c.isApproved);
  const otherClips = clips.filter((c) => !c.isApproved);
  const completedClips = clips.filter((c) => c.status === 'completed');

  // Save the video prompt
  const handleSavePrompt = async () => {
    setIsSaving(true);
    try {
      await onUpdateVideoPrompt(scene.id, videoPrompt);
      setShowPromptEditor(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
      {/* Scene header */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-900">
              Scene {scene.order}
            </span>
            <span className="text-xs px-2 py-0.5 bg-zinc-200 text-zinc-600 rounded">
              {scene.cameraMovement}
            </span>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
              {scene.duration}s
            </span>
          </div>
          <div className="flex items-center gap-2">
            {approvedClip && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                Approved
              </span>
            )}
            <button
              onClick={() => setShowPromptEditor(!showPromptEditor)}
              className={cn(
                'text-xs flex items-center gap-1 transition-colors',
                scene.customVideoPrompt
                  ? 'text-blue-600 hover:text-blue-700'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
              title="Edit motion prompt"
            >
              <EditIcon className="w-3 h-3" />
              Motion
            </button>
            <button
              onClick={() => onRegenerate(scene.id)}
              disabled={isGenerating || !sourceImage}
              className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshIcon className="w-3 h-3" />
              Regenerate
            </button>
          </div>
        </div>
        <p className="text-sm text-zinc-600 mt-1 line-clamp-2">
          {scene.visualDescription}
        </p>

        {/* Video prompt editor */}
        {showPromptEditor && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <label className="block text-xs font-medium text-blue-900 mb-1.5">
              Custom Motion Prompt
            </label>
            <p className="text-xs text-blue-700 mb-2">
              Describe how you want this scene to move or animate. This will be appended to the auto-generated camera movement prompt.
            </p>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="e.g., character slowly turns head, particles floating upward, subtle breathing motion, light flickering..."
              className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-blue-600">
                Camera: {scene.cameraMovement}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setVideoPrompt(scene.customVideoPrompt || '');
                    setShowPromptEditor(false);
                  }}
                  className="px-3 py-1 text-xs text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrompt}
                  disabled={isSaving}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Source keyframe */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Source Keyframe</p>
            {sourceImage ? (
              <div className="aspect-video relative rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                <Image
                  src={sourceImage}
                  alt={`Scene ${scene.order} keyframe`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-zinc-100 flex items-center justify-center">
                <span className="text-sm text-zinc-400">No image approved</span>
              </div>
            )}
          </div>

          {/* Generated video */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Generated Video</p>
            {completedClips.length === 0 ? (
              <div className="aspect-video rounded-lg bg-zinc-100 flex items-center justify-center">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-sm text-zinc-500">Generating...</span>
                  </div>
                ) : (
                  <span className="text-sm text-zinc-400">
                    {sourceImage ? 'Not generated yet' : 'Approve image first'}
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Show approved clip first */}
                {approvedClip && (
                  <div>
                    <div className="aspect-video relative rounded-lg overflow-hidden border-2 border-green-500 bg-black">
                      <video
                        key={approvedClip.id}
                        src={approvedClip.videoUrl}
                        className="w-full h-full object-contain"
                        controls
                        loop
                        muted
                        playsInline
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                        Approved
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {approvedClip.duration}s
                      </div>
                    </div>
                    {/* Action button below the video */}
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <button
                        onClick={() => onDelete(approvedClip.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-md hover:bg-red-100 transition-colors"
                        title="Delete this video"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Other clips */}
                {otherClips
                  .filter((c) => c.status === 'completed')
                  .map((clip) => (
                    <div key={clip.id}>
                      <div className="aspect-video relative rounded-lg overflow-hidden border border-zinc-200 bg-black">
                        <video
                          key={clip.id}
                          src={clip.videoUrl}
                          className="w-full h-full object-contain"
                          controls
                          loop
                          muted
                          playsInline
                        />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                          {clip.duration}s
                        </div>
                      </div>
                      {/* Action buttons below the video */}
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <button
                          onClick={() => onApprove(clip.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-md hover:bg-green-100 transition-colors"
                          title="Approve this video"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => onDelete(clip.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-sm font-medium rounded-md hover:bg-red-100 transition-colors"
                          title="Delete this video"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface VideosPageProps {
  params: Promise<{ id: string }>;
}

export default function VideosPage({ params }: VideosPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [videoClips, setVideoClips] = useState<VideoClipsData>({ clips: [] });
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [keyframes, setKeyframes] = useState<KeyframesData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingScenes, setGeneratingScenes] = useState<Set<string>>(
    new Set()
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // Load project and video clips
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
        setKeyframes(data.project.keyframes);
        setVideoClips(data.project.videoClips || { clips: [] });
      } catch (error) {
        console.error('Error loading project:', error);
        addToast({ type: 'error', message: 'Failed to load project' });
      } finally {
        setPageLoading(false);
      }
    }
    loadData();
  }, [projectId, router, addToast]);

  // Get approved image URL for a scene
  function getApprovedImageForScene(sceneId: string): string | null {
    if (!keyframes) return null;
    const approved = keyframes.images.find(
      (img) => img.sceneId === sceneId && img.isApproved
    );
    return approved?.imageUrl || null;
  }

  // Generate all videos
  async function handleGenerateAll() {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/videos/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate videos');
      }

      const data = await response.json();
      setVideoClips(data.videoClips);
      addToast({
        type: 'success',
        message: `Generated ${data.videosGenerated} video clips!`,
      });
    } catch (error) {
      console.error('Error generating videos:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate videos',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // Regenerate for a specific scene
  async function handleRegenerateScene(sceneId: string) {
    // Prevent duplicate requests if already generating this scene
    if (generatingScenes.has(sceneId) || isGenerating) {
      console.log('[Videos Page] Skipping duplicate regenerate request for scene:', sceneId);
      return;
    }

    setGeneratingScenes((prev) => new Set(prev).add(sceneId));
    try {
      const response = await fetch(`/api/projects/${projectId}/videos/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneIds: [sceneId], regenerate: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate');
      }

      const data = await response.json();
      setVideoClips(data.videoClips);
      addToast({ type: 'success', message: 'Video regenerated!' });
    } catch (error) {
      console.error('Error regenerating:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to regenerate',
      });
    } finally {
      setGeneratingScenes((prev) => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  }

  // Approve a video clip
  async function handleApprove(clipId: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/videos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipId, action: 'approve' }),
      });

      if (!response.ok) throw new Error('Failed to approve');

      const data = await response.json();
      setVideoClips(data.videoClips);
      addToast({ type: 'success', message: 'Video approved!' });
    } catch (error) {
      console.error('Error approving:', error);
      addToast({ type: 'error', message: 'Failed to approve video' });
    }
  }

  // Delete a video clip
  async function handleDelete(clipId: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/videos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipId, action: 'delete' }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      const data = await response.json();
      setVideoClips(data.videoClips);
      addToast({ type: 'success', message: 'Video deleted' });
    } catch (error) {
      console.error('Error deleting:', error);
      addToast({ type: 'error', message: 'Failed to delete video' });
    }
  }

  // Update custom video prompt for a scene
  async function handleUpdateVideoPrompt(sceneId: string, prompt: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/storyboard/scene`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId,
          updates: { customVideoPrompt: prompt },
        }),
      });

      if (!response.ok) throw new Error('Failed to update video prompt');

      // Update local storyboard state
      if (storyboard) {
        const updatedScenes = storyboard.scenes.map((s) =>
          s.id === sceneId ? { ...s, customVideoPrompt: prompt } : s
        );
        setStoryboard({ ...storyboard, scenes: updatedScenes });
      }

      addToast({ type: 'success', message: 'Motion prompt saved!' });
    } catch (error) {
      console.error('Error updating video prompt:', error);
      addToast({ type: 'error', message: 'Failed to save motion prompt' });
    }
  }

  // Reorder scenes (for timeline drag and drop)
  async function handleReorderScenes(fromIndex: number, toIndex: number) {
    if (!storyboard) return;

    const scenes = [...storyboard.scenes];
    const [moved] = scenes.splice(fromIndex, 1);
    scenes.splice(toIndex, 0, moved);
    const reorderedScenes = scenes.map((s, idx) => ({ ...s, order: idx + 1 }));

    // Optimistically update local state
    setStoryboard(prev => prev ? { ...prev, scenes: reorderedScenes } : prev);

    try {
      const response = await fetch(`/api/projects/${projectId}/storyboard`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: reorderedScenes }),
      });
      if (!response.ok) throw new Error('Failed to reorder scenes');
      addToast({ type: 'success', message: 'Scenes reordered' });
    } catch (error) {
      // Revert on error
      setStoryboard(prev => prev ? { ...prev, scenes: storyboard.scenes } : prev);
      addToast({ type: 'error', message: 'Failed to reorder scenes' });
    }
  }

  // Continue to next phase
  async function handleConfirm() {
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'stitch' }),
      });
      if (!response.ok) throw new Error('Failed to update project status');
      addToast({ type: 'success', message: 'Videos phase complete!' });
      router.push(`/projects/${projectId}/stitch`);
    } catch (error) {
      console.error('Error confirming:', error);
      addToast({ type: 'error', message: 'Failed to continue to next phase' });
    } finally {
      setIsConfirming(false);
    }
  }

  const canContinue = isVideoClipsComplete(videoClips, storyboard);
  const scenes = storyboard?.scenes || [];
  const approvedCount = scenes.filter((scene) =>
    videoClips.clips.some(
      (clip) =>
        clip.sceneId === scene.id &&
        clip.isApproved &&
        clip.status === 'completed'
    )
  ).length;

  // Count scenes that have approved keyframes (can generate videos)
  const scenesWithImages = scenes.filter((scene) =>
    keyframes?.images.some((img) => img.sceneId === scene.id && img.isApproved)
  ).length;

  if (pageLoading) {
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

  if (!storyboard || scenes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Complete the Storyboard phase first</p>
          <Link
            href={`/projects/${projectId}/storyboard`}
            className="text-zinc-900 underline"
          >
            Go to Storyboard
          </Link>
        </div>
      </div>
    );
  }

  if (!keyframes || scenesWithImages === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">
            Complete the Images phase first (approve at least one keyframe)
          </p>
          <Link
            href={`/projects/${projectId}/images`}
            className="text-zinc-900 underline"
          >
            Go to Images
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
            <h1 className="text-[15px] font-semibold text-zinc-900">
              {project.name}
            </h1>
            <p className="text-[13px] text-zinc-500">Phase 5: Videos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            {approvedCount} / {scenes.length} scenes approved
          </span>
          <div className="w-32 h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 transition-all"
              style={{ width: `${(approvedCount / scenes.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[220px] shrink-0 bg-zinc-50 border-r border-zinc-200 p-4 overflow-y-auto">
          <PhaseStepper
            projectId={projectId}
            currentPhase={project.status}
            activePhase="videos"
          />
        </aside>

        {/* Center content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto px-12 py-8">
            <div className="max-w-[1200px] mx-auto">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-900 mb-2">
                    Video Clips
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Generate animated video clips from your keyframe images.
                    Approve the best clip for each scene to continue.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* View toggle */}
                  <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
                        viewMode === 'cards'
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-900'
                      )}
                    >
                      <ListIcon className="w-4 h-4" />
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode('timeline')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
                        viewMode === 'timeline'
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-900'
                      )}
                    >
                      <TimelineIcon className="w-4 h-4" />
                      Timeline
                    </button>
                  </div>
                  <Button
                    onClick={handleGenerateAll}
                    loading={isGenerating}
                    disabled={scenesWithImages === 0}
                    icon={<VideoIcon />}
                  >
                    Generate All
                  </Button>
                </div>
              </div>

              {/* Info banner */}
              {scenesWithImages < scenes.length && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    {scenesWithImages} of {scenes.length} scenes have approved
                    keyframes. Videos can only be generated for scenes with
                    approved images.
                  </p>
                </div>
              )}

              {/* Scenes display - Cards or Timeline view */}
              {viewMode === 'timeline' ? (
                <div className="mb-6">
                  <VideosTimelineView
                    scenes={scenes}
                    clips={videoClips.clips}
                    sourceImages={Object.fromEntries(
                      scenes.map(s => [s.id, getApprovedImageForScene(s.id)])
                    )}
                    selectedSceneId={selectedSceneId}
                    generatingScenes={generatingScenes}
                    isGeneratingAll={isGenerating}
                    onSelectScene={(sceneId) => setSelectedSceneId(sceneId)}
                    onReorderScenes={handleReorderScenes}
                  />

                  {/* Selected scene detail panel */}
                  {selectedSceneId && (
                    <div className="mt-6">
                      {(() => {
                        const scene = scenes.find(s => s.id === selectedSceneId);
                        if (!scene) return null;
                        return (
                          <SceneVideoCard
                            scene={scene}
                            clips={videoClips.clips.filter((c) => c.sceneId === scene.id)}
                            sourceImage={getApprovedImageForScene(scene.id)}
                            isGenerating={isGenerating || generatingScenes.has(scene.id)}
                            onApprove={handleApprove}
                            onDelete={handleDelete}
                            onRegenerate={handleRegenerateScene}
                            onUpdateVideoPrompt={handleUpdateVideoPrompt}
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {scenes.map((scene) => (
                    <SceneVideoCard
                      key={scene.id}
                      scene={scene}
                      clips={videoClips.clips.filter((c) => c.sceneId === scene.id)}
                      sourceImage={getApprovedImageForScene(scene.id)}
                      isGenerating={isGenerating || generatingScenes.has(scene.id)}
                      onApprove={handleApprove}
                      onDelete={handleDelete}
                      onRegenerate={handleRegenerateScene}
                      onUpdateVideoPrompt={handleUpdateVideoPrompt}
                    />
                  ))}
                </div>
              )}

              {/* Continue button */}
              <div className="mt-10 pt-6 border-t border-zinc-200">
                <Button
                  onClick={handleConfirm}
                  disabled={!canContinue}
                  loading={isConfirming}
                  size="lg"
                  icon={<CheckIcon className="w-4 h-4" />}
                >
                  Continue to Stitch
                </Button>
                {!canContinue && scenes.length > 0 && (
                  <p className="text-[13px] text-zinc-500 mt-3">
                    Approve at least one video for each scene to continue.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
