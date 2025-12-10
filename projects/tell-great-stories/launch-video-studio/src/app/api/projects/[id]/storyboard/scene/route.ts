import { NextResponse } from 'next/server';
import { loadProject, updateProject } from '@/lib/storage';
import type { StoryboardScene } from '@/types/project';

/**
 * PATCH /api/projects/[id]/storyboard/scene
 * Update a specific scene in the storyboard
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      sceneId: string;
      updates: Partial<StoryboardScene>;
    };

    const { sceneId, updates } = body;

    if (!sceneId) {
      return NextResponse.json(
        { error: 'Scene ID is required' },
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

    if (!project.storyboard) {
      return NextResponse.json(
        { error: 'Project has no storyboard' },
        { status: 400 }
      );
    }

    // Find and update the scene
    const sceneIndex = project.storyboard.scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Update the scene with new values
    const updatedScenes = [...project.storyboard.scenes];
    updatedScenes[sceneIndex] = {
      ...updatedScenes[sceneIndex],
      ...updates,
    };

    const updatedStoryboard = {
      ...project.storyboard,
      scenes: updatedScenes,
    };

    await updateProject(id, { storyboard: updatedStoryboard });

    return NextResponse.json({
      scene: updatedScenes[sceneIndex],
      message: 'Scene updated successfully',
    });
  } catch (error) {
    console.error('Error updating scene:', error);
    return NextResponse.json(
      { error: 'Failed to update scene' },
      { status: 500 }
    );
  }
}
