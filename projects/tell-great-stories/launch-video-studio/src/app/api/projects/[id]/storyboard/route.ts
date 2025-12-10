import { NextResponse } from 'next/server';
import { loadProject, updateProject } from '@/lib/storage';
import { DEFAULT_STORYBOARD, type Storyboard } from '@/types/project';

/**
 * GET /api/projects/[id]/storyboard
 * Get project storyboard
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
      storyboard: project.storyboard || DEFAULT_STORYBOARD,
    });
  } catch (error) {
    console.error('Error loading storyboard:', error);
    return NextResponse.json(
      { error: 'Failed to load storyboard' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/storyboard
 * Update project storyboard
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json() as Partial<Storyboard>;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Merge updates with existing storyboard
    const currentStoryboard = project.storyboard || DEFAULT_STORYBOARD;
    const updatedStoryboard: Storyboard = {
      ...currentStoryboard,
      ...updates,
    };

    await updateProject(id, { storyboard: updatedStoryboard });

    return NextResponse.json({
      storyboard: updatedStoryboard,
      message: 'Storyboard updated successfully',
    });
  } catch (error) {
    console.error('Error updating storyboard:', error);
    return NextResponse.json(
      { error: 'Failed to update storyboard' },
      { status: 500 }
    );
  }
}
