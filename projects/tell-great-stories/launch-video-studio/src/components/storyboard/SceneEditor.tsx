'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button, Select, Textarea } from '@/components/ui';
import {
  SHOT_TYPE_LABELS,
  CAMERA_MOVEMENT_LABELS,
  TRANSITION_TYPE_LABELS,
} from '@/types/project';
import type {
  StoryboardScene,
  ShotType,
  CameraMovement,
  TransitionType,
} from '@/types/project';

/**
 * X icon for close
 */
function XIcon({ className }: { className?: string }) {
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
      width="20"
      height="20"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export interface SceneEditorProps {
  scene: StoryboardScene;
  onSave: (updates: Partial<StoryboardScene>) => void | Promise<void>;
  onClose: () => void;
}

export function SceneEditor({ scene, onSave, onClose }: SceneEditorProps) {
  const [formData, setFormData] = useState({
    visualDescription: scene.visualDescription,
    shotType: scene.shotType,
    cameraMovement: scene.cameraMovement,
    duration: scene.duration,
    voiceover: scene.voiceover,
    onScreenText: scene.onScreenText || '',
    transition: scene.transition,
    notes: scene.notes || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">
            Edit Scene {scene.order}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
          {/* Visual Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1.5">
              Visual Description
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              What do we see in this scene? Be specific about subjects, setting, and actions.
            </p>
            <Textarea
              value={formData.visualDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, visualDescription: e.target.value }))}
              placeholder="A founder sits at a cluttered desk, lit by the glow of multiple monitors..."
              rows={3}
            />
          </div>

          {/* Shot Type and Camera Movement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                Shot Type
              </label>
              <Select
                value={formData.shotType}
                onChange={(e) => setFormData((prev) => ({ ...prev, shotType: e.target.value as ShotType }))}
                options={Object.entries(SHOT_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                Camera Movement
              </label>
              <Select
                value={formData.cameraMovement}
                onChange={(e) => setFormData((prev) => ({ ...prev, cameraMovement: e.target.value as CameraMovement }))}
                options={Object.entries(CAMERA_MOVEMENT_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
          </div>

          {/* Duration and Transition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                Duration (seconds)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                className={cn(
                  'w-full h-9 px-3 text-sm rounded-md border border-zinc-200 bg-transparent',
                  'focus:outline-none focus:ring-1 focus:ring-zinc-950'
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                Transition
              </label>
              <Select
                value={formData.transition}
                onChange={(e) => setFormData((prev) => ({ ...prev, transition: e.target.value as TransitionType }))}
                options={Object.entries(TRANSITION_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
          </div>

          {/* Voiceover */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1.5">
              Voiceover Script
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              What is being said during this scene?
            </p>
            <Textarea
              value={formData.voiceover}
              onChange={(e) => setFormData((prev) => ({ ...prev, voiceover: e.target.value }))}
              placeholder="Every day, founders face the same impossible choice..."
              rows={2}
            />
          </div>

          {/* On-screen text */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1.5">
              On-Screen Text (optional)
            </label>
            <input
              type="text"
              value={formData.onScreenText}
              onChange={(e) => setFormData((prev) => ({ ...prev, onScreenText: e.target.value }))}
              placeholder="Product name, tagline, or caption..."
              className={cn(
                'w-full h-9 px-3 text-sm rounded-md border border-zinc-200 bg-transparent',
                'focus:outline-none focus:ring-1 focus:ring-zinc-950',
                'placeholder:text-zinc-400'
              )}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1.5">
              Production Notes (optional)
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Special effects, music cues, technical requirements..."
              rows={2}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSaving}>
            Save Scene
          </Button>
        </div>
      </div>
    </div>
  );
}
