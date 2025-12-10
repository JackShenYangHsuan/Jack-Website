/**
 * System prompts management
 * Handles loading custom prompts from settings with fallback to defaults
 */

import {
  DEFAULT_DISCOVERY_PROMPT,
  DEFAULT_STYLE_ANALYSIS_PROMPT,
  DEFAULT_STORYBOARD_PROMPT,
  DEFAULT_SKETCH_PROMPT,
  type SystemPrompts,
} from '@/types/settings';

/**
 * Get the Discovery system prompt
 * @param customPrompt - Optional custom prompt from settings
 */
export function getDiscoveryPrompt(customPrompt?: string): string {
  return customPrompt?.trim() || DEFAULT_DISCOVERY_PROMPT;
}

/**
 * Get the Style Analysis system prompt
 * @param customPrompt - Optional custom prompt from settings
 */
export function getStyleAnalysisPrompt(customPrompt?: string): string {
  return customPrompt?.trim() || DEFAULT_STYLE_ANALYSIS_PROMPT;
}

/**
 * Get the Storyboard system prompt
 * @param customPrompt - Optional custom prompt from settings
 */
export function getStoryboardPrompt(customPrompt?: string): string {
  return customPrompt?.trim() || DEFAULT_STORYBOARD_PROMPT;
}

/**
 * Get all default prompts
 */
export function getDefaultPrompts(): SystemPrompts {
  return {
    discovery: DEFAULT_DISCOVERY_PROMPT,
    styleAnalysis: DEFAULT_STYLE_ANALYSIS_PROMPT,
    storyboard: DEFAULT_STORYBOARD_PROMPT,
    sketchPrompt: DEFAULT_SKETCH_PROMPT,
  };
}

/**
 * Build the opening message for a new Discovery interview
 */
export function buildOpeningMessage(companyName: string, tagline: string): string {
  return `I'm excited to help you discover the emotional core of ${companyName}'s story.

"${tagline}" -- that's your starting point. But there's a deeper story here, and my job is to help you find it.

Let's start with this: **What problem made you angry enough to start building this?** I don't want the polished pitch -- I want the moment that made you say "this has to change."`;
}
