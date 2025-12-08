'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { StoryBriefField } from './StoryBriefField';
import { StoryBriefListField } from './StoryBriefListField';
import type { StoryBrief } from '@/types/project';

/**
 * Check icon - Geist style
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
      width="16"
      height="16"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Story brief panel props
 */
export interface StoryBriefPanelProps {
  /** Story brief data */
  storyBrief: StoryBrief | null;
  /** Callback when story brief is updated */
  onUpdate: (updates: Partial<StoryBrief>) => void;
  /** Whether the brief is complete and ready to confirm */
  isComplete: boolean;
  /** Callback when user confirms the brief */
  onConfirm: () => void;
  /** Whether we're in the process of confirming */
  isConfirming?: boolean;
}

/**
 * Story brief panel component - Geist design system
 * Right sidebar showing the extracted story brief
 */
export function StoryBriefPanel({
  storyBrief,
  onUpdate,
  isComplete,
  onConfirm,
  isConfirming = false,
}: StoryBriefPanelProps) {
  // Check if each required field has content
  const hasAllFields = storyBrief &&
    storyBrief.pain.trim() &&
    storyBrief.solution.trim() &&
    storyBrief.transformation.trim() &&
    storyBrief.emotionalStakes.trim() &&
    storyBrief.uniqueAngle.trim();

  return (
    <aside
      style={{
        width: '320px',
        flexShrink: 0,
        height: '100%',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e4e4e7',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e4e4e7',
          padding: '20px 24px',
          zIndex: 10,
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#18181b', margin: 0 }}>
          Story Brief
        </h2>
        <p style={{ fontSize: '13px', color: '#71717a', margin: '4px 0 0 0' }}>
          {storyBrief?.companyName || 'Your company'}
        </p>
      </div>

      {/* Brief content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Company info (read-only) */}
          <div style={{ paddingBottom: '20px', borderBottom: '1px solid #e4e4e7' }}>
            <StoryBriefField
              label="Company"
              value={storyBrief?.companyName || ''}
              onChange={(value) => onUpdate({ companyName: value })}
              editable={false}
            />
            <div style={{ marginTop: '16px' }}>
              <StoryBriefField
                label="Tagline"
                value={storyBrief?.tagline || ''}
                onChange={(value) => onUpdate({ tagline: value })}
                editable={false}
                multiline={false}
              />
            </div>
          </div>

          {/* Core story elements */}
          <StoryBriefField
            label="Pain"
            value={storyBrief?.pain || ''}
            onChange={(value) => onUpdate({ pain: value })}
            placeholder="The raw, visceral problem being solved..."
          />

          <StoryBriefField
            label="Solution"
            value={storyBrief?.solution || ''}
            onChange={(value) => onUpdate({ solution: value })}
            placeholder="What changes for the user..."
          />

          <StoryBriefField
            label="Transformation"
            value={storyBrief?.transformation || ''}
            onChange={(value) => onUpdate({ transformation: value })}
            placeholder="Before state → After state..."
          />

          <StoryBriefField
            label="Emotional Stakes"
            value={storyBrief?.emotionalStakes || ''}
            onChange={(value) => onUpdate({ emotionalStakes: value })}
            placeholder="Who suffers, who triumphs, why it matters..."
          />

          <StoryBriefField
            label="Unique Angle"
            value={storyBrief?.uniqueAngle || ''}
            onChange={(value) => onUpdate({ uniqueAngle: value })}
            placeholder="What makes this story worth telling..."
          />

          {/* Emotional storytelling elements */}
          <div style={{ paddingTop: '20px', borderTop: '1px solid #e4e4e7' }}>
            <StoryBriefListField
              label="Emotional Behaviors"
              values={storyBrief?.emotionalBehaviors || []}
              onChange={(values) => onUpdate({ emotionalBehaviors: values })}
              placeholder="No behaviors yet..."
              helperText="Actions that show emotion, not tell"
            />
          </div>

          <StoryBriefListField
            label="Tone Notes"
            values={storyBrief?.toneNotes || []}
            onChange={(values) => onUpdate({ toneNotes: values })}
            placeholder="No tone notes yet..."
            helperText="Guiding mood phrases for the video"
          />
        </div>
      </div>

      {/* Footer with confirm button */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e4e4e7',
          padding: '20px 24px',
        }}
      >
        <Button
          onClick={onConfirm}
          disabled={!hasAllFields || !isComplete}
          loading={isConfirming}
          fullWidth
          icon={<CheckIcon />}
        >
          {isComplete ? 'Confirm & Continue' : 'Complete Interview First'}
        </Button>

        {!hasAllFields && isComplete && (
          <p style={{ fontSize: '12px', color: '#f59e0b', textAlign: 'center', marginTop: '12px' }}>
            Fill in all fields before continuing
          </p>
        )}
      </div>
    </aside>
  );
}
