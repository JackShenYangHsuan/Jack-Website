import { NextResponse } from 'next/server';
import { loadProject, updateProject } from '@/lib/storage';
import { loadSettings } from '@/lib/storage';
import {
  DEFAULT_STYLE_GUIDE,
  DEFAULT_STYLE_CATEGORIES,
  type ReferenceVideo,
  type StyleGuide,
  type StyleCategories,
  type StyleCategoryKey,
  type StyleInsight,
} from '@/types/project';
import { DEFAULT_STYLE_ANALYSIS_PROMPT } from '@/types/settings';

/**
 * Expected JSON response from AI
 */
interface AnalysisResponse {
  colorPalette?: string[];
  typographyStyle?: string[];
  motionDesign?: string[];
  pacingRhythm?: string[];
  visualMetaphors?: string[];
  transitionStyles?: string[];
}

/**
 * Parse AI response to extract JSON - tries multiple strategies
 */
function parseAnalysisResponse(content: string): AnalysisResponse | null {
  // Strategy 1: Try to extract JSON from markdown code blocks
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Try parsing the whole content as JSON
  try {
    return JSON.parse(content);
  } catch {
    // Continue to next strategy
  }

  // Strategy 3: Try to find JSON object in the content (handles prose with embedded JSON)
  try {
    const jsonObjectMatch = content.match(/\{[\s\S]*"colorPalette"[\s\S]*\}/);
    if (jsonObjectMatch) {
      return JSON.parse(jsonObjectMatch[0]);
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 4: Extract insights from prose sections using patterns
  try {
    const extracted: AnalysisResponse = {
      colorPalette: [],
      typographyStyle: [],
      motionDesign: [],
      pacingRhythm: [],
      visualMetaphors: [],
      transitionStyles: [],
    };

    // Look for section headers and extract bullet points
    const sections: { key: keyof AnalysisResponse; patterns: RegExp[] }[] = [
      { key: 'colorPalette', patterns: [/\*\*Color Palette[:\s]*\*\*[\s\S]*?(?=\*\*[A-Z]|\n\n\*\*|\n##|$)/gi, /Color Palette[:\s]*[\s\S]*?(?=\*\*[A-Z]|\n\n##|Typography|Motion|Pacing|Visual|Transition|$)/gi] },
      { key: 'typographyStyle', patterns: [/\*\*Typography[:\s]*\*\*[\s\S]*?(?=\*\*[A-Z]|\n\n\*\*|\n##|$)/gi, /Typography Style[:\s]*[\s\S]*?(?=\*\*[A-Z]|\n\n##|Color|Motion|Pacing|Visual|Transition|$)/gi] },
      { key: 'motionDesign', patterns: [/\*\*Motion Design[:\s]*\*\*[\s\S]*?(?=\*\*[A-Z]|\n\n\*\*|\n##|$)/gi, /Motion Design[:\s]*[\s\S]*?(?=\*\*[A-Z]|\n\n##|Color|Typography|Pacing|Visual|Transition|$)/gi] },
      { key: 'pacingRhythm', patterns: [/\*\*Pacing[:\s]*\*\*[\s\S]*?(?=\*\*[A-Z]|\n\n\*\*|\n##|$)/gi, /Pacing and Rhythm[:\s]*[\s\S]*?(?=\*\*[A-Z]|\n\n##|Color|Typography|Motion|Visual|Transition|$)/gi] },
      { key: 'visualMetaphors', patterns: [/\*\*Visual Metaphors[:\s]*\*\*[\s\S]*?(?=\*\*[A-Z]|\n\n\*\*|\n##|$)/gi, /Visual Metaphors[:\s]*[\s\S]*?(?=\*\*[A-Z]|\n\n##|Color|Typography|Motion|Pacing|Transition|$)/gi] },
      { key: 'transitionStyles', patterns: [/\*\*Transition[:\s]*\*\*[\s\S]*?(?=\*\*[A-Z]|\n\n\*\*|\n##|$)/gi, /Transition Styles[:\s]*[\s\S]*?(?=\*\*[A-Z]|\n\n##|Color|Typography|Motion|Pacing|Visual|$)/gi] },
    ];

    for (const section of sections) {
      for (const pattern of section.patterns) {
        const match = content.match(pattern);
        if (match && match[0]) {
          // Extract bullet points from the section
          const bullets = match[0].match(/[\*\-]\s+[^\n]+/g);
          if (bullets) {
            for (const bullet of bullets) {
              const cleanBullet = bullet.replace(/^[\*\-]\s+/, '').trim();
              const categoryInsights = extracted[section.key];
              if (cleanBullet.length > 10 && categoryInsights && !categoryInsights.includes(cleanBullet)) {
                categoryInsights.push(cleanBullet);
              }
            }
          }
          break; // Found content for this section
        }
      }
    }

    // Check if we extracted anything useful
    const totalInsights = Object.values(extracted).flat().length;
    if (totalInsights >= 3) {
      return extracted;
    }
  } catch {
    // Strategy failed
  }

  console.error('Failed to parse analysis response with all strategies');
  return null;
}

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

    // Get the analysis prompt from settings
    const systemPrompt = settings.prompts?.styleAnalysis || DEFAULT_STYLE_ANALYSIS_PROMPT;

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
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this video for visual style insights. IMPORTANT: Return ONLY valid JSON with no additional text, no explanations, no markdown formatting outside the JSON structure. The JSON must have these 6 keys: colorPalette, typographyStyle, motionDesign, pacingRhythm, visualMetaphors, transitionStyles. Each key should have an array of 2-4 short insight strings.',
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
    const rawContent = aiResponse.choices?.[0]?.message?.content || '';

    // Parse the AI response to extract category insights
    const parsedAnalysis = parseAnalysisResponse(rawContent);
    if (!parsedAnalysis) {
      console.error('Could not parse AI response:', rawContent);
      return NextResponse.json(
        { error: 'Failed to parse video analysis. Please try again.' },
        { status: 500 }
      );
    }

    // Create reference video record (without analysis field now)
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
    const currentCategories = currentStyleGuide.categories || DEFAULT_STYLE_CATEGORIES;

    // Create new categories by appending insights from this video
    const categoryKeys: StyleCategoryKey[] = [
      'colorPalette',
      'typographyStyle',
      'motionDesign',
      'pacingRhythm',
      'visualMetaphors',
      'transitionStyles',
    ];

    const updatedCategories: StyleCategories = { ...currentCategories };

    for (const key of categoryKeys) {
      const newInsights = parsedAnalysis[key] || [];
      const insightsToAdd: StyleInsight[] = newInsights.map((text) => ({
        id: crypto.randomUUID(),
        text,
        videoId: videoRefId,
        videoTitle: title,
      }));

      updatedCategories[key] = {
        ...currentCategories[key],
        insights: [...currentCategories[key].insights, ...insightsToAdd],
      };
    }

    // Update project style guide
    const updatedStyleGuide: StyleGuide = {
      ...currentStyleGuide,
      referenceVideos: [...currentStyleGuide.referenceVideos, referenceVideo],
      categories: updatedCategories,
    };

    await updateProject(id, { styleGuide: updatedStyleGuide });

    return NextResponse.json({
      video: referenceVideo,
      categories: updatedCategories,
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
    const currentCategories = currentStyleGuide.categories || DEFAULT_STYLE_CATEGORIES;

    // Remove insights from this video from all categories
    const categoryKeys: StyleCategoryKey[] = [
      'colorPalette',
      'typographyStyle',
      'motionDesign',
      'pacingRhythm',
      'visualMetaphors',
      'transitionStyles',
    ];

    const updatedCategories: StyleCategories = { ...currentCategories };
    for (const key of categoryKeys) {
      updatedCategories[key] = {
        ...currentCategories[key],
        insights: currentCategories[key].insights.filter(
          (insight) => insight.videoId !== videoId
        ),
      };
    }

    const updatedStyleGuide: StyleGuide = {
      ...currentStyleGuide,
      referenceVideos: currentStyleGuide.referenceVideos.filter(
        (v) => v.id !== videoId
      ),
      categories: updatedCategories,
    };

    await updateProject(id, { styleGuide: updatedStyleGuide });

    return NextResponse.json({
      success: true,
      categories: updatedCategories,
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

/**
 * PATCH /api/projects/[id]/style/analyze-video
 * Update an insight's text or delete an insight
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      action: 'update' | 'delete' | 'add';
      categoryKey: StyleCategoryKey;
      insightId?: string;
      text?: string;
    };

    const { action, categoryKey, insightId, text } = body;

    if (!categoryKey) {
      return NextResponse.json(
        { error: 'categoryKey is required' },
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
    const currentCategories = currentStyleGuide.categories || DEFAULT_STYLE_CATEGORIES;
    const updatedCategories: StyleCategories = { ...currentCategories };

    if (action === 'update' && insightId && text !== undefined) {
      // Update an existing insight
      updatedCategories[categoryKey] = {
        ...currentCategories[categoryKey],
        insights: currentCategories[categoryKey].insights.map((insight) =>
          insight.id === insightId ? { ...insight, text } : insight
        ),
      };
    } else if (action === 'delete' && insightId) {
      // Delete an insight
      updatedCategories[categoryKey] = {
        ...currentCategories[categoryKey],
        insights: currentCategories[categoryKey].insights.filter(
          (insight) => insight.id !== insightId
        ),
      };
    } else if (action === 'add' && text) {
      // Add a new manual insight
      const newInsight: StyleInsight = {
        id: crypto.randomUUID(),
        text,
        videoId: 'manual',
        videoTitle: 'Manual Entry',
      };
      updatedCategories[categoryKey] = {
        ...currentCategories[categoryKey],
        insights: [...currentCategories[categoryKey].insights, newInsight],
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing required fields' },
        { status: 400 }
      );
    }

    const updatedStyleGuide: StyleGuide = {
      ...currentStyleGuide,
      categories: updatedCategories,
    };

    await updateProject(id, { styleGuide: updatedStyleGuide });

    return NextResponse.json({
      success: true,
      categories: updatedCategories,
      message: 'Insight updated successfully',
    });
  } catch (error) {
    console.error('Error updating insight:', error);
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}
