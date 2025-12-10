import { NextResponse } from 'next/server';
import { loadProject, updateProject, getProjectDir } from '@/lib/storage';
import type { ExportData } from '@/types/project';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';

/**
 * Resolution dimensions
 */
const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
};

/**
 * Run FFmpeg command and return a promise
 */
function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('[Export] Running FFmpeg:', 'ffmpeg', args.join(' '));
    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error('[Export] FFmpeg error:', stderr);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * GET /api/projects/[id]/export
 * Get export status
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await loadProject(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      exportData: project.exportData,
      progress: project.exportData?.progress || 0,
    });
  } catch (error) {
    console.error('Error getting export status:', error);
    return NextResponse.json(
      { error: 'Failed to get export status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/export
 * Start video export using FFmpeg
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      includeMusic?: boolean;
      resolution?: '720p' | '1080p' | '4k';
    };

    const { includeMusic = true, resolution = '1080p' } = body;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.timeline || project.timeline.clips.length === 0) {
      return NextResponse.json(
        { error: 'No timeline clips to export' },
        { status: 400 }
      );
    }

    if (!project.videoClips || project.videoClips.clips.length === 0) {
      return NextResponse.json(
        { error: 'No video clips available' },
        { status: 400 }
      );
    }

    const projectDir = getProjectDir(id);
    const exportDir = path.join(projectDir, 'assets', 'exports');
    const tempDir = path.join(projectDir, 'temp');

    // Create export directories
    await fs.mkdir(exportDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });

    // Set initial export status
    const initialExportData: ExportData = {
      status: 'exporting',
      progress: 0,
      settings: {
        includeMusic,
        musicVolume: project.audio?.musicVolume || 0.5,
        resolution,
        format: 'mp4',
      },
    };

    await updateProject(id, { exportData: initialExportData });

    // Start export process in background
    exportVideo(id, project, projectDir, exportDir, tempDir, includeMusic, resolution).catch(
      async (error) => {
        console.error('[Export] Export failed:', error);
        await updateProject(id, {
          exportData: {
            ...initialExportData,
            status: 'failed',
            error: error.message || 'Export failed',
          },
        });
      }
    );

    return NextResponse.json({
      message: 'Export started',
      exportData: initialExportData,
    });
  } catch (error) {
    console.error('Error starting export:', error);
    return NextResponse.json(
      { error: 'Failed to start export' },
      { status: 500 }
    );
  }
}

/**
 * Export video in background
 */
async function exportVideo(
  projectId: string,
  project: NonNullable<Awaited<ReturnType<typeof loadProject>>>,
  projectDir: string,
  exportDir: string,
  tempDir: string,
  includeMusic: boolean,
  resolution: '720p' | '1080p' | '4k'
) {
  const timeline = project.timeline!;
  const videoClips = project.videoClips!;
  const resolutionDims = RESOLUTION_MAP[resolution];

  // Helper to update progress
  async function updateProgress(progress: number, status: ExportData['status'] = 'exporting') {
    const currentProject = await loadProject(projectId);
    if (currentProject?.exportData) {
      await updateProject(projectId, {
        exportData: {
          ...currentProject.exportData,
          progress,
          status,
        },
      });
    }
  }

  try {
    console.log(`[Export] Starting export for project ${projectId}`);
    console.log(`[Export] Timeline has ${timeline.clips.length} clips`);

    // Step 1: Create normalized clips (10%)
    await updateProgress(5);

    const normalizedClips: string[] = [];

    for (let i = 0; i < timeline.clips.length; i++) {
      const timelineClip = timeline.clips[i];
      const videoClip = videoClips.clips.find((c) => c.id === timelineClip.videoClipId);

      if (!videoClip) {
        console.warn(`[Export] Video clip not found for timeline clip ${timelineClip.id}`);
        continue;
      }

      // Get the video file path from the URL
      const videoPath = path.join(
        projectDir,
        'assets',
        'videos',
        path.basename(videoClip.videoUrl)
      );

      // Check if file exists
      try {
        await fs.access(videoPath);
      } catch {
        console.warn(`[Export] Video file not found: ${videoPath}`);
        continue;
      }

      const normalizedPath = path.join(tempDir, `clip_${i.toString().padStart(3, '0')}.mp4`);

      // Get clip speed (default to 1x)
      const speed = timelineClip.speed || 1;
      const speedFilter = speed !== 1 ? `setpts=${1/speed}*PTS,` : '';

      // Normalize clip: scale to target resolution, set fps, add audio track if missing
      await runFFmpeg([
        '-y',
        '-i', videoPath,
        '-vf', `${speedFilter}scale=${resolutionDims.width}:${resolutionDims.height}:force_original_aspect_ratio=decrease,pad=${resolutionDims.width}:${resolutionDims.height}:(ow-iw)/2:(oh-ih)/2,fps=30`,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-an', // Remove audio for now, we'll add music later
        normalizedPath,
      ]);

      normalizedClips.push(normalizedPath);

      // Update progress (5-40%)
      const clipProgress = 5 + ((i + 1) / timeline.clips.length) * 35;
      await updateProgress(Math.round(clipProgress));
    }

    if (normalizedClips.length === 0) {
      throw new Error('No clips could be processed');
    }

    console.log(`[Export] Normalized ${normalizedClips.length} clips`);

    // Step 2: Create concat file (40%)
    await updateProgress(40);

    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = normalizedClips.map((p) => `file '${p}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);

    // Step 3: Concatenate clips (40-70%)
    await updateProgress(45);

    const concatenatedPath = path.join(tempDir, 'concatenated.mp4');
    await runFFmpeg([
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy',
      concatenatedPath,
    ]);

    console.log('[Export] Concatenated clips');
    await updateProgress(70);

    // Step 4: Add music if requested (70-90%)
    const outputFilename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp4`;
    const outputPath = path.join(exportDir, outputFilename);

    if (includeMusic && project.audio?.musicTracks?.length) {
      const musicTrack = project.audio.musicTracks[0];
      const musicPath = path.join(
        projectDir,
        'assets',
        'audio',
        path.basename(musicTrack.audioUrl)
      );

      try {
        await fs.access(musicPath);

        const musicVolume = project.audio.musicVolume || 0.5;

        await runFFmpeg([
          '-y',
          '-i', concatenatedPath,
          '-i', musicPath,
          '-filter_complex', `[1:a]volume=${musicVolume}[a1];[a1]aloop=loop=-1:size=2e+09,apad[music];[music]atrim=0:${timeline.totalDuration}[musicout]`,
          '-map', '0:v',
          '-map', '[musicout]',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-shortest',
          outputPath,
        ]);

        console.log('[Export] Added music track');
      } catch (err) {
        console.warn('[Export] Could not add music:', err);
        // Just copy the concatenated file
        await fs.copyFile(concatenatedPath, outputPath);
      }
    } else {
      // No music, just copy the concatenated file
      await fs.copyFile(concatenatedPath, outputPath);
    }

    await updateProgress(90);

    // Step 5: Clean up temp files (90-95%)
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.warn('[Export] Could not clean temp files:', err);
    }

    await updateProgress(95);

    // Step 6: Update project with completed export (100%)
    const exportUrl = `/api/projects/${projectId}/assets/exports/${outputFilename}`;

    const finalExportData: ExportData = {
      status: 'completed',
      progress: 100,
      exportedVideoUrl: exportUrl,
      exportedAt: new Date().toISOString(),
      settings: {
        includeMusic,
        musicVolume: project.audio?.musicVolume || 0.5,
        resolution,
        format: 'mp4',
      },
    };

    await updateProject(projectId, { exportData: finalExportData });

    console.log(`[Export] Export completed: ${outputPath}`);
  } catch (error) {
    console.error('[Export] Export failed:', error);
    throw error;
  }
}
