import { NextResponse } from 'next/server';
import { loadProject } from '@/lib/storage';
import { loadSettings } from '@/lib/storage';

/**
 * System prompt for enhancing visual descriptions for video/image generation
 */
const ENHANCE_PROMPT_SYSTEM = `You are an expert prompt engineer for AI video and image generation. Your task is to enhance visual descriptions to produce better, more cinematic results.

Given a basic visual description, enhance it by:
1. Adding specific visual details (lighting, atmosphere, composition)
2. Including camera framing language (foreground, midground, background)
3. Adding cinematic quality descriptors (film grain, depth of field, color grading)
4. Keeping descriptions concrete and visual (avoid abstract concepts)
5. Using present tense, active descriptions
6. Avoiding clichés and generic phrases

Rules:
- Keep the core intent of the original description
- Output ONLY the enhanced prompt, nothing else
- Keep it under 150 words
- Do not add markdown formatting
- Focus on what the camera SEES, not story context`;

/**
 * POST /api/projects/[id]/storyboard/enhance-prompt
 * Enhance a scene's visual description using AI
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      sceneId: string;
      visualDescription: string;
      model?: string;
    };

    const { sceneId, visualDescription, model } = body;

    if (!visualDescription) {
      return NextResponse.json(
        { error: 'Visual description is required' },
        { status: 400 }
      );
    }

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Load settings for API key
    const settings = await loadSettings();
    if (!settings.openRouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 400 }
      );
    }

    // Get style context if available
    const styleContext = project.styleGuide?.styleInsights
      ? `\n\nStyle guide for this project:\n${project.styleGuide.styleInsights}`
      : '';

    // Build the user prompt
    const userPrompt = `Enhance this visual description for video/image generation:

"${visualDescription}"${styleContext}

Output only the enhanced prompt:`;

    // Call OpenRouter API
    const selectedModel = model || settings.defaultModel || 'anthropic/claude-sonnet-4';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: ENHANCE_PROMPT_SYSTEM },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter API error:', error);
      return NextResponse.json(
        { error: error.error?.message || 'Failed to enhance prompt' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const enhancedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sceneId,
      originalPrompt: visualDescription,
      enhancedPrompt,
    });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
}
