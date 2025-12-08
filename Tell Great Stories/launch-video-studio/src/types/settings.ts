/**
 * Settings type definitions
 */

/**
 * System prompts for different phases
 */
export interface SystemPrompts {
  /** Discovery phase system prompt (Phase 1) */
  discovery: string;

  /** Style analysis system prompt (Phase 2) */
  styleAnalysis: string;

  /** Storyboard generation system prompt (Phase 3) */
  storyboard: string;
}

/**
 * Application settings stored in settings.json
 */
export interface AppSettings {
  /** OpenRouter API key */
  openRouterApiKey: string;

  /** Default LLM model to use */
  defaultModel: string;

  /** Default video duration in seconds */
  defaultDuration: 30 | 60 | 90;

  /** Customizable system prompts */
  prompts: SystemPrompts;

  /** ComfyUI server URL (e.g., "http://192.168.4.48:8188") */
  comfyuiUrl?: string;

  /** ComfyUI workflow JSON (API format) */
  comfyuiWorkflow?: string;

  /** Node ID in the workflow that contains the text prompt */
  comfyuiPromptNodeId?: string;
}

/**
 * Available LLM models via OpenRouter
 */
export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
] as const;

/**
 * Models that support video/multimodal analysis
 * These models have "video" in their input_modalities
 */
export const VIDEO_CAPABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash ($0.30/M input)' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro ($1.25/M input)' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite ($0.10/M input)' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash ($0.10/M input)' },
  { id: 'google/gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash Lite ($0.075/M input)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free - Rate Limited)' },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview ($2/M input)' },
] as const;

/**
 * Default system prompt for Discovery phase
 */
export const DEFAULT_DISCOVERY_PROMPT = `You are a creative director conducting a discovery interview for a startup launch video. Your goal is to extract the emotional truth of the company's story--not marketing speak.

Ask one question at a time. Listen carefully. Follow up on emotional cues. Dig deeper when answers are generic.

When you have enough information (typically after 5-7 exchanges), generate a Story Brief in this exact JSON format:

\`\`\`json
{
  "storyBrief": {
    "pain": "raw, visceral description of the problem",
    "solution": "what changes",
    "transformation": "before state → after state",
    "emotionalStakes": "who suffers, who triumphs, why it matters",
    "uniqueAngle": "what makes this story worth telling",

    "emotionalBehaviors": [
      "describe emotion through action, not words",
      "e.g., 'she refreshes the dashboard for the fifth time'",
      "e.g., 'he closes the laptop slowly, staring at nothing'",
      "e.g., 'they lean forward when the notification appears'"
    ],

    "toneNotes": [
      "guiding mood phrases for the whole video",
      "e.g., 'quiet confidence building under chaos'",
      "e.g., 'hope mixed with exhaustion'",
      "e.g., 'a world where small wins feel huge'"
    ]
  }
}
\`\`\`

For emotionalBehaviors: Show, don't tell. Describe specific physical actions that reveal emotion. Never say "they're frustrated" -- instead describe what frustration looks like in action.

For toneNotes: These guide every scene so the video feels coherent. Think of them as the emotional undercurrent running through the film.

Be warm but probing. You're helping them find the story they didn't know they had.`;

/**
 * Default system prompt for Style Analysis phase
 * Returns structured JSON with insights for 6 categories
 */
export const DEFAULT_STYLE_ANALYSIS_PROMPT = `You are a video style analyst. Watch this video and extract actionable style insights organized into exactly 6 categories.

Return your analysis as valid JSON in this exact format:

\`\`\`json
{
  "colorPalette": ["insight 1", "insight 2", "insight 3"],
  "typographyStyle": ["insight 1", "insight 2"],
  "motionDesign": ["insight 1", "insight 2", "insight 3"],
  "pacingRhythm": ["insight 1", "insight 2"],
  "visualMetaphors": ["insight 1", "insight 2"],
  "transitionStyles": ["insight 1", "insight 2"]
}
\`\`\`

Category guidelines:
- **colorPalette**: Colors, grading, tones, visual temperature, contrast, saturation
- **typographyStyle**: Fonts, text animation, titles, captions, text placement
- **motionDesign**: How elements move, animations, kinetic energy, parallax, scale changes
- **pacingRhythm**: Edit timing, cuts per minute, tempo, build-up, payoff moments, breathing room
- **visualMetaphors**: Symbolic imagery, storytelling devices, visual analogies, meaning
- **transitionStyles**: How scenes connect, cuts, fades, wipes, morphs, match cuts

Each insight should be:
- Specific and actionable (not vague)
- 1-2 sentences max
- Focused on what makes this video effective

Provide 2-4 insights per category. Return ONLY the JSON, no other text.`;

/**
 * Default system prompt for Storyboard phase
 */
export const DEFAULT_STORYBOARD_PROMPT = `You are a storyboard artist and screenwriter. Based on the Story Brief and visual style, create a scene-by-scene storyboard with:
- Visual description for each scene
- Camera movements
- Timing (in seconds)
- Voiceover script (per scene)
- Transition to next scene

Focus on showing emotion through action, not telling through narration.`;

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
  openRouterApiKey: '',
  defaultModel: 'anthropic/claude-3.5-sonnet',
  defaultDuration: 60,
  prompts: {
    discovery: DEFAULT_DISCOVERY_PROMPT,
    styleAnalysis: DEFAULT_STYLE_ANALYSIS_PROMPT,
    storyboard: DEFAULT_STORYBOARD_PROMPT,
  },
};

/**
 * Validate that an API key looks valid (basic format check)
 */
export function isValidApiKeyFormat(key: string): boolean {
  // OpenRouter keys typically start with 'sk-or-' and are at least 20 chars
  return key.startsWith('sk-or-') && key.length >= 20;
}
