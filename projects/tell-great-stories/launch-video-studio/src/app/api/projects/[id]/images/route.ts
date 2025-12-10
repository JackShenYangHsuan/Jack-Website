import { NextResponse } from 'next/server';
import { loadProject, updateProject } from '@/lib/storage';
import type { KeyframesData, KeyframeImage } from '@/types/project';

/**
 * GET /api/projects/[id]/images
 * Get keyframes data for a project
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      keyframes: project.keyframes || { images: [] },
      storyboard: project.storyboard,
    });
  } catch (error) {
    console.error('Error loading keyframes:', error);
    return NextResponse.json(
      { error: 'Failed to load keyframes' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/images
 * Update keyframes data (approve/unapprove images)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      imageId?: string;
      action?: 'approve' | 'unapprove' | 'delete';
    };

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.keyframes) {
      return NextResponse.json(
        { error: 'No keyframes data' },
        { status: 400 }
      );
    }

    const { imageId, action } = body;
    if (!imageId || !action) {
      return NextResponse.json(
        { error: 'imageId and action required' },
        { status: 400 }
      );
    }

    let updatedImages = [...project.keyframes.images];

    if (action === 'approve') {
      // Find the image and its scene
      const image = updatedImages.find(img => img.id === imageId);
      if (image) {
        // Unapprove all other images for this scene, approve this one
        updatedImages = updatedImages.map(img => ({
          ...img,
          isApproved: img.id === imageId ? true : (img.sceneId === image.sceneId ? false : img.isApproved),
        }));
      }
    } else if (action === 'unapprove') {
      updatedImages = updatedImages.map(img =>
        img.id === imageId ? { ...img, isApproved: false } : img
      );
    } else if (action === 'delete') {
      updatedImages = updatedImages.filter(img => img.id !== imageId);
    }

    const updatedKeyframes: KeyframesData = {
      ...project.keyframes,
      images: updatedImages,
    };

    await updateProject(id, { keyframes: updatedKeyframes });

    return NextResponse.json({
      keyframes: updatedKeyframes,
      message: 'Keyframes updated',
    });
  } catch (error) {
    console.error('Error updating keyframes:', error);
    return NextResponse.json(
      { error: 'Failed to update keyframes' },
      { status: 500 }
    );
  }
}
