'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, useToast, Select } from '@/components/ui';
import { SceneCard, SceneEditor, DurationBar } from '@/components/storyboard';
import { PhaseStepper } from '@/components/navigation';
import {
  DEFAULT_STORYBOARD,
  isStoryboardComplete,
} from '@/types/project';
import type {
  Project,
  Storyboard,
  StoryboardScene,
} from '@/types/project';
import { AVAILABLE_MODELS } from '@/types/settings';

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
 * Trash icon for clear all
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
 * Image icon for sketch generation
 */
function ImageIcon({ className }: { className?: string }) {
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
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

/**
 * Check icon for button
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

interface StoryboardPageProps {
  params: Promise<{ id: string }>;
}

export default function StoryboardPage({ params }: StoryboardPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [storyboard, setStoryboard] = useState<Storyboard>(DEFAULT_STORYBOARD);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSketches, setIsGeneratingSketches] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-sonnet-4');
  const [editingScene, setEditingScene] = useState<StoryboardScene | null>(null);

  // Load project and storyboard
  useEffect(() => {
    async function loadProject() {
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
        if (data.project.storyboard) {
          setStoryboard(data.project.storyboard);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        addToast({ type: 'error', message: 'Failed to load project' });
      } finally {
        setPageLoading(false);
      }
    }
    loadProject();
  }, [projectId, router, addToast]);

  // Generate storyboard with AI
  async function handleGenerate() {
    if (!project?.storyBrief || !project?.styleGuide) {
      addToast({ type: 'error', message: 'Complete Discovery and Style phases first' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/storyboard/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          targetDuration: storyboard.targetDuration,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate storyboard');
      }

      const data = await response.json();
      setStoryboard(data.storyboard);
      addToast({ type: 'success', message: 'Storyboard generated!' });
    } catch (error) {
      console.error('Error generating storyboard:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate storyboard',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  // Save storyboard changes
  async function saveStoryboard(updates: Partial<Storyboard>) {
    const newStoryboard = { ...storyboard, ...updates };
    setStoryboard(newStoryboard);

    try {
      await fetch(`/api/projects/${projectId}/storyboard`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Error saving storyboard:', error);
    }
  }

  // Update a specific scene
  async function handleUpdateScene(sceneId: string, updates: Partial<StoryboardScene>) {
    const updatedScenes = storyboard.scenes.map((s) =>
      s.id === sceneId ? { ...s, ...updates } : s
    );
    await saveStoryboard({ scenes: updatedScenes });
  }

  // Delete a scene
  async function handleDeleteScene(sceneId: string) {
    const updatedScenes = storyboard.scenes
      .filter((s) => s.id !== sceneId)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    await saveStoryboard({ scenes: updatedScenes });
    addToast({ type: 'success', message: 'Scene deleted' });
  }

  // Add a new scene
  async function handleAddScene() {
    const newScene: StoryboardScene = {
      id: crypto.randomUUID(),
      order: storyboard.scenes.length + 1,
      visualDescription: '',
      shotType: 'medium',
      cameraMovement: 'static',
      duration: 5,
      voiceover: '',
      transition: 'cut',
    };
    await saveStoryboard({ scenes: [...storyboard.scenes, newScene] });
    setEditingScene(newScene);
  }

  // Clear all scenes
  async function handleClearAll() {
    if (!confirm('Are you sure you want to clear all scenes? This cannot be undone.')) {
      return;
    }
    await saveStoryboard({ scenes: [] });
    addToast({ type: 'success', message: 'All scenes cleared' });
  }

  // Generate sketches for scenes that don't have them
  async function handleGenerateSketches() {
    setIsGeneratingSketches(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/storyboard/sketches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateAll: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate sketches');
      }

      const data = await response.json();
      if (data.storyboard) {
        setStoryboard(data.storyboard);
      }
      addToast({
        type: 'success',
        message: data.sketchesGenerated > 0
          ? `Generated ${data.sketchesGenerated} sketches!`
          : 'All scenes already have sketches'
      });
    } catch (error) {
      console.error('Error generating sketches:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate sketches',
      });
    } finally {
      setIsGeneratingSketches(false);
    }
  }

  // Reorder scenes (for drag and drop)
  async function handleReorderScenes(fromIndex: number, toIndex: number) {
    const scenes = [...storyboard.scenes];
    const [moved] = scenes.splice(fromIndex, 1);
    scenes.splice(toIndex, 0, moved);
    const reorderedScenes = scenes.map((s, idx) => ({ ...s, order: idx + 1 }));
    await saveStoryboard({ scenes: reorderedScenes });
  }

  // Handle confirmation and move to next phase
  async function handleConfirm() {
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'images' }),
      });
      if (!response.ok) throw new Error('Failed to update project status');
      addToast({ type: 'success', message: 'Storyboard phase complete!' });
      router.push(`/projects/${projectId}/images`);
    } catch (error) {
      console.error('Error confirming:', error);
      addToast({ type: 'error', message: 'Failed to continue to next phase' });
    } finally {
      setIsConfirming(false);
    }
  }

  const canContinue = isStoryboardComplete(storyboard);
  const totalDuration = storyboard.scenes.reduce((sum, s) => sum + s.duration, 0);

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
            <p className="text-[13px] text-zinc-500">Phase 3: Storyboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            {totalDuration}s / {storyboard.targetDuration}s
          </span>
          <DurationBar
            current={totalDuration}
            target={storyboard.targetDuration}
            className="w-32"
          />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[200px] shrink-0 bg-zinc-50 border-r border-zinc-200 p-6 overflow-y-auto">
          <PhaseStepper projectId={projectId} currentPhase={project.status} activePhase="storyboard" />
        </aside>

        {/* Center content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto px-12 py-8">
            <div className="max-w-[1200px] mx-auto">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Storyboard</h2>
                  <p className="text-sm text-zinc-500">
                    Plan your scenes, timing, and camera work. Generate with AI or build manually.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={storyboard.targetDuration.toString()}
                    onChange={(e) =>
                      saveStoryboard({ targetDuration: parseInt(e.target.value) as 30 | 60 | 90 })
                    }
                    options={[
                      { value: '30', label: '30 seconds' },
                      { value: '60', label: '60 seconds' },
                      { value: '90', label: '90 seconds' },
                    ]}
                    className="w-32"
                  />
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    options={AVAILABLE_MODELS.map((m) => ({
                      value: m.id,
                      label: m.name,
                    }))}
                    className="w-48"
                  />
                  <Button
                    onClick={handleGenerate}
                    loading={isGenerating}
                    disabled={!project.storyBrief || !project.styleGuide}
                    icon={<SparklesIcon />}
                  >
                    Generate
                  </Button>
                  {storyboard.scenes.length > 0 && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={handleGenerateSketches}
                        loading={isGeneratingSketches}
                        icon={<ImageIcon />}
                      >
                        Generate Sketches
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleClearAll}
                        icon={<TrashIcon />}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear All
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Scene Timeline */}
              {storyboard.scenes.length === 0 ? (
                <div className="border-2 border-dashed border-zinc-200 rounded-lg p-12 text-center">
                  <SparklesIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-900 mb-2">No scenes yet</h3>
                  <p className="text-sm text-zinc-500 mb-6">
                    Generate a storyboard with AI or add scenes manually
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={handleGenerate}
                      loading={isGenerating}
                      disabled={!project.storyBrief || !project.styleGuide}
                      icon={<SparklesIcon />}
                    >
                      Generate with AI
                    </Button>
                    <Button variant="secondary" onClick={handleAddScene} icon={<PlusIcon />}>
                      Add Scene
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {storyboard.scenes.map((scene, index) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      index={index}
                      totalScenes={storyboard.scenes.length}
                      onEdit={() => setEditingScene(scene)}
                      onDelete={() => handleDeleteScene(scene.id)}
                      onMoveUp={() => index > 0 && handleReorderScenes(index, index - 1)}
                      onMoveDown={() =>
                        index < storyboard.scenes.length - 1 &&
                        handleReorderScenes(index, index + 1)
                      }
                    />
                  ))}

                  {/* Add scene button */}
                  <button
                    onClick={handleAddScene}
                    className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Scene
                  </button>
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
                  Continue to Image Generation
                </Button>
                {!canContinue && storyboard.scenes.length > 0 && (
                  <p className="text-[13px] text-zinc-500 mt-3">
                    Total duration should be within 80-120% of target ({storyboard.targetDuration}s).
                    Currently: {totalDuration}s
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scene Editor Modal */}
      {editingScene && (
        <SceneEditor
          scene={editingScene}
          onSave={(updates) => {
            handleUpdateScene(editingScene.id, updates);
            setEditingScene(null);
          }}
          onClose={() => setEditingScene(null)}
        />
      )}
    </div>
  );
}
