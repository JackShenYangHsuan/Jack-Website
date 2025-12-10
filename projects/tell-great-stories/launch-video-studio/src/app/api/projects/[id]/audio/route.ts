import { NextResponse } from 'next/server';
import { loadProject, updateProject } from '@/lib/storage';
import type { AudioData, VoiceoverClip, MusicTrack } from '@/types/project';

/**
 * GET /api/projects/[id]/audio
 * Get audio data for a project
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
      audio: project.audio || {
        voiceovers: [],
        musicTracks: [],
        voiceoverVolume: 1.0,
        musicVolume: 0.3,
        isFinalized: false,
      },
    });
  } catch (error) {
    console.error('Error loading audio:', error);
    return NextResponse.json(
      { error: 'Failed to load audio' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/audio
 * Initialize audio data from storyboard scenes
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

    if (!project.timeline || !project.timeline.isFinalized) {
      return NextResponse.json(
        { error: 'Timeline must be finalized before adding audio' },
        { status: 400 }
      );
    }

    // Create voiceover clips from storyboard scenes
    const voiceovers: VoiceoverClip[] = project.storyboard.scenes.map((scene) => ({
      id: crypto.randomUUID(),
      sceneId: scene.id,
      sceneOrder: scene.order,
      text: scene.voiceover,
      audioUrl: '',
      duration: 0,
      status: 'pending',
    }));

    const audio: AudioData = {
      voiceovers,
      musicTracks: [],
      voiceoverVolume: 1.0,
      musicVolume: 0.3,
      isFinalized: false,
      lastModifiedAt: new Date().toISOString(),
    };

    await updateProject(id, { audio });

    return NextResponse.json({
      message: `Audio initialized with ${voiceovers.length} voiceover clips`,
      audio,
    });
  } catch (error) {
    console.error('Error initializing audio:', error);
    return NextResponse.json(
      { error: 'Failed to initialize audio' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/audio
 * Update audio settings (volumes, music tracks, finalize)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      action: 'update-volume' | 'add-music' | 'remove-music' | 'update-music' | 'update-voiceover' | 'finalize';
      voiceoverVolume?: number;
      musicVolume?: number;
      musicTrack?: Partial<MusicTrack>;
      trackId?: string;
      voiceoverId?: string;
      voiceoverUpdates?: Partial<VoiceoverClip>;
    };

    const { action, voiceoverVolume, musicVolume, musicTrack, trackId, voiceoverId, voiceoverUpdates } = body;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Initialize audio with defaults if it doesn't exist
    const currentAudio: AudioData = project.audio || {
      voiceovers: [],
      musicTracks: [],
      voiceoverVolume: 1.0,
      musicVolume: 0.3,
      isFinalized: false,
    };

    const updatedAudio: AudioData = { ...currentAudio };

    switch (action) {
      case 'update-volume': {
        if (voiceoverVolume !== undefined) {
          updatedAudio.voiceoverVolume = Math.max(0, Math.min(1, voiceoverVolume));
        }
        if (musicVolume !== undefined) {
          updatedAudio.musicVolume = Math.max(0, Math.min(1, musicVolume));
        }
        break;
      }

      case 'add-music': {
        if (!musicTrack || !musicTrack.name || !musicTrack.audioUrl) {
          return NextResponse.json(
            { error: 'Music track name and audioUrl required' },
            { status: 400 }
          );
        }

        const newTrack: MusicTrack = {
          id: crypto.randomUUID(),
          name: musicTrack.name,
          audioUrl: musicTrack.audioUrl,
          duration: musicTrack.duration || 0,
          volume: musicTrack.volume ?? 1.0,
          startTime: musicTrack.startTime || 0,
          clipStart: musicTrack.clipStart || 0,
          loop: musicTrack.loop ?? false,
          fadeIn: musicTrack.fadeIn || 0,
          fadeOut: musicTrack.fadeOut || 0,
          source: musicTrack.source || 'uploaded',
        };

        updatedAudio.musicTracks.push(newTrack);
        break;
      }

      case 'remove-music': {
        if (!trackId) {
          return NextResponse.json(
            { error: 'trackId required' },
            { status: 400 }
          );
        }

        updatedAudio.musicTracks = updatedAudio.musicTracks.filter(
          (track) => track.id !== trackId
        );
        break;
      }

      case 'update-music': {
        if (!trackId || !musicTrack) {
          return NextResponse.json(
            { error: 'trackId and musicTrack updates required' },
            { status: 400 }
          );
        }

        const trackIndex = updatedAudio.musicTracks.findIndex(
          (track) => track.id === trackId
        );
        if (trackIndex === -1) {
          return NextResponse.json(
            { error: 'Music track not found' },
            { status: 404 }
          );
        }

        updatedAudio.musicTracks[trackIndex] = {
          ...updatedAudio.musicTracks[trackIndex],
          ...musicTrack,
        };
        break;
      }

      case 'update-voiceover': {
        if (!voiceoverId || !voiceoverUpdates) {
          return NextResponse.json(
            { error: 'voiceoverId and voiceoverUpdates required' },
            { status: 400 }
          );
        }

        const voIndex = updatedAudio.voiceovers.findIndex(
          (vo) => vo.id === voiceoverId
        );
        if (voIndex === -1) {
          return NextResponse.json(
            { error: 'Voiceover not found' },
            { status: 404 }
          );
        }

        updatedAudio.voiceovers[voIndex] = {
          ...updatedAudio.voiceovers[voIndex],
          ...voiceoverUpdates,
        };
        break;
      }

      case 'finalize': {
        // Allow finalization regardless of voiceover status
        updatedAudio.isFinalized = true;
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    updatedAudio.lastModifiedAt = new Date().toISOString();
    await updateProject(id, { audio: updatedAudio });

    return NextResponse.json({ audio: updatedAudio });
  } catch (error) {
    console.error('Error updating audio:', error);
    return NextResponse.json(
      { error: 'Failed to update audio' },
      { status: 500 }
    );
  }
}
