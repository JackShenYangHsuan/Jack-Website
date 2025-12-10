import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { loadProject, updateProject, getProjectDir, loadSettings } from '@/lib/storage';
import type { MusicTrack, AudioData } from '@/types/project';

/**
 * Suno API response types
 */
interface SunoGenerateResponse {
  code: number;
  msg: string;
  data?: {
    task_id: string;
  };
}

interface SunoTaskResponse {
  code: number;
  msg: string;
  data?: {
    status: 'pending' | 'processing' | 'complete' | 'error';
    clips?: Array<{
      id: string;
      audio_url: string;
      title: string;
      duration: number;
    }>;
    error_message?: string;
  };
}

/**
 * Generate music using Suno API
 */
async function generateMusicWithSuno(
  apiKey: string,
  apiUrl: string,
  prompt: string,
  model: string,
  instrumental: boolean = true
): Promise<{ taskId: string }> {
  const response = await fetch(`${apiUrl}/api/v1/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      model,
      make_instrumental: instrumental,
      wait_audio: false, // We'll poll for completion
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Suno API error: ${response.status} - ${error}`);
  }

  const result = await response.json() as SunoGenerateResponse;

  if (result.code !== 0 || !result.data?.task_id) {
    throw new Error(result.msg || 'Failed to start music generation');
  }

  return { taskId: result.data.task_id };
}

/**
 * Check the status of a music generation task
 */
async function checkMusicStatus(
  apiKey: string,
  apiUrl: string,
  taskId: string
): Promise<SunoTaskResponse['data']> {
  const response = await fetch(`${apiUrl}/api/v1/generate/record-info?task_id=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Suno API error: ${response.status} - ${error}`);
  }

  const result = await response.json() as SunoTaskResponse;

  if (result.code !== 0) {
    throw new Error(result.msg || 'Failed to check music status');
  }

  return result.data;
}

/**
 * Download audio file from URL
 */
async function downloadAudioFile(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status}`);
  }
  return response.arrayBuffer();
}

/**
 * POST /api/projects/[id]/audio/music
 * Generate background music using Suno AI
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as {
      prompt?: string;
      mood?: string;
      style?: string;
      instrumental?: boolean;
    };

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const settings = await loadSettings();
    if (!settings.sunoApiKey) {
      return NextResponse.json(
        { error: 'Suno API key not configured in settings' },
        { status: 400 }
      );
    }

    const apiUrl = settings.sunoApiUrl || 'https://api.sunoapi.org';
    const model = settings.sunoModel || 'chirp-v4';

    // Build the music prompt from project context
    let musicPrompt = body.prompt;

    if (!musicPrompt) {
      // Generate prompt from project story brief and style
      const storyBrief = project.storyBrief;
      const mood = body.mood || storyBrief?.toneNotes?.[0] || 'inspiring';
      const style = body.style || 'cinematic background music';

      musicPrompt = `${style}, ${mood}, suitable for a tech startup launch video`;

      if (storyBrief?.emotionalStakes) {
        musicPrompt += `, emotional undertone of ${storyBrief.emotionalStakes.substring(0, 50)}`;
      }
    }

    // Start music generation
    const { taskId } = await generateMusicWithSuno(
      settings.sunoApiKey,
      apiUrl,
      musicPrompt,
      model,
      body.instrumental !== false // Default to instrumental
    );

    // Store the task ID for polling
    const currentAudio: AudioData = project.audio || {
      voiceovers: [],
      musicTracks: [],
      voiceoverVolume: 1.0,
      musicVolume: 0.3,
      isFinalized: false,
    };

    // Add a pending music track
    const pendingTrack: MusicTrack = {
      id: crypto.randomUUID(),
      name: 'Generating...',
      audioUrl: '',
      duration: 0,
      volume: 1.0,
      startTime: 0,
      clipStart: 0,
      loop: true,
      fadeIn: 2,
      fadeOut: 2,
      source: 'generated',
    };

    // Store task info in track metadata (using name field temporarily)
    (pendingTrack as MusicTrack & { _taskId?: string; _status?: string })._taskId = taskId;
    (pendingTrack as MusicTrack & { _taskId?: string; _status?: string })._status = 'pending';

    currentAudio.musicTracks.push(pendingTrack);
    currentAudio.lastModifiedAt = new Date().toISOString();

    await updateProject(id, { audio: currentAudio });

    return NextResponse.json({
      message: 'Music generation started',
      taskId,
      trackId: pendingTrack.id,
      prompt: musicPrompt,
    });
  } catch (error) {
    console.error('Error generating music:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate music' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/audio/music?taskId=xxx&trackId=xxx
 * Check music generation status and download when complete
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const trackId = searchParams.get('trackId');

    if (!taskId || !trackId) {
      return NextResponse.json(
        { error: 'taskId and trackId are required' },
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

    const settings = await loadSettings();
    if (!settings.sunoApiKey) {
      return NextResponse.json(
        { error: 'Suno API key not configured' },
        { status: 400 }
      );
    }

    const apiUrl = settings.sunoApiUrl || 'https://api.sunoapi.org';

    // Check task status
    const status = await checkMusicStatus(settings.sunoApiKey, apiUrl, taskId);

    if (!status) {
      return NextResponse.json({ status: 'pending' });
    }

    if (status.status === 'error') {
      return NextResponse.json({
        status: 'error',
        error: status.error_message || 'Music generation failed',
      });
    }

    if (status.status !== 'complete' || !status.clips || status.clips.length === 0) {
      return NextResponse.json({ status: status.status || 'pending' });
    }

    // Music is ready - download and save
    const clip = status.clips[0];
    const audioBuffer = await downloadAudioFile(clip.audio_url);

    // Save to project assets
    const projectDir = getProjectDir(id);
    const audioDir = path.join(projectDir, 'assets', 'audio');
    await fs.mkdir(audioDir, { recursive: true });

    const filename = `music-${trackId}.mp3`;
    const audioPath = path.join(audioDir, filename);
    await fs.writeFile(audioPath, Buffer.from(audioBuffer));

    // Update the music track
    const currentAudio = project.audio;
    if (currentAudio) {
      const trackIndex = currentAudio.musicTracks.findIndex(t => t.id === trackId);
      if (trackIndex !== -1) {
        currentAudio.musicTracks[trackIndex] = {
          ...currentAudio.musicTracks[trackIndex],
          name: clip.title || 'Generated Music',
          audioUrl: `/api/projects/${id}/assets/audio/${filename}`,
          duration: clip.duration || 60,
        };
        currentAudio.lastModifiedAt = new Date().toISOString();
        await updateProject(id, { audio: currentAudio });
      }
    }

    return NextResponse.json({
      status: 'complete',
      track: {
        id: trackId,
        name: clip.title || 'Generated Music',
        audioUrl: `/api/projects/${id}/assets/audio/${filename}`,
        duration: clip.duration || 60,
      },
    });
  } catch (error) {
    console.error('Error checking music status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check music status' },
      { status: 500 }
    );
  }
}
