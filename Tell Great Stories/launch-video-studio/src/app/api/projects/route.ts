import { NextResponse } from 'next/server';
import { listProjects, createProject, deleteProject } from '@/lib/storage';
import type { CreateProjectInput } from '@/types/project';

/**
 * GET /api/projects
 * List all projects
 */
export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error listing projects:', error);
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateProjectInput;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    if (!body.tagline?.trim()) {
      return NextResponse.json(
        { error: 'Tagline is required' },
        { status: 400 }
      );
    }

    const project = await createProject({
      name: body.name.trim(),
      tagline: body.tagline.trim(),
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects?id=xxx
 * Delete a project
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    await deleteProject(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
