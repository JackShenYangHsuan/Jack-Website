'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, useToast, Textarea } from '@/components/ui';
import { VideoAnalyzer } from '@/components/style';
import { PhaseStepper } from '@/components/navigation';
import { DEFAULT_STYLE_GUIDE } from '@/types/project';
import type {
  Project,
  StyleGuide,
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

/**
 * Pencil icon for edit button
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
 * Eye icon for view button
 */
function EyeIcon({ className }: { className?: string }) {
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
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

interface StylePageProps {
  params: Promise<{ id: string }>;
}

export default function StylePage({ params }: StylePageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [styleGuide, setStyleGuide] = useState<StyleGuide>(DEFAULT_STYLE_GUIDE);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Load project and style guide
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
        // Merge with defaults
        const loadedStyleGuide = data.project.styleGuide || DEFAULT_STYLE_GUIDE;
        setStyleGuide({
          ...DEFAULT_STYLE_GUIDE,
          ...loadedStyleGuide,
        });
      } catch (error) {
        console.error('Error loading project:', error);
        addToast({ type: 'error', message: 'Failed to load project' });
      } finally {
        setPageLoading(false);
      }
    }
    loadProject();
  }, [projectId, router, addToast]);

  // Save style guide changes
  async function saveStyleGuide(updates: Partial<StyleGuide>) {
    const newStyleGuide = { ...styleGuide, ...updates };
    setStyleGuide(newStyleGuide);

    try {
      await fetch(`/api/projects/${projectId}/style`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Error saving style guide:', error);
    }
  }

  // Handle video analysis
  async function handleAnalyzeVideo(url: string, model: string) {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/style/analyze-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, model }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze video');
      }

      const data = await response.json();
      setStyleGuide((prev) => ({
        ...prev,
        referenceVideos: [...prev.referenceVideos, data.video],
        styleInsights: data.styleInsights || prev.styleInsights,
      }));
      addToast({ type: 'success', message: 'Video analyzed successfully' });
    } catch (error) {
      console.error('Error analyzing video:', error);
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to analyze video',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Handle video deletion
  async function handleDeleteVideo(videoId: string) {
    setIsDeleting(videoId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/style/analyze-video?videoId=${videoId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      setStyleGuide((prev) => ({
        ...prev,
        referenceVideos: prev.referenceVideos.filter((v) => v.id !== videoId),
      }));
      addToast({ type: 'success', message: 'Video removed' });
    } catch (error) {
      console.error('Error deleting video:', error);
      addToast({ type: 'error', message: 'Failed to delete video' });
    } finally {
      setIsDeleting(null);
    }
  }

  // Handle confirmation and move to next phase
  async function handleConfirm() {
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'storyboard' }),
      });
      if (!response.ok) throw new Error('Failed to update project status');
      addToast({ type: 'success', message: 'Style phase complete!' });
      router.push(`/projects/${projectId}/storyboard`);
    } catch (error) {
      console.error('Error confirming:', error);
      addToast({ type: 'error', message: 'Failed to continue to next phase' });
    } finally {
      setIsConfirming(false);
    }
  }

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
            <p className="text-[13px] text-zinc-500">Phase 2: Style</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[220px] shrink-0 bg-zinc-50 border-r border-zinc-200 p-4 overflow-y-auto">
          <PhaseStepper projectId={projectId} currentPhase={project.status} activePhase="style" />
        </aside>

        {/* Center content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto px-12 py-8">
            <div className="w-full">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Visual Style Guide</h2>
              <p className="text-sm text-zinc-500 mb-8">
                Analyze reference videos to extract style insights, then define your visual direction.
              </p>

              {/* Section 1: Video Analysis */}
              <section className="mb-8">
                <h3 className="text-lg font-semibold text-zinc-900 mb-1">Reference Videos</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Paste YouTube links to analyze what makes them effective
                </p>
                <VideoAnalyzer
                  videos={styleGuide.referenceVideos}
                  onAnalyze={handleAnalyzeVideo}
                  onDelete={handleDeleteVideo}
                  isAnalyzing={isAnalyzing}
                  isDeleting={isDeleting}
                />
              </section>

              {/* Section 2: Style Insights */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 mb-1">Style Insights</h3>
                    <p className="text-sm text-zinc-500">
                      Visual style notes extracted from reference videos.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                  >
                    {isEditing ? (
                      <>
                        <EyeIcon className="w-4 h-4" />
                        Preview
                      </>
                    ) : (
                      <>
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </>
                    )}
                  </button>
                </div>

                {isEditing ? (
                  <Textarea
                    value={styleGuide.styleInsights}
                    onChange={(e) => saveStyleGuide({ styleInsights: e.target.value })}
                    placeholder={`Add visual style bullet points here (one per line):

• Heavy 16mm film grain, warm tones
• High contrast, crushed blacks
• Handheld camera, intimate framing
• Muted earth tones with orange accents
• Golden hour lighting, soft shadows
• Documentary-style, raw aesthetic`}
                    rows={12}
                    className="font-mono text-sm"
                  />
                ) : styleGuide.styleInsights ? (
                  <div className="p-6 bg-zinc-50 rounded-lg border border-zinc-200 min-h-[200px]">
                    <ul className="space-y-2">
                      {styleGuide.styleInsights
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0)
                        // Only include lines that start with bullet characters (-, •, *)
                        .filter(line => /^[-•*]/.test(line))
                        .map((line, i) => (
                          <li key={i} className="text-sm text-zinc-700 flex items-start gap-2">
                            <span className="text-zinc-400 mt-0.5">•</span>
                            <span>{line.replace(/^[-•*]\s*/, '')}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <div
                    className="p-6 bg-zinc-50 rounded-lg border border-zinc-200 border-dashed min-h-[200px] flex items-center justify-center cursor-pointer hover:bg-zinc-100 transition-colors"
                    onClick={() => setIsEditing(true)}
                  >
                    <p className="text-zinc-400 text-sm">
                      No style insights yet. Click Edit to add some, or analyze a reference video above.
                    </p>
                  </div>
                )}
              </section>

              {/* Continue button */}
              <div className="mt-10 pt-6 border-t border-zinc-200">
                <Button
                  onClick={handleConfirm}
                  loading={isConfirming}
                  size="lg"
                  icon={<CheckIcon className="w-4 h-4" />}
                >
                  Continue to Storyboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
