'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PHASES, isPhaseComplete } from '@/types/project';
import type { ProjectStatus } from '@/types/project';

/**
 * Check icon for completed phases
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
  complete: '',
};

/**
 * Vertical Phase Stepper - Clean Geist design with navigation
 */
export function PhaseStepper({ projectId, currentPhase, activePhase, allowNavigation = true }: PhaseStepperProps) {
  const displayPhases = PHASES.filter((p) => p.id !== 'complete');
  // Use activePhase for highlighting if provided, otherwise fall back to currentPhase
  const viewingPhase = activePhase || currentPhase;

  return (
    <div className="space-y-1">
      {displayPhases.map((phase, index) => {
        const isComplete = isPhaseComplete(currentPhase, phase.id);
        const isCurrent = phase.id === currentPhase;
        const isViewing = phase.id === viewingPhase;
        const isFuture = !isComplete && !isCurrent;
        const canNavigate = allowNavigation && (isComplete || isCurrent);
        const url = `/projects/${projectId}/${PHASE_URLS[phase.id]}`;

        const content = (
          <div
            className={cn(
              'flex items-center gap-3 py-2 px-2 rounded-md transition-colors',
              canNavigate && 'cursor-pointer hover:bg-zinc-100',
              isViewing && 'bg-zinc-100'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0',
                isComplete && 'bg-zinc-900 text-white',
                isCurrent && 'bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-2',
                isFuture && 'bg-zinc-100 text-zinc-400 border border-zinc-200'
              )}
            >
              {isComplete ? <CheckIcon className="w-3 h-3" /> : <span>{index + 1}</span>}
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  'text-sm',
                  (isComplete || isCurrent) && 'text-zinc-900 font-medium',
                  isFuture && 'text-zinc-400'
                )}
              >
                {phase.name}
              </span>
              <span
                className={cn(
                  'text-xs',
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
  );
}
