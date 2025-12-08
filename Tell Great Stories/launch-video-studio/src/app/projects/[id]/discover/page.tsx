'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, useToast } from '@/components/ui';
import { StoryBriefField } from '@/components/discovery/StoryBriefField';
import { StoryBriefListField } from '@/components/discovery/StoryBriefListField';
import { PhaseStepper } from '@/components/navigation';
import type { Project, StoryBrief } from '@/types/project';

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

interface DiscoveryPageProps {
  params: Promise<{ id: string }>;
}

export default function DiscoveryPage({ params }: DiscoveryPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

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
      } catch (error) {
        console.error('Error loading project:', error);
        addToast({ type: 'error', message: 'Failed to load project' });
      } finally {
        setPageLoading(false);
      }
    }
    loadProject();
  }, [projectId, router, addToast]);

  function handleUpdateBrief(updates: Partial<StoryBrief>) {
    if (!project?.storyBrief) return;
    const updatedBrief = { ...project.storyBrief, ...updates };
    setProject((prev) => (prev ? { ...prev, storyBrief: updatedBrief } : prev));
    fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storyBrief: updatedBrief }),
    });
  }

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'style' }),
      });
      if (!response.ok) throw new Error('Failed to update project status');
      addToast({ type: 'success', message: 'Discovery phase complete!' });
      router.push(`/projects/${projectId}/style`);
    } catch (error) {
      console.error('Error confirming:', error);
      addToast({ type: 'error', message: 'Failed to continue to next phase' });
    } finally {
      setIsConfirming(false);
    }
  }

  const hasAllFields =
    project?.storyBrief &&
    project.storyBrief.pain?.trim() &&
    project.storyBrief.solution?.trim() &&
    project.storyBrief.transformation?.trim() &&
    project.storyBrief.emotionalStakes?.trim() &&
    project.storyBrief.uniqueAngle?.trim();

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
            <p className="text-[13px] text-zinc-500">Phase 1: Discovery</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-[200px] shrink-0 bg-zinc-50 border-r border-zinc-200 p-6 overflow-y-auto">
          <PhaseStepper projectId={projectId} currentPhase={project.status} activePhase="discover" />
        </aside>

        {/* Center form */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto px-12 py-8">
            <div className="max-w-[640px] mx-auto">
              <h2 className="text-2xl font-semibold text-zinc-900 mb-2">Story Brief</h2>
              <p className="text-sm text-zinc-500 mb-8">
                Define the core elements of your video story. Fill in each field to capture the
                emotional essence of your narrative.
              </p>

              {/* Company info */}
              <div className="p-5 bg-zinc-50 rounded-xl mb-10 border border-zinc-200">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Company
                    </label>
                    <p className="text-[15px] text-zinc-900 mt-1 font-medium">
                      {project.storyBrief?.companyName || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                      Tagline
                    </label>
                    <p className="text-[15px] text-zinc-900 mt-1">
                      {project.storyBrief?.tagline || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="flex flex-col gap-10">
                <StoryBriefField
                  label="Pain"
                  value={project.storyBrief?.pain || ''}
                  onChange={(value) => handleUpdateBrief({ pain: value })}
                  placeholder="The raw, visceral problem being solved..."
                />
                <StoryBriefField
                  label="Solution"
                  value={project.storyBrief?.solution || ''}
                  onChange={(value) => handleUpdateBrief({ solution: value })}
                  placeholder="What changes for the user..."
                />
                <StoryBriefField
                  label="Transformation"
                  value={project.storyBrief?.transformation || ''}
                  onChange={(value) => handleUpdateBrief({ transformation: value })}
                  placeholder="Before state → After state..."
                />
                <StoryBriefField
                  label="Emotional Stakes"
                  value={project.storyBrief?.emotionalStakes || ''}
                  onChange={(value) => handleUpdateBrief({ emotionalStakes: value })}
                  placeholder="Who suffers, who triumphs, why it matters..."
                />
                <StoryBriefField
                  label="Unique Angle"
                  value={project.storyBrief?.uniqueAngle || ''}
                  onChange={(value) => handleUpdateBrief({ uniqueAngle: value })}
                  placeholder="What makes this story worth telling..."
                />

                <div className="border-t border-zinc-200 my-2" />

                <StoryBriefListField
                  label="Emotional Behaviors"
                  values={project.storyBrief?.emotionalBehaviors || []}
                  onChange={(values) => handleUpdateBrief({ emotionalBehaviors: values })}
                  placeholder="No behaviors yet..."
                  helperText="Actions that show emotion, not tell"
                />
                <StoryBriefListField
                  label="Tone Notes"
                  values={project.storyBrief?.toneNotes || []}
                  onChange={(values) => handleUpdateBrief({ toneNotes: values })}
                  placeholder="No tone notes yet..."
                  helperText="Guiding mood phrases for the video"
                />
              </div>

              {/* Continue button */}
              <div className="mt-10 pt-6 border-t border-zinc-200">
                <Button
                  onClick={handleConfirm}
                  disabled={!hasAllFields}
                  loading={isConfirming}
                  size="lg"
                  icon={<CheckIcon className="w-4 h-4" />}
                >
                  Continue to Style
                </Button>
                {!hasAllFields && (
                  <p className="text-[13px] text-zinc-500 mt-3">
                    Fill in all required fields (Pain, Solution, Transformation, Emotional Stakes,
                    Unique Angle) to continue.
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
