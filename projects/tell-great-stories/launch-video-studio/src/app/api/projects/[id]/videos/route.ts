import { NextResponse } from 'next/server';
import { loadProject, updateProject } from '@/lib/storage';
import type { VideoClipsData } from '@/types/project';

/**
 * GET /api/projects/[id]/videos
 * Get video clips data for a project
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
      videoClips: project.videoClips || { clips: [] },
    });
  } catch (error) {
    console.error('Error loading video clips:', error);
    return NextResponse.json(
      { error: 'Failed to load video clips' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/videos
 * Update a video clip (approve, delete, etc.)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      clipId: string;
      action: 'approve' | 'delete';
    };

    const { clipId, action } = body;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.videoClips) {
      return NextResponse.json(
        { error: 'No video clips found' },
        { status: 400 }
      );
    }

    const currentClips: VideoClipsData = project.videoClips;

    if (action === 'approve') {
      // Find the clip to approve
      const clipIndex = currentClips.clips.findIndex(c => c.id === clipId);
      if (clipIndex === -1) {
        return NextResponse.json(
          { error: 'Video clip not found' },
          { status: 404 }
        );
      }

      const clip = currentClips.clips[clipIndex];

      // Un-approve other clips for the same scene
      const updatedClips = currentClips.clips.map(c => {
        if (c.sceneId === clip.sceneId) {
          return { ...c, isApproved: c.id === clipId };
        }
        return c;
      });

      const updatedData: VideoClipsData = {
        ...currentClips,
        clips: updatedClips,
      };

      await updateProject(id, { videoClips: updatedData });

      return NextResponse.json({ videoClips: updatedData });
    }

    if (action === 'delete') {
      const updatedClips = currentClips.clips.filter(c => c.id !== clipId);
      const updatedData: VideoClipsData = {
        ...currentClips,
        clips: updatedClips,
      };

      await updateProject(id, { videoClips: updatedData });

      return NextResponse.json({ videoClips: updatedData });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating video clip:', error);
    return NextResponse.json(
      { error: 'Failed to update video clip' },
      { status: 500 }
    );
  }
}
