import { NextResponse } from 'next/server';
import { loadProject, updateProject, getProjectDir } from '@/lib/storage';
import { loadSettings } from '@/lib/storage';
import { generateImage, downloadAndSaveImage, type ComfyUIImageConfig } from '@/lib/image-generation';
import type { KeyframesData, KeyframeImage, StoryboardScene } from '@/types/project';
import path from 'path';

/**
 * Build a production-quality image prompt from scene data and style guide
 */
function buildKeyframePrompt(
  scene: StoryboardScene,
  styleGuide: {
    mood?: string;
    lighting?: string;
    cameraStyle?: string;
    categories?: {
      colorPalette?: { insights: { text: string }[] };
    };
  } | null
): string {
  const parts: string[] = [];

  // Main visual description
  parts.push(scene.visualDescription);

  // Add style context
  if (styleGuide) {
    if (styleGuide.mood) {
      parts.push(`Mood: ${styleGuide.mood}`);
    }
    if (styleGuide.lighting) {
      parts.push(`Lighting: ${styleGuide.lighting}`);
    }
    if (styleGuide.cameraStyle) {
      parts.push(`Camera style: ${styleGuide.cameraStyle}`);
    }
    // Add color palette hints
    if (styleGuide.categories?.colorPalette?.insights?.length) {
      const colorHint = styleGuide.categories.colorPalette.insights[0].text;
      parts.push(`Colors: ${colorHint}`);
    }
  }

  // Add shot type context
  const shotTypeLabels: Record<string, string> = {
    'extreme-wide': 'extreme wide angle establishing shot',
    'wide': 'wide angle shot',
    'medium-wide': 'medium wide shot',
    'medium': 'medium shot',
    'medium-close': 'medium close-up',
    'close-up': 'close-up shot',
    'extreme-close': 'extreme close-up detail shot',
    'over-shoulder': 'over the shoulder perspective',
    'pov': 'first person point of view',
  };

  const shotLabel = shotTypeLabels[scene.shotType] || 'medium shot';
  parts.push(`Framing: ${shotLabel}`);

  // Quality boosters
  parts.push('High quality, cinematic, professional photography, sharp focus, vivid colors');

  return parts.join('. ');
}

/**
 * POST /api/projects/[id]/images/generate
 * Generate keyframe images for scenes using ComfyUI
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      sceneIds?: string[];  // Generate for specific scenes, or all if not provided
      regenerate?: boolean; // Regenerate even if images exist
    };

    const { sceneIds, regenerate = false } = body;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.storyboard || project.storyboard.scenes.length === 0) {
      return NextResponse.json(
        { error: 'No storyboard scenes to generate images for' },
        { status: 400 }
      );
    }

    // Load settings for ComfyUI config
    const settings = await loadSettings();
    if (!settings.comfyuiUrl) {
      return NextResponse.json(
        { error: 'ComfyUI URL not configured. Please set it in Settings.' },
        { status: 400 }
      );
    }
    if (!settings.comfyuiWorkflow) {
      return NextResponse.json(
        { error: 'ComfyUI workflow not configured. Please set it in Settings.' },
        { status: 400 }
      );
    }
    if (!settings.comfyuiPromptNodeId) {
      return NextResponse.json(
        { error: 'ComfyUI prompt node ID not configured. Please set it in Settings.' },
        { status: 400 }
      );
    }

    const comfyConfig: ComfyUIImageConfig = {
      serverUrl: settings.comfyuiUrl,
      workflow: settings.comfyuiWorkflow,
      promptNodeId: settings.comfyuiPromptNodeId,
    };

    const projectDir = getProjectDir(id);
    const keyframesDir = path.join(projectDir, 'assets', 'keyframes');

    // Determine which scenes to process
    let scenesToProcess = project.storyboard.scenes;
    if (sceneIds && sceneIds.length > 0) {
      scenesToProcess = scenesToProcess.filter(s => sceneIds.includes(s.id));
    }

    // If not regenerating, filter out scenes that already have approved images
    if (!regenerate && project.keyframes) {
      scenesToProcess = scenesToProcess.filter(scene => {
        const hasApproved = project.keyframes!.images.some(
          img => img.sceneId === scene.id && img.isApproved
        );
        return !hasApproved;
      });
    }

    if (scenesToProcess.length === 0) {
      return NextResponse.json({
        message: 'All scenes already have approved images',
        imagesGenerated: 0,
        keyframes: project.keyframes,
      });
    }

    console.log(`[Images API] Generating ${scenesToProcess.length} keyframe images`);

    // Current keyframes or empty
    const currentKeyframes: KeyframesData = project.keyframes || { images: [] };
    const newImages: KeyframeImage[] = [];

    // Generate images one at a time (ComfyUI handles one well)
    for (const scene of scenesToProcess) {
      try {
        const prompt = buildKeyframePrompt(scene, project.styleGuide);
        console.log(`[Images API] Scene ${scene.order}: ${prompt.substring(0, 100)}...`);

        const result = await generateImage(comfyConfig, prompt);
        if (result?.url) {
          // Save the image
          const filename = `keyframe-${scene.order.toString().padStart(2, '0')}-${Date.now()}.png`;
          const savePath = path.join(keyframesDir, filename);
          const savedPath = await downloadAndSaveImage(result.url, savePath);

          if (savedPath) {
            const newImage: KeyframeImage = {
              id: crypto.randomUUID(),
              sceneId: scene.id,
              sceneOrder: scene.order,
              imageUrl: `/api/projects/${id}/assets/keyframes/${filename}`,
              prompt,
              isApproved: false, // User needs to approve
              generatedAt: new Date().toISOString(),
            };
            newImages.push(newImage);
            console.log(`[Images API] Scene ${scene.order}: Generated successfully`);
          }
        }
      } catch (error) {
        console.error(`[Images API] Scene ${scene.order}: Failed`, error);
        // Continue with other scenes
      }
    }

    // Merge new images with existing
    const updatedKeyframes: KeyframesData = {
      images: [...currentKeyframes.images, ...newImages],
      lastGeneratedAt: new Date().toISOString(),
    };

    // Save to project
    await updateProject(id, { keyframes: updatedKeyframes });

    return NextResponse.json({
      message: `Generated ${newImages.length} keyframe images`,
      imagesGenerated: newImages.length,
      keyframes: updatedKeyframes,
    });
  } catch (error) {
    console.error('Error generating keyframes:', error);
    return NextResponse.json(
      { error: 'Failed to generate keyframes' },
      { status: 500 }
    );
  }
}
