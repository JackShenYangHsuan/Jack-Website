import { NextResponse } from 'next/server';
import { loadProject, updateProject, getProjectDir } from '@/lib/storage';
import { loadSettings } from '@/lib/storage';
import {
  generateVideoFromImage,
  downloadAndSaveVideo,
  type ComfyUIVideoConfig,
} from '@/lib/video-generation';
import type { VideoClipsData, VideoClip, StoryboardScene } from '@/types/project';
import path from 'path';
import fs from 'fs/promises';

/**
 * Build a motion prompt from scene data
 * Combines camera movement, visual description, and any custom video prompt
 */
function buildMotionPrompt(scene: StoryboardScene): string {
  const parts: string[] = [];

  // Camera movement description
  const movementDescriptions: Record<string, string> = {
    static: 'static shot, no camera movement',
    'pan-left': 'camera panning smoothly to the left',
    'pan-right': 'camera panning smoothly to the right',
    'tilt-up': 'camera tilting upward',
    'tilt-down': 'camera tilting downward',
    'zoom-in': 'slow zoom in',
    'zoom-out': 'slow zoom out',
    'dolly-in': 'camera moving forward',
    'dolly-out': 'camera moving backward',
    tracking: 'camera tracking the subject',
    crane: 'crane shot movement',
    handheld: 'subtle handheld movement',
  };

  const movement = movementDescriptions[scene.cameraMovement] || 'subtle movement';
  parts.push(movement);

  // Add visual description context
  if (scene.visualDescription) {
    const shortDesc = scene.visualDescription.slice(0, 100);
    parts.push(shortDesc);
  }

  // Append custom video prompt if provided (user's motion/animation instructions)
  if (scene.customVideoPrompt && scene.customVideoPrompt.trim()) {
    parts.push(scene.customVideoPrompt.trim());
  }

  return parts.join(', ');
}

/**
 * Get the local file path for a keyframe image from its API URL
 */
function getKeyframeLocalPath(projectId: string, apiUrl: string): string {
  // API URL format: /api/projects/{id}/assets/keyframes/{filename}
  const filename = apiUrl.split('/').pop() || '';
  return path.join(getProjectDir(projectId), 'assets', 'keyframes', filename);
}

/**
 * POST /api/projects/[id]/videos/generate
 * Generate video clips from keyframe images using ComfyUI
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      sceneIds?: string[]; // Generate for specific scenes, or all if not provided
      regenerate?: boolean; // Regenerate even if videos exist
    };

    const { sceneIds, regenerate = false } = body;

    const project = await loadProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.storyboard || project.storyboard.scenes.length === 0) {
      return NextResponse.json(
        { error: 'No storyboard scenes to generate videos for' },
        { status: 400 }
      );
    }

    if (!project.keyframes || project.keyframes.images.length === 0) {
      return NextResponse.json(
        { error: 'No keyframe images available. Generate images first.' },
        { status: 400 }
      );
    }

    // Load settings for ComfyUI config
    const settings = await loadSettings();
    if (!settings.comfyuiUrl) {
      return NextResponse.json(
        { error: 'ComfyUI URL not configured. Please set it in Settings.' },
        { status: 400 }
      );
    }
    if (!settings.comfyuiVideoWorkflow) {
      return NextResponse.json(
        { error: 'ComfyUI video workflow not configured. Please set it in Settings.' },
        { status: 400 }
      );
    }
    if (!settings.comfyuiVideoImageNodeId) {
      return NextResponse.json(
        { error: 'ComfyUI video image node ID not configured. Please set it in Settings.' },
        { status: 400 }
      );
    }

    const videoConfig: ComfyUIVideoConfig = {
      serverUrl: settings.comfyuiUrl,
      workflow: settings.comfyuiVideoWorkflow,
      imageNodeId: settings.comfyuiVideoImageNodeId,
      promptNodeId: settings.comfyuiVideoPromptNodeId,
      durationNodeId: settings.comfyuiVideoDurationNodeId,
      fps: settings.comfyuiVideoFps || 24,
      width: settings.comfyuiVideoWidth,
      height: settings.comfyuiVideoHeight,
      steps: settings.comfyuiVideoSteps,
      upscale: settings.comfyuiVideoUpscale,
      settingsNodeId: settings.comfyuiVideoSettingsNodeId,
      stepsNodeId: settings.comfyuiVideoStepsNodeId,
    };

    const projectDir = getProjectDir(id);
    const videosDir = path.join(projectDir, 'assets', 'videos');

    // Determine which scenes to process
    console.log(`[Videos API] Request body: sceneIds=${JSON.stringify(sceneIds)}, regenerate=${regenerate}`);
    console.log(`[Videos API] Total storyboard scenes: ${project.storyboard.scenes.length}`);

    let scenesToProcess = project.storyboard.scenes;
    if (sceneIds && sceneIds.length > 0) {
      scenesToProcess = scenesToProcess.filter((s) => sceneIds.includes(s.id));
      console.log(`[Videos API] After sceneIds filter: ${scenesToProcess.length} scenes (sceneIds: ${sceneIds.join(', ')})`);
    }

    // Filter to scenes that have approved keyframe images
    const beforeApprovedFilter = scenesToProcess.length;
    scenesToProcess = scenesToProcess.filter((scene) => {
      const approvedImage = project.keyframes!.images.find(
        (img) => img.sceneId === scene.id && img.isApproved
      );
      if (!approvedImage) {
        console.log(`[Videos API] Scene ${scene.id} (order ${scene.order}): NO approved image found`);
        // Log all images for this scene to debug
        const sceneImages = project.keyframes!.images.filter(img => img.sceneId === scene.id);
        console.log(`[Videos API] Scene ${scene.id} has ${sceneImages.length} images: ${JSON.stringify(sceneImages.map(i => ({ id: i.id, isApproved: i.isApproved })))}`);
      }
      return !!approvedImage;
    });
    console.log(`[Videos API] After approved image filter: ${scenesToProcess.length} scenes (was ${beforeApprovedFilter})`);

    // If not regenerating, filter out scenes that already have any completed videos
    if (!regenerate && project.videoClips) {
      const beforeVideoFilter = scenesToProcess.length;
      scenesToProcess = scenesToProcess.filter((scene) => {
        const hasCompletedVideo = project.videoClips!.clips.some(
          (clip) =>
            clip.sceneId === scene.id &&
            clip.status === 'completed'
        );
        return !hasCompletedVideo;
      });
      console.log(`[Videos API] After completed video filter (regenerate=${regenerate}): ${scenesToProcess.length} scenes (was ${beforeVideoFilter})`);
    } else {
      console.log(`[Videos API] Skipping completed video filter because regenerate=${regenerate}`);
    }

    if (scenesToProcess.length === 0) {
      console.log(`[Videos API] No scenes to process - returning early`);
      return NextResponse.json({
        message: 'All scenes already have videos or no approved images',
        videosGenerated: 0,
        videoClips: project.videoClips,
      });
    }

    console.log(`[Videos API] Proceeding with ${scenesToProcess.length} scenes: ${scenesToProcess.map(s => `${s.id} (order ${s.order})`).join(', ')}`)

    console.log(`[Videos API] Generating ${scenesToProcess.length} video clips`);

    // Current video clips or empty
    const currentClips: VideoClipsData = project.videoClips || { clips: [] };
    const newClips: VideoClip[] = [];

    // Generate videos one at a time (video generation is resource-intensive)
    for (const scene of scenesToProcess) {
      try {
        // Find the approved keyframe image for this scene
        const approvedImage = project.keyframes!.images.find(
          (img) => img.sceneId === scene.id && img.isApproved
        );

        if (!approvedImage) {
          console.log(`[Videos API] Scene ${scene.order}: No approved image, skipping`);
          continue;
        }

        // Get the local path to the keyframe image
        const imagePath = getKeyframeLocalPath(id, approvedImage.imageUrl);

        // Check if the image file exists
        try {
          await fs.access(imagePath);
        } catch {
          console.error(`[Videos API] Scene ${scene.order}: Image file not found at ${imagePath}`);
          continue;
        }

        const motionPrompt = buildMotionPrompt(scene);
        const sceneDuration = scene.duration; // Use the scene's specific duration
        console.log(`[Videos API] Scene ${scene.order}: Generating ${sceneDuration}s video with prompt "${motionPrompt.slice(0, 50)}..."`);

        const result = await generateVideoFromImage(
          videoConfig,
          imagePath,
          motionPrompt,
          sceneDuration
        );

        if (result?.videoUrl) {
          // Determine extension from the video URL
          let extension = '.mp4';
          if (result.videoUrl.includes('video/webm')) {
            extension = '.webm';
          } else if (result.videoUrl.includes('image/gif')) {
            extension = '.gif';
          }

          // Save the video
          const filename = `video-${scene.order.toString().padStart(2, '0')}-${Date.now()}${extension}`;
          const savePath = path.join(videosDir, filename);
          const savedPath = await downloadAndSaveVideo(result.videoUrl, savePath);

          if (savedPath) {
            const newClip: VideoClip = {
              id: crypto.randomUUID(),
              sceneId: scene.id,
              sceneOrder: scene.order,
              videoUrl: `/api/projects/${id}/assets/videos/${filename}`,
              sourceImageUrl: approvedImage.imageUrl,
              prompt: motionPrompt,
              duration: sceneDuration, // Use the scene's specific duration
              isApproved: false,
              generatedAt: new Date().toISOString(),
              status: 'completed',
            };
            newClips.push(newClip);
            console.log(`[Videos API] Scene ${scene.order}: Generated ${sceneDuration}s video successfully`);
          }
        }
      } catch (error) {
        console.error(`[Videos API] Scene ${scene.order}: Failed`, error);
        // Continue with other scenes
      }
    }

    // Re-load project to get latest clips (in case other operations happened during generation)
    const latestProject = await loadProject(id);
    const latestClips = latestProject?.videoClips?.clips || [];

    // Merge new clips with existing, avoiding duplicates by sceneId+generatedAt
    const existingClipIds = new Set(latestClips.map(c => c.id));
    const uniqueNewClips = newClips.filter(c => !existingClipIds.has(c.id));

    const updatedClips: VideoClipsData = {
      clips: [...latestClips, ...uniqueNewClips],
      lastGeneratedAt: new Date().toISOString(),
    };

    // Save to project
    await updateProject(id, { videoClips: updatedClips });

    return NextResponse.json({
      message: `Generated ${newClips.length} video clips`,
      videosGenerated: newClips.length,
      videoClips: updatedClips,
    });
  } catch (error) {
    console.error('Error generating videos:', error);
    return NextResponse.json(
      { error: 'Failed to generate videos' },
      { status: 500 }
    );
  }
}
