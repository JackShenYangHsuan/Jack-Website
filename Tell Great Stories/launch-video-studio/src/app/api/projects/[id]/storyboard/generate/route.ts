import { NextResponse } from 'next/server';
import { loadProject, updateProject, getProjectDir } from '@/lib/storage';
import { loadSettings } from '@/lib/storage';
import { DEFAULT_STORYBOARD_PROMPT } from '@/types/settings';
import { generateSketchesForScenes, type ComfyUIImageConfig } from '@/lib/image-generation';
import type {
  Storyboard,
  StoryboardScene,
  ShotType,
  CameraMovement,
  TransitionType,
} from '@/types/project';

/**
 * Expected JSON response from AI for storyboard generation
 */
interface GeneratedStoryboard {
  scenes: Array<{
    visualDescription: string;
    shotType: string;
    cameraMovement: string;
    duration: number;
    voiceover: string;
    onScreenText?: string;
    transition: string;
    notes?: string;
  }>;
  pacingNotes?: string;
  audioDirection?: string;
}

/**
 * Valid shot types for validation
 */
const VALID_SHOT_TYPES: ShotType[] = [
  'extreme-wide', 'wide', 'medium-wide', 'medium', 'medium-close',
  'close-up', 'extreme-close', 'over-shoulder', 'pov',
];

/**
 * Valid camera movements for validation
 */
const VALID_CAMERA_MOVEMENTS: CameraMovement[] = [
  'static', 'pan-left', 'pan-right', 'tilt-up', 'tilt-down',
  'zoom-in', 'zoom-out', 'dolly-in', 'dolly-out', 'tracking', 'crane', 'handheld',
];

/**
 * Valid transition types for validation
 */
const VALID_TRANSITIONS: TransitionType[] = [
  'cut', 'fade', 'dissolve', 'wipe', 'morph', 'match-cut', 'j-cut', 'l-cut',
];

/**
 * Parse and validate AI response
 */
function parseStoryboardResponse(content: string): GeneratedStoryboard | null {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    // Try parsing the whole content as JSON
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse storyboard response:', error);
    return null;
  }
}

/**
 * Validate and normalize a shot type
 */
function validateShotType(value: string): ShotType {
  const normalized = value.toLowerCase().replace(/\s+/g, '-');
  if (VALID_SHOT_TYPES.includes(normalized as ShotType)) {
    return normalized as ShotType;
  }
  // Default fallback
  return 'medium';
}

/**
 * Validate and normalize a camera movement
 */
function validateCameraMovement(value: string): CameraMovement {
  const normalized = value.toLowerCase().replace(/\s+/g, '-');
  if (VALID_CAMERA_MOVEMENTS.includes(normalized as CameraMovement)) {
    return normalized as CameraMovement;
  }
  // Default fallback
  return 'static';
}

/**
 * Validate and normalize a transition type
 */
function validateTransition(value: string): TransitionType {
  const normalized = value.toLowerCase().replace(/\s+/g, '-');
  if (VALID_TRANSITIONS.includes(normalized as TransitionType)) {
    return normalized as TransitionType;
  }
  // Default fallback
  return 'cut';
}

/**
 * Build context from story brief and style guide
 */
function buildContext(project: {
  storyBrief: {
    companyName: string;
    tagline: string;
    pain: string;
    solution: string;
    transformation: string;
    emotionalStakes: string;
    uniqueAngle: string;
    emotionalBehaviors: string[];
    toneNotes: string[];
  } | null;
  styleGuide: {
    mood: string;
    lighting: string;
    cameraStyle: string;
    categories?: {
      colorPalette?: { insights: { text: string }[] };
      typographyStyle?: { insights: { text: string }[] };
      motionDesign?: { insights: { text: string }[] };
      pacingRhythm?: { insights: { text: string }[] };
      visualMetaphors?: { insights: { text: string }[] };
      transitionStyles?: { insights: { text: string }[] };
    };
    additionalNotes?: string;
  } | null;
}): string {
  const parts: string[] = [];

  if (project.storyBrief) {
    const sb = project.storyBrief;
    parts.push('## Story Brief');
    parts.push(`**Company:** ${sb.companyName}`);
    parts.push(`**Tagline:** ${sb.tagline}`);
    parts.push(`**Pain Point:** ${sb.pain}`);
    parts.push(`**Solution:** ${sb.solution}`);
    parts.push(`**Transformation:** ${sb.transformation}`);
    parts.push(`**Emotional Stakes:** ${sb.emotionalStakes}`);
    parts.push(`**Unique Angle:** ${sb.uniqueAngle}`);
    if (sb.emotionalBehaviors?.length) {
      parts.push(`**Emotional Behaviors:**\n${sb.emotionalBehaviors.map(b => `- ${b}`).join('\n')}`);
    }
    if (sb.toneNotes?.length) {
      parts.push(`**Tone Notes:**\n${sb.toneNotes.map(t => `- ${t}`).join('\n')}`);
    }
  }

  if (project.styleGuide) {
    const sg = project.styleGuide;
    parts.push('\n## Style Guide');
    parts.push(`**Mood:** ${sg.mood}`);
    parts.push(`**Lighting:** ${sg.lighting}`);
    parts.push(`**Camera Style:** ${sg.cameraStyle}`);

    if (sg.categories) {
      const categories = sg.categories;
      if (categories.colorPalette?.insights?.length) {
        parts.push(`**Color Palette:**\n${categories.colorPalette.insights.map(i => `- ${i.text}`).join('\n')}`);
      }
      if (categories.motionDesign?.insights?.length) {
        parts.push(`**Motion Design:**\n${categories.motionDesign.insights.map(i => `- ${i.text}`).join('\n')}`);
      }
      if (categories.pacingRhythm?.insights?.length) {
        parts.push(`**Pacing:**\n${categories.pacingRhythm.insights.map(i => `- ${i.text}`).join('\n')}`);
      }
      if (categories.visualMetaphors?.insights?.length) {
        parts.push(`**Visual Metaphors:**\n${categories.visualMetaphors.insights.map(i => `- ${i.text}`).join('\n')}`);
      }
      if (categories.transitionStyles?.insights?.length) {
        parts.push(`**Transitions:**\n${categories.transitionStyles.insights.map(i => `- ${i.text}`).join('\n')}`);
      }
    }

    if (sg.additionalNotes) {
      parts.push(`**Additional Notes:** ${sg.additionalNotes}`);
    }
  }

  return parts.join('\n');
}

/**
 * POST /api/projects/[id]/storyboard/generate
 * Generate a storyboard using AI
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      model?: string;
      targetDuration?: 30 | 60 | 90;
      generateSketches?: boolean;
      sketchModel?: string;
    };

    const { model, targetDuration = 60, generateSketches = true, sketchModel } = body;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.storyBrief) {
      return NextResponse.json(
        { error: 'Complete the Discovery phase first' },
        { status: 400 }
      );
    }

    // Load settings for API key and prompt
    const settings = await loadSettings();
    if (!settings.openRouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Please set it in Settings.' },
        { status: 400 }
      );
    }

    // Use specified model or default
    const selectedModel = model || settings.defaultModel || 'anthropic/claude-sonnet-4';

    // Get the storyboard prompt from settings
    const systemPrompt = settings.prompts?.storyboard || DEFAULT_STORYBOARD_PROMPT;

    // Build context from project
    const context = buildContext(project);

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://launch-video-studio.local',
        'X-Title': 'Launch Video Studio',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}

Return your storyboard as valid JSON in this exact format:

\`\`\`json
{
  "scenes": [
    {
      "visualDescription": "What we see - be specific about subjects, setting, actions",
      "shotType": "medium|wide|close-up|etc",
      "cameraMovement": "static|pan-left|zoom-in|etc",
      "duration": 5,
      "voiceover": "What is said during this scene",
      "onScreenText": "Optional on-screen text",
      "transition": "cut|fade|dissolve|etc",
      "notes": "Optional production notes"
    }
  ],
  "pacingNotes": "Overall pacing guidance",
  "audioDirection": "Music and sound design notes"
}
\`\`\`

Valid shotType values: extreme-wide, wide, medium-wide, medium, medium-close, close-up, extreme-close, over-shoulder, pov
Valid cameraMovement values: static, pan-left, pan-right, tilt-up, tilt-down, zoom-in, zoom-out, dolly-in, dolly-out, tracking, crane, handheld
Valid transition values: cut, fade, dissolve, wipe, morph, match-cut, j-cut, l-cut

Create a compelling ${targetDuration}-second video storyboard. Each scene should show emotion through action, not just tell. The total duration of all scenes should equal approximately ${targetDuration} seconds.`,
          },
          {
            role: 'user',
            content: `Create a ${targetDuration}-second launch video storyboard based on this context:\n\n${context}\n\nReturn ONLY valid JSON, no other text.`,
          },
        ],
      }),
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);

      let errorMessage = 'Failed to generate storyboard';
      if (openRouterResponse.status === 429) {
        errorMessage = 'Rate limit reached. Please wait a moment and try again.';
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: openRouterResponse.status }
      );
    }

    const aiResponse = await openRouterResponse.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || '';

    // Parse the AI response
    const parsedStoryboard = parseStoryboardResponse(rawContent);
    if (!parsedStoryboard || !parsedStoryboard.scenes?.length) {
      console.error('Could not parse storyboard response:', rawContent);
      return NextResponse.json(
        { error: 'Failed to parse storyboard. Please try again.' },
        { status: 500 }
      );
    }

    // Convert to our Storyboard type with validation
    const scenes: StoryboardScene[] = parsedStoryboard.scenes.map((scene, index) => ({
      id: crypto.randomUUID(),
      order: index + 1,
      visualDescription: scene.visualDescription || '',
      shotType: validateShotType(scene.shotType || 'medium'),
      cameraMovement: validateCameraMovement(scene.cameraMovement || 'static'),
      duration: Math.max(1, Math.min(30, scene.duration || 5)),
      voiceover: scene.voiceover || '',
      onScreenText: scene.onScreenText,
      transition: validateTransition(scene.transition || 'cut'),
      notes: scene.notes,
    }));

    // Generate sketches for each scene if enabled and ComfyUI is configured
    if (generateSketches && settings.comfyuiUrl && settings.comfyuiWorkflow && settings.comfyuiPromptNodeId) {
      const projectDir = getProjectDir(id);

      const comfyConfig: ComfyUIImageConfig = {
        serverUrl: settings.comfyuiUrl,
        workflow: settings.comfyuiWorkflow,
        promptNodeId: settings.comfyuiPromptNodeId,
      };

      try {
        const sketchResults = await generateSketchesForScenes(
          comfyConfig,
          id,
          scenes.map(s => ({
            order: s.order,
            visualDescription: s.visualDescription,
            shotType: s.shotType,
          })),
          projectDir,
          1 // Process 1 at a time for ComfyUI
        );

        // Update scenes with sketch URLs
        for (const scene of scenes) {
          const sketchUrl = sketchResults.get(scene.order);
          if (sketchUrl) {
            scene.sketchUrl = sketchUrl;
          }
        }
      } catch (sketchError) {
        console.error('Error generating sketches:', sketchError);
        // Continue without sketches - don't fail the whole storyboard
      }
    }

    const storyboard: Storyboard = {
      scenes,
      targetDuration,
      pacingNotes: parsedStoryboard.pacingNotes || '',
      audioDirection: parsedStoryboard.audioDirection || '',
      generatedAt: new Date().toISOString(),
      generatedBy: selectedModel,
    };

    // Save to project
    await updateProject(id, { storyboard });

    return NextResponse.json({
      storyboard,
      message: 'Storyboard generated successfully',
    });
  } catch (error) {
    console.error('Error generating storyboard:', error);
    return NextResponse.json(
      { error: 'Failed to generate storyboard' },
      { status: 500 }
    );
  }
}
