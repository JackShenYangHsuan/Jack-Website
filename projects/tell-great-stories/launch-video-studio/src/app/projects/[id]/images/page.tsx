'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, useToast } from '@/components/ui';
import { PhaseStepper } from '@/components/navigation';
import { ImagesTimelineView } from '@/components/images';
import { cn } from '@/lib/utils';
import { isKeyframesComplete } from '@/types/project';
import { SHOT_TYPE_LABELS } from '@/types/project';
import type {
  Project,
  KeyframesData,
  KeyframeImage,
  StoryboardScene,
  Storyboard,
  BrandingAssets,
  StyleGuide,
} from '@/types/project';

/**
 * Build the default prompt for a scene (mirrors API logic for display purposes)
 * Shows the full prompt that will be sent to ComfyUI
 */
function buildDefaultPrompt(
  scene: StoryboardScene,
  styleGuide: StyleGuide | null,
  branding: BrandingAssets | null
): string {
  const parts: string[] = [];

  // Add style prefix if available (full style insights, not truncated)
  if (styleGuide?.styleInsights) {
    parts.push(`[STYLE: ${styleGuide.styleInsights}]`);
  }

  // Main visual description
  parts.push(scene.visualDescription);

  // Logo injection for logo-appropriate scenes
  if (scene.logoAppropriate && branding?.logoDescription) {
    const placement = scene.logoPlacementNotes || 'visible in the scene';
    parts.push(`Include the company logo ${placement}: ${branding.logoDescription}`);
  }

  // Shot type context
  const shotLabel = SHOT_TYPE_LABELS[scene.shotType] || 'Medium Shot';
  parts.push(`Framing: ${shotLabel}`);

  // Quality boosters
  parts.push('High quality, cinematic, professional photography, sharp focus');

  return parts.join('. ');
}

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
 * Sparkles icon for AI generation
 */
function SparklesIcon({ className }: { className?: string }) {
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
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
 * Pencil/Edit icon
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
      width="16"
      height="16"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

/**
 * Chevron down icon
 */
function ChevronDownIcon({ className }: { className?: string }) {
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
      <polyline points="6 9 12 15 18 9" />
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
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

/**
 * Logo/Image icon
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
      width="16"
      height="16"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

/**
 * List/Grid icon
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
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
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

interface SceneImageCardProps {
  scene: StoryboardScene;
  images: KeyframeImage[];
  isGenerating: boolean;
  onApprove: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  onRegenerate: (sceneId: string) => void;
  onUpdatePrompt: (sceneId: string, prompt: string) => void;
  defaultPrompt: string;
}

/**
 * Card showing a scene and its generated images
 */
function SceneImageCard({
  scene,
  images,
  isGenerating,
  onApprove,
  onDelete,
  onRegenerate,
  onUpdatePrompt,
  defaultPrompt,
}: SceneImageCardProps) {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(scene.customImagePrompt || '');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  const approvedImage = images.find(img => img.isApproved);
  const otherImages = images.filter(img => !img.isApproved);

  // The effective prompt: custom if set, otherwise auto-generated
  const effectivePrompt = scene.customImagePrompt || defaultPrompt;
  const hasCustomPrompt = !!scene.customImagePrompt;

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    try {
      await onUpdatePrompt(scene.id, editedPrompt);
      setIsEditingPrompt(false);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedPrompt(scene.customImagePrompt || '');
    setIsEditingPrompt(false);
  };

  const handleResetToDefault = async () => {
    setIsSavingPrompt(true);
    try {
      await onUpdatePrompt(scene.id, '');
      setEditedPrompt('');
      setIsEditingPrompt(false);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
      {/* Scene header */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-900">Scene {scene.order}</span>
            <span className="text-xs px-2 py-0.5 bg-zinc-200 text-zinc-600 rounded">
              {scene.shotType}
            </span>
            {scene.logoAppropriate && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                <LogoIcon className="w-3 h-3" />
                Logo
              </span>
            )}
            {hasCustomPrompt && (
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                Custom Prompt
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {approvedImage && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                Approved
              </span>
            )}
            <button
              onClick={() => onRegenerate(scene.id)}
              disabled={isGenerating}
              className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshIcon className="w-3 h-3" />
              Regenerate
            </button>
          </div>
        </div>
        <p className="text-sm text-zinc-600 mt-1 line-clamp-2">{scene.visualDescription}</p>

        {/* Prompt section */}
        <div className="mt-3 border-t border-zinc-200 pt-3">
          <button
            onClick={() => setIsPromptExpanded(!isPromptExpanded)}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors w-full"
          >
            <ChevronDownIcon className={cn("w-3 h-3 transition-transform", isPromptExpanded && "rotate-180")} />
            <span>{isPromptExpanded ? 'Hide' : 'Show'} Generation Prompt</span>
          </button>

          {isPromptExpanded && (
            <div className="mt-2">
              {isEditingPrompt ? (
                <div className="space-y-2">
                  <textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    placeholder={defaultPrompt}
                    rows={8}
                    className="w-full text-xs p-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-y font-mono min-h-[120px]"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleResetToDefault}
                      disabled={isSavingPrompt}
                      className="text-xs text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
                    >
                      Reset to Default
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSavingPrompt}
                        className="text-xs px-2 py-1 text-zinc-600 hover:bg-zinc-100 rounded disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePrompt}
                        disabled={isSavingPrompt}
                        className="text-xs px-2 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1"
                      >
                        {isSavingPrompt ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckIcon className="w-3 h-3" />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="text-xs text-zinc-600 p-2 bg-zinc-100 rounded-md font-mono whitespace-pre-wrap">
                    {effectivePrompt}
                  </div>
                  <button
                    onClick={() => {
                      setEditedPrompt(scene.customImagePrompt || defaultPrompt);
                      setIsEditingPrompt(true);
                    }}
                    className="absolute top-1 right-1 p-1 bg-white rounded shadow-sm hover:bg-zinc-50 transition-colors"
                    title="Edit prompt"
                  >
                    <PencilIcon className="w-3 h-3 text-zinc-500" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Images grid */}
      <div className="p-4">
        {images.length === 0 ? (
          <div className="aspect-video bg-zinc-100 rounded-lg flex items-center justify-center">
            {isGenerating ? (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin mx-auto mb-2" />
                <span className="text-sm text-zinc-500">Generating...</span>
              </div>
            ) : (
              <span className="text-sm text-zinc-400">No images generated yet</span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Show approved image first and larger */}
            {approvedImage && (
              <div className="col-span-2 relative group">
                <div className="aspect-video relative rounded-lg overflow-hidden border-2 border-green-500">
                  <Image
                    src={approvedImage.imageUrl}
                    alt={`Scene ${scene.order} - Approved`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                    Approved
                  </div>
                </div>
                <button
                  onClick={() => onDelete(approvedImage.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}

            {/* Other images */}
            {otherImages.map((img) => (
              <div key={img.id} className="relative group">
                <div className="aspect-video relative rounded-lg overflow-hidden border border-zinc-200 hover:border-zinc-300 transition-colors">
                  <Image
                    src={img.imageUrl}
                    alt={`Scene ${scene.order} - Variant`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                  <button
                    onClick={() => onApprove(img.id)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-green-50"
                    title="Approve this image"
                  >
                    <CheckIcon className="w-4 h-4 text-green-600" />
                  </button>
                  <button
                    onClick={() => onDelete(img.id)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50"
                    title="Delete this image"
                  >
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ImagesPageProps {
  params: Promise<{ id: string }>;
}

export default function ImagesPage({ params }: ImagesPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [keyframes, setKeyframes] = useState<KeyframesData>({ images: [] });
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [branding, setBranding] = useState<BrandingAssets | null>(null);
  const [styleGuide, setStyleGuide] = useState<StyleGuide | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingScenes, setGeneratingScenes] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // Load project and keyframes
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
        setKeyframes(data.project.keyframes || { images: [] });
        setBranding(data.project.branding || null);
        setStyleGuide(data.project.styleGuide || null);
      } catch (error) {
        console.error('Error loading project:', error);
        addToast({ type: 'error', message: 'Failed to load project' });
      } finally {
        setPageLoading(false);
      }
    }
    loadData();
  }, [projectId, router, addToast]);

  // Generate all images
  async function handleGenerateAll() {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/images/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate images');
      }

      const data = await response.json();
      setKeyframes(data.keyframes);
      addToast({
        type: 'success',
        message: `Generated ${data.imagesGenerated} keyframe images!`,
      });
    } catch (error) {
      console.error('Error generating images:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate images',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // Regenerate for a specific scene
  async function handleRegenerateScene(sceneId: string) {
    setGeneratingScenes(prev => new Set(prev).add(sceneId));
    try {
      const response = await fetch(`/api/projects/${projectId}/images/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneIds: [sceneId], regenerate: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate');
      }

      const data = await response.json();
      setKeyframes(data.keyframes);
      addToast({ type: 'success', message: 'Image regenerated!' });
    } catch (error) {
      console.error('Error regenerating:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to regenerate',
      });
    } finally {
      setGeneratingScenes(prev => {
        const next = new Set(prev);
        next.delete(sceneId);
        return next;
      });
    }
  }

  // Approve an image
  async function handleApprove(imageId: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, action: 'approve' }),
      });

      if (!response.ok) throw new Error('Failed to approve');

      const data = await response.json();
      setKeyframes(data.keyframes);
      addToast({ type: 'success', message: 'Image approved!' });
    } catch (error) {
      console.error('Error approving:', error);
      addToast({ type: 'error', message: 'Failed to approve image' });
    }
  }

  // Delete an image
  async function handleDelete(imageId: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, action: 'delete' }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      const data = await response.json();
      setKeyframes(data.keyframes);
      addToast({ type: 'success', message: 'Image deleted' });
    } catch (error) {
      console.error('Error deleting:', error);
      addToast({ type: 'error', message: 'Failed to delete image' });
    }
  }

  // Update scene custom prompt
  async function handleUpdateScenePrompt(sceneId: string, customPrompt: string) {
    try {
      const response = await fetch(`/api/projects/${projectId}/storyboard/scene`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId, updates: { customImagePrompt: customPrompt || null } }),
      });

      if (!response.ok) throw new Error('Failed to update prompt');

      // Update local storyboard state
      setStoryboard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map(s =>
            s.id === sceneId
              ? { ...s, customImagePrompt: customPrompt || undefined }
              : s
          ),
        };
      });

      addToast({ type: 'success', message: customPrompt ? 'Custom prompt saved' : 'Prompt reset to default' });
    } catch (error) {
      console.error('Error updating prompt:', error);
      addToast({ type: 'error', message: 'Failed to update prompt' });
      throw error; // Re-throw to let the component know it failed
    }
  }

  // Continue to next phase
  async function handleConfirm() {
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'videos' }),
      });
      if (!response.ok) throw new Error('Failed to update project status');
      addToast({ type: 'success', message: 'Images phase complete!' });
      router.push(`/projects/${projectId}/videos`);
    } catch (error) {
      console.error('Error confirming:', error);
      addToast({ type: 'error', message: 'Failed to continue to next phase' });
    } finally {
      setIsConfirming(false);
    }
  }

  // Upload logo
  async function handleLogoUpload(file: File) {
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch(`/api/projects/${projectId}/branding`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload logo');
      }

      const data = await response.json();
      setBranding(data.branding);
      addToast({ type: 'success', message: 'Logo uploaded and analyzed!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload logo',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  }

  // Delete logo
  async function handleDeleteLogo() {
    try {
      const response = await fetch(`/api/projects/${projectId}/branding`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete logo');

      setBranding(null);
      addToast({ type: 'success', message: 'Logo removed' });
    } catch (error) {
      console.error('Error deleting logo:', error);
      addToast({ type: 'error', message: 'Failed to delete logo' });
    }
  }

  // Reorder scenes (for drag and drop in timeline)
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
      console.error('Error reordering scenes:', error);
      // Revert on error
      setStoryboard(prev => prev ? { ...prev, scenes: storyboard.scenes } : prev);
      addToast({ type: 'error', message: 'Failed to reorder scenes' });
    }
  }

  const canContinue = isKeyframesComplete(keyframes, storyboard);
  const scenes = storyboard?.scenes || [];
  const approvedCount = scenes.filter(scene =>
    keyframes.images.some(img => img.sceneId === scene.id && img.isApproved)
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
          <Link href={`/projects/${projectId}/storyboard`} className="text-zinc-900 underline">
            Go to Storyboard
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
            <p className="text-[13px] text-zinc-500">Phase 4: Images</p>
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
          <PhaseStepper projectId={projectId} currentPhase={project.status} activePhase="images" />
        </aside>

        {/* Center content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto px-12 py-8">
            <div className="max-w-[1200px] mx-auto">
              {/* Logo Upload Section */}
              <div className="mb-8 p-4 border border-zinc-200 rounded-lg bg-white">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-zinc-900 mb-1 flex items-center gap-2">
                      <LogoIcon className="w-4 h-4" />
                      Company Logo
                    </h3>
                    <p className="text-xs text-zinc-500 mb-3">
                      Upload your logo to automatically include it in logo-appropriate scenes.
                      AI will analyze your logo and incorporate it into generated images.
                    </p>

                    {branding?.logoUrl ? (
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded border border-zinc-200 overflow-hidden bg-zinc-50 flex items-center justify-center">
                          <Image
                            src={branding.logoUrl}
                            alt="Company logo"
                            width={64}
                            height={64}
                            className="object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-600 truncate mb-1">
                            {branding.originalFilename || 'logo'}
                          </p>
                          <p className="text-xs text-zinc-500 line-clamp-2">
                            {branding.logoDescription || 'Analyzing...'}
                          </p>
                        </div>
                        <button
                          onClick={handleDeleteLogo}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Remove logo"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                          disabled={isUploadingLogo}
                        />
                        <div className={cn(
                          "border-2 border-dashed border-zinc-200 rounded-lg p-4 text-center cursor-pointer transition-colors",
                          "hover:border-zinc-300 hover:bg-zinc-50",
                          isUploadingLogo && "opacity-50 cursor-not-allowed"
                        )}>
                          {isUploadingLogo ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                              <span className="text-xs text-zinc-500">Uploading and analyzing...</span>
                            </div>
                          ) : (
                            <>
                              <UploadIcon className="w-5 h-5 text-zinc-400 mx-auto mb-1" />
                              <span className="text-xs text-zinc-500">Click to upload logo (PNG, JPG, SVG, WebP)</span>
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Logo scene count */}
                  {scenes.some(s => s.logoAppropriate) && (
                    <div className="text-right">
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {scenes.filter(s => s.logoAppropriate).length} logo scenes
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Keyframe Images</h2>
                  <p className="text-sm text-zinc-500">
                    Generate production-quality images for each scene. Approve the best one for each scene to continue.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* View toggle */}
                  <div className="flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-50">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
                        viewMode === 'cards'
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-700'
                      )}
                    >
                      <ListIcon className="w-4 h-4" />
                      Cards
                    </button>
                    <button
                      onClick={() => setViewMode('timeline')}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
                        viewMode === 'timeline'
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-700'
                      )}
                    >
                      <TimelineIcon className="w-4 h-4" />
                      Timeline
                    </button>
                  </div>
                  <Button
                    onClick={handleGenerateAll}
                    loading={isGenerating}
                    icon={<SparklesIcon />}
                  >
                    Generate All
                  </Button>
                </div>
              </div>

              {/* View modes */}
              {viewMode === 'timeline' ? (
                <ImagesTimelineView
                  scenes={scenes}
                  images={keyframes.images}
                  selectedSceneId={selectedSceneId}
                  generatingScenes={generatingScenes}
                  isGeneratingAll={isGenerating}
                  onSelectScene={setSelectedSceneId}
                  onReorderScenes={handleReorderScenes}
                  className="mb-8"
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {scenes.map((scene) => (
                    <SceneImageCard
                      key={scene.id}
                      scene={scene}
                      images={keyframes.images.filter(img => img.sceneId === scene.id)}
                      isGenerating={isGenerating || generatingScenes.has(scene.id)}
                      onApprove={handleApprove}
                      onDelete={handleDelete}
                      onRegenerate={handleRegenerateScene}
                      onUpdatePrompt={handleUpdateScenePrompt}
                      defaultPrompt={buildDefaultPrompt(scene, styleGuide, branding)}
                    />
                  ))}
                </div>
              )}

              {/* Selected scene detail panel for timeline view */}
              {viewMode === 'timeline' && selectedSceneId && (
                <div className="mt-6">
                  {(() => {
                    const scene = scenes.find(s => s.id === selectedSceneId);
                    if (!scene) return null;
                    return (
                      <SceneImageCard
                        scene={scene}
                        images={keyframes.images.filter(img => img.sceneId === scene.id)}
                        isGenerating={isGenerating || generatingScenes.has(scene.id)}
                        onApprove={handleApprove}
                        onDelete={handleDelete}
                        onRegenerate={handleRegenerateScene}
                        onUpdatePrompt={handleUpdateScenePrompt}
                        defaultPrompt={buildDefaultPrompt(scene, styleGuide, branding)}
                      />
                    );
                  })()}
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
                  Continue to Video Animation
                </Button>
                {!canContinue && scenes.length > 0 && (
                  <p className="text-[13px] text-zinc-500 mt-3">
                    Approve at least one image for each scene to continue.
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
