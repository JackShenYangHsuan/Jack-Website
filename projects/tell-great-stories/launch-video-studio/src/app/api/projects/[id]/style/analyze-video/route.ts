import { NextResponse } from 'next/server';
import { loadProject, updateProject } from '@/lib/storage';
import { loadSettings } from '@/lib/storage';
import {
  DEFAULT_STYLE_GUIDE,
  type ReferenceVideo,
  type StyleGuide,
} from '@/types/project';
import { DEFAULT_STYLE_ANALYSIS_PROMPT } from '@/types/settings';

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Get video title from YouTube oEmbed API
 */
async function getYouTubeTitle(videoId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (response.ok) {
      const data = await response.json();
      return data.title || 'Untitled Video';
    }
  } catch (error) {
    console.error('Error fetching video title:', error);
  }
  return 'Untitled Video';
}

/**
 * POST /api/projects/[id]/style/analyze-video
 * Analyze a YouTube video using AI
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      url: string;
      model?: string;
    };

    const { url, model } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
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

    // Load settings for API key and prompt
    const settings = await loadSettings();
    if (!settings.openRouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Please set it in Settings.' },
        { status: 400 }
      );
    }

    // Get video title
    const title = await getYouTubeTitle(videoId);

    // Use specified model or default to Gemini 2.5 Flash
    const selectedModel = model || 'google/gemini-2.5-flash';

    // Get the style analysis prompt from settings or use default
    const styleAnalysisPrompt = settings.prompts?.styleAnalysis || DEFAULT_STYLE_ANALYSIS_PROMPT;

    // Call OpenRouter API with video URL
    // Use the proper multimodal format with video_url type
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

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
            role: 'user',
            content: [
              {
                type: 'text',
                text: styleAnalysisPrompt,
              },
              {
                type: 'video_url',
                video_url: {
                  url: youtubeUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json().catch(() => ({}));
      console.error('OpenRouter API error:', errorData);

      // Provide more helpful error messages
      let errorMessage = 'Failed to analyze video';
      if (openRouterResponse.status === 429) {
        const raw = errorData.error?.metadata?.raw || '';
        if (raw.includes('rate-limited')) {
          errorMessage = 'Rate limit reached. Try using Gemini Pro 1.5 (paid) or wait a few minutes.';
        } else {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        }
      } else if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: openRouterResponse.status }
      );
    }

    const aiResponse = await openRouterResponse.json();
    const analysisContent = aiResponse.choices?.[0]?.message?.content || '';

    if (!analysisContent || analysisContent.length < 50) {
      console.error('Empty or short AI response:', analysisContent);
      return NextResponse.json(
        { error: 'Failed to get meaningful analysis. Please try again.' },
        { status: 500 }
      );
    }

    // Create reference video record
    const videoRefId = crypto.randomUUID();
    const referenceVideo: ReferenceVideo = {
      id: videoRefId,
      url: youtubeUrl,
      title,
      model: selectedModel,
      analyzedAt: new Date().toISOString(),
    };

    // Get current style guide or create default
    const currentStyleGuide = project.styleGuide || DEFAULT_STYLE_GUIDE;

    // Append new insights to existing styleInsights with video attribution
    const videoHeader = `\n\n---\n\n### From: ${title}\n*Analyzed on ${new Date().toLocaleDateString()}*\n\n`;
    const updatedInsights = (currentStyleGuide.styleInsights || '') + videoHeader + analysisContent;

    // Update project style guide
    const updatedStyleGuide: StyleGuide = {
      ...currentStyleGuide,
      referenceVideos: [...currentStyleGuide.referenceVideos, referenceVideo],
      styleInsights: updatedInsights.trim(),
    };

    await updateProject(id, { styleGuide: updatedStyleGuide });

    return NextResponse.json({
      video: referenceVideo,
      styleInsights: updatedStyleGuide.styleInsights,
      message: 'Video analyzed successfully',
    });
  } catch (error) {
    console.error('Error analyzing video:', error);
    return NextResponse.json(
      { error: 'Failed to analyze video' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/style/analyze-video
 * Delete a reference video (requires videoId in query params)
 * Note: Does not remove text from styleInsights - user can edit that manually
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'videoId is required' },
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

    const currentStyleGuide = project.styleGuide || DEFAULT_STYLE_GUIDE;

    // Just remove from referenceVideos list - styleInsights text stays (user can edit)
    const updatedStyleGuide: StyleGuide = {
      ...currentStyleGuide,
      referenceVideos: currentStyleGuide.referenceVideos.filter(
        (v) => v.id !== videoId
      ),
    };

    await updateProject(id, { styleGuide: updatedStyleGuide });

    return NextResponse.json({
      success: true,
      message: 'Video removed successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
