import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { loadProject, updateProject, getProjectDir } from '@/lib/storage';
import type { AudioData, MusicTrack } from '@/types/project';

/**
 * POST /api/projects/[id]/audio/upload
 * Upload a music file for the project
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: MP3, WAV, OGG, M4A, AAC' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // Create audio directory if it doesn't exist
    const projectDir = getProjectDir(id);
    const audioDir = path.join(projectDir, 'assets', 'audio');
    await fs.mkdir(audioDir, { recursive: true });

    // Generate unique filename
    const trackId = crypto.randomUUID();
    const ext = path.extname(file.name) || '.mp3';
    const filename = `music-uploaded-${trackId}${ext}`;
    const filePath = path.join(audioDir, filename);

    // Save the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    // Create music track entry
    const audioUrl = `/api/projects/${id}/assets/audio/${filename}`;
    const newTrack: MusicTrack = {
      id: trackId,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension from display name
      audioUrl,
      duration: 0, // Will be set by client after loading
      volume: 1.0,
      startTime: 0,
      clipStart: 0, // Where to start playing in the music file (for clip selection)
      loop: false,
      fadeIn: 0,
      fadeOut: 0,
      source: 'uploaded',
    };

    // Update project audio data
    const currentAudio: AudioData = project.audio || {
      voiceovers: [],
      musicTracks: [],
      voiceoverVolume: 1.0,
      musicVolume: 0.3,
      isFinalized: false,
    };

    currentAudio.musicTracks.push(newTrack);
    currentAudio.lastModifiedAt = new Date().toISOString();

    await updateProject(id, { audio: currentAudio });

    return NextResponse.json({
      message: 'Music uploaded successfully',
      track: newTrack,
      audio: currentAudio,
    });
  } catch (error) {
    console.error('Error uploading music:', error);
    return NextResponse.json(
      { error: 'Failed to upload music' },
      { status: 500 }
    );
  }
}
