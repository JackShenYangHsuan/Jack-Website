'use client';

import { PHASES, type ProjectStatus, getPhaseInfo, isPhaseComplete } from '@/types/project';

/**
 * Check icon - Geist style
 */
function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Phase stepper props
 */
export interface PhaseStepperProps {
  /** Current phase status */
  currentPhase: ProjectStatus;
  /** Compact mode for sidebar */
  compact?: boolean;
  /** Click handler for phase */
  onPhaseClick?: (phase: ProjectStatus) => void;
}

/**
 * Phase stepper component - Geist design system
 * Displays the 7-phase pipeline progress
 */
export function PhaseStepper({ currentPhase, compact = false, onPhaseClick }: PhaseStepperProps) {
  // Filter out 'complete' as it's not a navigable phase
  const displayPhases = PHASES.filter((p) => p.id !== 'complete');

  return (
    <div style={{ width: '100%' }}>
      {displayPhases.map((phase, index) => {
        const isComplete = isPhaseComplete(currentPhase, phase.id);
        const isCurrent = phase.id === currentPhase;
        const isFuture = !isComplete && !isCurrent;
        const isClickable = (isComplete || isCurrent) && onPhaseClick;

        return (
          <div
            key={phase.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: compact ? '4px' : '8px',
            }}
          >
            {/* Phase indicator */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                width: compact ? '24px' : '32px',
                height: compact ? '24px' : '32px',
                fontSize: compact ? '12px' : '14px',
                fontWeight: 500,
                backgroundColor: isComplete ? '#22c55e' : isCurrent ? '#18181b' : '#f4f4f5',
                color: isComplete || isCurrent ? '#ffffff' : '#a1a1aa',
                transition: 'all 150ms',
              }}
            >
              {isComplete ? (
                <CheckIcon size={compact ? 12 : 14} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Phase info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <button
                onClick={isClickable ? () => onPhaseClick(phase.id) : undefined}
                disabled={isFuture}
                style={{
                  textAlign: 'left',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: isClickable ? 'pointer' : isFuture ? 'not-allowed' : 'default',
                  fontFamily: 'inherit',
                }}
              >
                <p
                  style={{
                    fontWeight: 500,
                    fontSize: compact ? '12px' : '14px',
                    color: isComplete ? '#22c55e' : isCurrent ? '#18181b' : '#a1a1aa',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {phase.name}
                </p>
                {!compact && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: isCurrent ? '#71717a' : '#a1a1aa',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {phase.description}
                  </p>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Horizontal phase stepper for compact displays - Geist design
 */
export function PhaseStepperHorizontal({ currentPhase }: { currentPhase: ProjectStatus }) {
  const displayPhases = PHASES.filter((p) => p.id !== 'complete');

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {displayPhases.map((phase, index) => {
        const isComplete = isPhaseComplete(currentPhase, phase.id);
        const isCurrent = phase.id === currentPhase;
        const isFuture = !isComplete && !isCurrent;

        return (
          <div
            key={phase.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              flex: index < displayPhases.length - 1 ? 1 : 'none',
            }}
          >
            {/* Phase dot */}
            <div
              style={{
                width: isCurrent ? '8px' : '6px',
                height: isCurrent ? '8px' : '6px',
                borderRadius: '50%',
                flexShrink: 0,
                backgroundColor: isComplete ? '#22c55e' : isCurrent ? '#18181b' : '#d4d4d8',
                transition: 'all 200ms',
              }}
              title={phase.name}
            />

            {/* Connector */}
            {index < displayPhases.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '1px',
                  marginLeft: '4px',
                  marginRight: '4px',
                  backgroundColor: isComplete ? 'rgba(34, 197, 94, 0.5)' : '#e4e4e7',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
