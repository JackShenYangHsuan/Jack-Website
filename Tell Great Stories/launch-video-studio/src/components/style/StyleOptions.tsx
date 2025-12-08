'use client';

import { cn } from '@/lib/utils';
import { Select } from '@/components/ui';
import {
  MOOD_OPTIONS,
  LIGHTING_LABELS,
  CAMERA_STYLE_LABELS,
  type LightingStyle,
  type CameraStyle,
} from '@/types/project';

export interface StyleOptionsProps {
  /** Current mood value */
  mood: string;
  /** Current lighting style */
  lighting: LightingStyle;
  /** Current camera style */
  cameraStyle: CameraStyle;
  /** Callback for mood change */
  onMoodChange: (mood: string) => void;
  /** Callback for lighting change */
  onLightingChange: (lighting: LightingStyle) => void;
  /** Callback for camera style change */
  onCameraStyleChange: (cameraStyle: CameraStyle) => void;
  /** Additional class name */
  className?: string;
}

/**
 * Style options selectors for mood, lighting, and camera style
 */
export function StyleOptions({
  mood,
  lighting,
  cameraStyle,
  onMoodChange,
  onLightingChange,
  onCameraStyleChange,
  className,
}: StyleOptionsProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Mood selector */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 mb-1">Mood</h3>
        <p className="text-xs text-zinc-500 mb-3">
          The overall emotional tone of your video
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onMoodChange(option)}
              className={cn(
                'px-3 py-2 text-sm rounded-md border transition-all',
                'text-left',
                mood === option
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Lighting style */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 mb-1">Lighting Style</h3>
        <p className="text-xs text-zinc-500 mb-3">
          How scenes will be lit in your video
        </p>
        <Select
          value={lighting}
          onChange={(e) => onLightingChange(e.target.value as LightingStyle)}
          className="w-full"
          options={Object.entries(LIGHTING_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </div>

      {/* Camera style */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 mb-1">Camera Style</h3>
        <p className="text-xs text-zinc-500 mb-3">
          The visual approach for camera work
        </p>
        <Select
          value={cameraStyle}
          onChange={(e) => onCameraStyleChange(e.target.value as CameraStyle)}
          className="w-full"
          options={Object.entries(CAMERA_STYLE_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </div>
    </div>
  );
}
