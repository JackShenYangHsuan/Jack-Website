import { NextResponse } from 'next/server';
import { loadProject, updateProject } from '@/lib/storage';
import { DEFAULT_STYLE_GUIDE, type StyleGuide } from '@/types/project';

/**
 * GET /api/projects/[id]/style
 * Get the style guide for a project
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

    // Return existing style guide or default
    const styleGuide = project.styleGuide || DEFAULT_STYLE_GUIDE;

    return NextResponse.json({ styleGuide });
  } catch (error) {
    console.error('Error loading style guide:', error);
    return NextResponse.json(
      { error: 'Failed to load style guide' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/style
 * Update the style guide for a project
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<StyleGuide>;

    const project = await loadProject(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Merge with existing style guide or default
    const currentStyleGuide = project.styleGuide || DEFAULT_STYLE_GUIDE;
    const updatedStyleGuide: StyleGuide = {
      ...currentStyleGuide,
      ...body,
      // Preserve referenceVideos unless explicitly provided
      referenceVideos: body.referenceVideos ?? currentStyleGuide.referenceVideos,
    };

    // Update project with new style guide
    const updatedProject = await updateProject(id, {
      styleGuide: updatedStyleGuide,
    });

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ styleGuide: updatedStyleGuide });
  } catch (error) {
    console.error('Error updating style guide:', error);
    return NextResponse.json(
      { error: 'Failed to update style guide' },
      { status: 500 }
    );
  }
}
