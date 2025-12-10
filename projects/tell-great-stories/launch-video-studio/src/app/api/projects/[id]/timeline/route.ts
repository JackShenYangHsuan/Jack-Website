import { NextResponse } from 'next/server';
import { loadProject, updateProject } from '@/lib/storage';
import type { TimelineData, TimelineClip, TransitionType, ClipSpeed } from '@/types/project';

/**
 * GET /api/projects/[id]/timeline
 * Get timeline data for a project
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
      timeline: project.timeline || { clips: [], totalDuration: 0, isFinalized: false },
    });
  } catch (error) {
    console.error('Error loading timeline:', error);
    return NextResponse.json(
      { error: 'Failed to load timeline' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/timeline
 * Initialize timeline from approved video clips
 */
export async function POST(
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

    if (!project.storyboard || project.storyboard.scenes.length === 0) {
      return NextResponse.json(
        { error: 'No storyboard scenes available' },
        { status: 400 }
      );
    }

    if (!project.videoClips || project.videoClips.clips.length === 0) {
      return NextResponse.json(
        { error: 'No video clips available' },
        { status: 400 }
      );
    }

    // Build timeline from approved video clips
    const timelineClips: TimelineClip[] = [];
    let currentTime = 0;

    // Process scenes in order
    for (const scene of project.storyboard.scenes) {
      // Find the approved video clip for this scene
      const approvedClip = project.videoClips.clips.find(
        (clip) => clip.sceneId === scene.id && clip.isApproved && clip.status === 'completed'
      );

      if (!approvedClip) {
        continue; // Skip scenes without approved clips
      }

      const timelineClip: TimelineClip = {
        id: crypto.randomUUID(),
        videoClipId: approvedClip.id,
        sceneId: scene.id,
        sceneOrder: scene.order,
        startTime: currentTime,
        duration: approvedClip.duration,
        transition: scene.transition,
        transitionDuration: 0.5, // Default transition duration
        trimStart: 0,
        trimEnd: 0,
      };

      timelineClips.push(timelineClip);
      currentTime += approvedClip.duration;
    }

    const totalDuration = timelineClips.reduce(
      (sum, clip) => sum + clip.duration - clip.trimStart - clip.trimEnd,
      0
    );

    const timeline: TimelineData = {
      clips: timelineClips,
      totalDuration,
      isFinalized: false,
      lastModifiedAt: new Date().toISOString(),
    };

    await updateProject(id, { timeline });

    return NextResponse.json({
      message: `Timeline created with ${timelineClips.length} clips`,
      timeline,
    });
  } catch (error) {
    console.error('Error creating timeline:', error);
    return NextResponse.json(
      { error: 'Failed to create timeline' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/timeline
 * Update timeline (reorder clips, update transitions, trim, finalize)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      action: 'reorder' | 'update-clip' | 'update-transition' | 'update-speed' | 'finalize';
      clipId?: string;
      newOrder?: string[];
      updates?: Partial<TimelineClip>;
      transition?: TransitionType;
      transitionDuration?: number;
      speed?: ClipSpeed;
    };

    const { action, clipId, newOrder, updates, transition, transitionDuration, speed } = body;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (!project.timeline) {
      return NextResponse.json(
        { error: 'Timeline not initialized. Create timeline first.' },
        { status: 400 }
      );
    }

    let updatedTimeline: TimelineData = { ...project.timeline };

    switch (action) {
      case 'reorder': {
        if (!newOrder || newOrder.length !== updatedTimeline.clips.length) {
          return NextResponse.json(
            { error: 'Invalid order array' },
            { status: 400 }
          );
        }

        // Reorder clips based on newOrder array (array of clip IDs in new order)
        const clipMap = new Map(updatedTimeline.clips.map((c) => [c.id, c]));
        const reorderedClips: TimelineClip[] = [];
        let currentTime = 0;

        for (const clipId of newOrder) {
          const clip = clipMap.get(clipId);
          if (clip) {
            reorderedClips.push({
              ...clip,
              startTime: currentTime,
            });
            currentTime += clip.duration - clip.trimStart - clip.trimEnd;
          }
        }

        updatedTimeline.clips = reorderedClips;
        break;
      }

      case 'update-clip': {
        if (!clipId || !updates) {
          return NextResponse.json(
            { error: 'clipId and updates required' },
            { status: 400 }
          );
        }

        const clipIndex = updatedTimeline.clips.findIndex((c) => c.id === clipId);
        if (clipIndex === -1) {
          return NextResponse.json(
            { error: 'Clip not found' },
            { status: 404 }
          );
        }

        updatedTimeline.clips[clipIndex] = {
          ...updatedTimeline.clips[clipIndex],
          ...updates,
        };

        // Recalculate start times
        let currentTime = 0;
        for (const clip of updatedTimeline.clips) {
          clip.startTime = currentTime;
          currentTime += clip.duration - clip.trimStart - clip.trimEnd;
        }
        break;
      }

      case 'update-transition': {
        if (!clipId) {
          return NextResponse.json(
            { error: 'clipId required' },
            { status: 400 }
          );
        }

        const clipIndex = updatedTimeline.clips.findIndex((c) => c.id === clipId);
        if (clipIndex === -1) {
          return NextResponse.json(
            { error: 'Clip not found' },
            { status: 404 }
          );
        }

        if (transition) {
          updatedTimeline.clips[clipIndex].transition = transition;
        }
        if (transitionDuration !== undefined) {
          updatedTimeline.clips[clipIndex].transitionDuration = transitionDuration;
        }
        break;
      }

      case 'update-speed': {
        if (!clipId || speed === undefined) {
          return NextResponse.json(
            { error: 'clipId and speed required' },
            { status: 400 }
          );
        }

        // Validate speed value
        const validSpeeds: ClipSpeed[] = [1, 1.2, 1.5, 2];
        if (!validSpeeds.includes(speed)) {
          return NextResponse.json(
            { error: 'Invalid speed value. Must be 1, 1.2, 1.5, or 2' },
            { status: 400 }
          );
        }

        const clipIndex = updatedTimeline.clips.findIndex((c) => c.id === clipId);
        if (clipIndex === -1) {
          return NextResponse.json(
            { error: 'Clip not found' },
            { status: 404 }
          );
        }

        updatedTimeline.clips[clipIndex].speed = speed;
        break;
      }

      case 'finalize': {
        updatedTimeline.isFinalized = true;
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Recalculate total duration
    updatedTimeline.totalDuration = updatedTimeline.clips.reduce(
      (sum, clip) => sum + clip.duration - clip.trimStart - clip.trimEnd,
      0
    );
    updatedTimeline.lastModifiedAt = new Date().toISOString();

    await updateProject(id, { timeline: updatedTimeline });

    return NextResponse.json({ timeline: updatedTimeline });
  } catch (error) {
    console.error('Error updating timeline:', error);
    return NextResponse.json(
      { error: 'Failed to update timeline' },
      { status: 500 }
    );
  }
}
