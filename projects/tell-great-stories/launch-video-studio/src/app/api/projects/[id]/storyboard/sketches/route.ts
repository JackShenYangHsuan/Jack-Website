import { NextResponse } from 'next/server';
import { loadProject, updateProject, getProjectDir } from '@/lib/storage';
import { loadSettings } from '@/lib/storage';
import { generateSketchesForScenes, type ComfyUIImageConfig } from '@/lib/image-generation';

/**
 * POST /api/projects/[id]/storyboard/sketches
 * Generate sketches for scenes that don't have them
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      regenerateAll?: boolean;
      sceneIds?: string[]; // Specific scene IDs to regenerate
    };

    const { regenerateAll = false, sceneIds } = body;
    console.log('[Sketches API] regenerateAll:', regenerateAll, 'sceneIds:', sceneIds);

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.storyboard || project.storyboard.scenes.length === 0) {
      return NextResponse.json(
        { error: 'No storyboard scenes to generate sketches for' },
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

    // Filter scenes that need sketches
    console.log('[Sketches API] Total scenes:', project.storyboard.scenes.length);
    console.log('[Sketches API] Scenes with sketchUrl:', project.storyboard.scenes.filter(s => s.sketchUrl).length);

    let scenesToProcess;
    if (sceneIds && sceneIds.length > 0) {
      // Regenerate specific scenes by ID
      scenesToProcess = project.storyboard.scenes.filter(s => sceneIds.includes(s.id));
    } else if (regenerateAll) {
      scenesToProcess = project.storyboard.scenes;
    } else {
      scenesToProcess = project.storyboard.scenes.filter(s => !s.sketchUrl);
    }

    console.log('[Sketches API] Scenes to process:', scenesToProcess.length);

    if (scenesToProcess.length === 0) {
      return NextResponse.json({
        message: 'All scenes already have sketches',
        sketchesGenerated: 0,
      });
    }

    console.log('[Sketches API] ComfyUI config:', {
      url: comfyConfig.serverUrl,
      promptNodeId: comfyConfig.promptNodeId,
      workflowLength: comfyConfig.workflow.length,
    });

    // Generate sketches using ComfyUI
    const sketchResults = await generateSketchesForScenes(
      comfyConfig,
      id,
      scenesToProcess.map(s => ({
        order: s.order,
        visualDescription: s.visualDescription,
        shotType: s.shotType,
      })),
      projectDir,
      1, // Process 1 at a time for ComfyUI
      settings.prompts?.sketchPrompt // Custom sketch prompt template
    );

    // Update scenes with sketch URLs
    const updatedScenes = project.storyboard.scenes.map(scene => {
      const sketchUrl = sketchResults.get(scene.order);
      if (sketchUrl) {
        return { ...scene, sketchUrl };
      }
      return scene;
    });

    // Save updated storyboard
    await updateProject(id, {
      storyboard: {
        ...project.storyboard,
        scenes: updatedScenes,
      },
    });

    return NextResponse.json({
      message: `Generated ${sketchResults.size} sketches`,
      sketchesGenerated: sketchResults.size,
      storyboard: {
        ...project.storyboard,
        scenes: updatedScenes,
      },
    });
  } catch (error) {
    console.error('Error generating sketches:', error);
    return NextResponse.json(
      { error: 'Failed to generate sketches' },
      { status: 500 }
    );
  }
}
