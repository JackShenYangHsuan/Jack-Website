'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PHASES, isPhaseComplete, getPhaseInfo } from '@/types/project';
import type { ProjectStatus } from '@/types/project';

interface PhaseStepperProps {
  projectId: string;
  currentPhase: ProjectStatus;
  /** The phase currently being viewed (for highlighting) */
  activePhase?: ProjectStatus;
  /** Allow navigation to completed phases */
  allowNavigation?: boolean;
}

/**
 * Phase URL mapping
 */
const PHASE_URLS: Record<ProjectStatus, string> = {
  discover: 'discover',
  style: 'style',
  storyboard: 'storyboard',
  images: 'images',
  videos: 'videos',
  stitch: 'stitch',
  audio: 'audio',
  export: 'export',
  complete: '',
};

/**
 * Vertical Phase Stepper - Clean Geist design with navigation
 */
export function PhaseStepper({ projectId, currentPhase, activePhase, allowNavigation = true }: PhaseStepperProps) {
  const displayPhases = PHASES.filter((p) => p.id !== 'complete');
  // Use activePhase for highlighting if provided, otherwise fall back to currentPhase
  const viewingPhase = activePhase || currentPhase;

  // Calculate progress
  const currentPhaseInfo = getPhaseInfo(currentPhase);
  const totalPhases = displayPhases.length;
  const completedPhases = currentPhaseInfo.order - 1;
  const progressPercent = Math.round((completedPhases / totalPhases) * 100);

  return (
    <div>
      {/* Progress header */}
      <div className="mb-4 pb-3 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            Progress
          </span>
          <span className="text-xs text-zinc-400">
            {completedPhases}/{totalPhases} phases
          </span>
        </div>
        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Phases list */}
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-[19px] top-[20px] bottom-[20px] w-0.5 bg-zinc-200" />

        <div className="space-y-1 relative">
          {displayPhases.map((phase, index) => {
            const isComplete = isPhaseComplete(currentPhase, phase.id);
            const isCurrent = phase.id === currentPhase;
            const isViewing = phase.id === viewingPhase;
            const isFuture = !isComplete && !isCurrent;
            const canNavigate = allowNavigation && (isComplete || isCurrent);
            const url = `/projects/${projectId}/${PHASE_URLS[phase.id]}`;
            const isLast = index === displayPhases.length - 1;

            const content = (
              <div
                className={cn(
                  'flex items-center gap-3 py-2 px-2 rounded-md transition-colors',
                  canNavigate && 'cursor-pointer hover:bg-zinc-100',
                  isViewing && 'bg-zinc-100'
                )}
              >
                {/* Circle with connector */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 z-10 bg-white',
                      isComplete && 'bg-green-500 text-white',
                      isCurrent && 'bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-2',
                      isFuture && 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                    )}
                  >
                    <span>{index + 1}</span>
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={cn(
                      'text-sm truncate',
                      isComplete && 'text-green-600 font-medium',
                      isCurrent && 'text-zinc-900 font-medium',
                      isFuture && 'text-zinc-400'
                    )}
                  >
                    {phase.name}
                  </span>
                  <span
                    className={cn(
                      'text-xs truncate',
                      (isComplete || isCurrent) ? 'text-zinc-500' : 'text-zinc-300'
                    )}
                  >
                    {phase.description}
                  </span>
                </div>
              </div>
            );

            if (canNavigate) {
              return (
                <Link key={phase.id} href={url}>
                  {content}
                </Link>
              );
            }

            return <div key={phase.id}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
