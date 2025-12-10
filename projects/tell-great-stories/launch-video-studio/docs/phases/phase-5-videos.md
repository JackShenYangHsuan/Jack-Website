# Phase 5: Videos - Animate Scenes

## Overview
Transform static keyframe images into animated video clips using local ComfyUI with video generation models. Each scene's approved keyframe becomes a short video segment with motion, following the specified camera movement and duration.

## Input
- Storyboard from Phase 3 (scene details, camera movements, durations)
- Approved keyframe images from Phase 4

## Output
- Animated video clips for each scene (3-15 seconds each)
- Video metadata (generation settings, motion type)
- Approved video clips ready for stitching

---

## Requirements (Refined)

- **Video Generation**: ComfyUI (local instance) with image-to-video workflows
- **Workflows**: Bundled workflows shipped with the app
- **Video Duration**: Support longer scenes (3-15 seconds per clip)
- **Personal Use**: No productization concerns

---

## Implementation Tasks

### 1. Data Model
- [ ] Create `VideoClip` and `VideosPhase` interfaces in `/src/types/project.ts`
  ```typescript
  interface VideoClip {
    id: string;
    sceneId: string;
    keyframeId: string; // source keyframe
    localPath: string; // ~/launch-video-studio/projects/{id}/assets/videos/
    thumbnailPath: string;
    prompt: string;
    motionSettings: {
      type: 'image-to-video';
      motionAmount: number; // 0-100
      cameraMotion: CameraMotion;
      duration: number; // seconds
    };
    comfySettings: {
      workflow: string; // workflow name
      model: string; // video model name (e.g., SVD, AnimateDiff, CogVideoX)
      fps: number;
      frames: number; // total frames
      width: number;
      height: number;
      seed: number;
      motionStrength: number;
    };
    status: 'queued' | 'generating' | 'completed' | 'failed' | 'approved' | 'rejected';
    createdAt: string;
    approvedAt?: string;
    processingProgress?: number; // 0-100
    error?: string;
  }

  type CameraMotion =
    | 'static'
    | 'pan-left' | 'pan-right'
    | 'tilt-up' | 'tilt-down'
    | 'zoom-in' | 'zoom-out'
    | 'dolly-in' | 'dolly-out'
    | 'orbit-left' | 'orbit-right';

  interface SceneVideos {
    sceneId: string;
    clips: VideoClip[];
    selectedClipId: string | null;
  }

  interface VideosPhase {
    sceneVideos: SceneVideos[];
    generationQueue: string[];
    completedCount: number;
    totalCount: number;
  }
  ```
- [ ] Add `videos: VideosPhase | null` to `Project` interface
- [ ] Update storage for video files

### 2. API Routes
- [ ] Create `/api/projects/[id]/videos` route
  - `GET` - Fetch all scene videos
  - `POST` - Start video generation for scenes
- [ ] Create `/api/projects/[id]/videos/[sceneId]` route
  - `GET` - Get videos for specific scene
  - `POST` - Generate new video for scene
- [ ] Create `/api/projects/[id]/videos/[sceneId]/[clipId]` route
  - `PATCH` - Approve/reject clip
  - `DELETE` - Delete clip
- [ ] Create `/api/projects/[id]/videos/generate-all` route
  - `POST` - Queue all scenes for video generation
- [ ] Create `/api/projects/[id]/videos/regenerate` route
  - `POST` - Regenerate with different motion settings

### 3. ComfyUI Video Service
- [ ] Extend `/src/lib/services/comfyui.ts` for video generation
- [ ] Video-specific functionality:
  ```typescript
  interface VideoGenerationParams {
    sourceImage: string; // path to keyframe
    prompt: string;
    motionStrength: number;
    cameraMotion: CameraMotion;
    frames: number;
    fps: number;
    seed: number;
  }

  // Additional methods for ComfyUIService
  async generateVideo(params: VideoGenerationParams): Promise<string>;
  async getVideoProgress(promptId: string): Promise<VideoProgress>;
  ```
- [ ] Handle longer generation times (video takes much longer)
- [ ] Progress tracking with frame count

### 4. Video Workflow Management
- [ ] Create `/src/lib/workflows/video/` directory
- [ ] Bundled video generation workflows:
  - [ ] `video-gen-svd.json` - Stable Video Diffusion workflow
  - [ ] `video-gen-animatediff.json` - AnimateDiff workflow
  - [ ] `video-gen-cogvideo.json` - CogVideoX workflow (if available)
- [ ] Camera motion implementation:
  ```typescript
  interface CameraMotionConfig {
    type: CameraMotion;
    // Parameters injected into workflow
    panX?: number; // -1 to 1
    panY?: number; // -1 to 1
    zoom?: number; // 0.9 to 1.1
    rotation?: number; // degrees
  }
  ```
- [ ] Workflow parameter injection for video models

### 5. Motion Prompt Engineering
- [ ] Create `/src/lib/prompts/video-generation.ts`
- [ ] Map storyboard camera movements to prompt text:
  ```typescript
  const cameraMotionPrompts = {
    'static': 'static camera, subtle scene movement',
    'pan-left': 'camera slowly pans left, smooth movement',
    'pan-right': 'camera slowly pans right, smooth movement',
    'zoom-in': 'camera slowly zooms in, focus intensifies',
    'zoom-out': 'camera slowly zooms out, revealing scene',
    'tilt-up': 'camera tilts upward smoothly',
    'tilt-down': 'camera tilts downward smoothly',
    // ... etc
  };
  ```
- [ ] Build motion prompts from scene + style + camera movement
- [ ] Duration-to-frames calculation based on FPS

### 6. UI Components
- [ ] Create `/src/components/videos/` directory
- [ ] `SceneVideoCard.tsx` - Scene with video clips
  - Keyframe source thumbnail
  - Generated video preview
  - Generation status
- [ ] `VideoPlayer.tsx` - Custom video player with controls
  - Play/pause
  - Loop toggle
  - Frame stepping
  - Fullscreen
- [ ] `VideoClipGallery.tsx` - Grid of generated clips
  - Thumbnail grid with play buttons
  - Selection indicator
  - Status badges
- [ ] `MotionPreview.tsx` - Visual preview of camera motion
  - Animated icon showing motion type
  - Before/after indicator
- [ ] `MotionSettings.tsx` - Adjust motion type and intensity
  - Camera motion selector
  - Motion strength slider
  - Duration slider
- [ ] `GenerationQueue.tsx` - Show queued/in-progress generations
  - Queue position
  - Current generation progress
  - Frame progress
- [ ] `VideoCompare.tsx` - Side-by-side clip comparison
  - Synchronized playback
  - Select best option
- [ ] `ApprovalWorkflow.tsx` - Approve/reject with notes

### 7. Page Implementation
- [ ] Create `/src/app/projects/[id]/videos/page.tsx`
- [ ] Layout: Scene list with keyframe preview, video workspace
- [ ] Show generation progress with percentage/frames
- [ ] Video preview with playback controls
- [ ] Motion settings adjustment per scene
- [ ] Batch generation support
- [ ] Add "Continue to Stitch" button

### 8. Background Processing
- [ ] Video generation queue with priority
- [ ] WebSocket for real-time progress updates
- [ ] Progress tracking (frame-by-frame)
- [ ] Handle long generation times gracefully
- [ ] Retry failed generations

### 9. Video Storage
- [ ] Save videos to `~/launch-video-studio/projects/{id}/assets/videos/`
- [ ] File naming: `{sceneId}_{clipId}.mp4`
- [ ] Standard format: MP4, H.264 codec
- [ ] Generate preview thumbnails (first frame)
- [ ] Track file sizes and storage
- [ ] Clean up rejected clips

### 10. Video Processing Utilities
- [ ] Create `/src/lib/video-utils.ts`
- [ ] Extract thumbnail from video (using FFmpeg)
- [ ] Get video duration and metadata
- [ ] Convert formats if needed (ComfyUI outputs)
- [ ] Validate video integrity
- [ ] Resize/crop if resolution mismatch

### 11. Validation
- [ ] Each scene needs at least one approved video
- [ ] Video duration should approximately match storyboard
- [ ] Create `isVideosPhaseComplete()` function

---

## UI Wireframe

```
+------------------------------------------------------------------+
| <- Back    Project Name                    Progress: 4/12 scenes  |
|            Phase 5: Videos                 [Generate All]         |
+------------------------------------------------------------------+
| ComfyUI: ● Connected | Queue: 1 | Current: Scene 5 (47%)          |
+------------------------------------------------------------------+
| SCENES            |  VIDEO WORKSPACE                              |
|                   |                                               |
| +-------------+   |  Scene 5: The Turning Point                   |
| | [keyframe]  |   |  Target Duration: 12 seconds                  |
| | Scene 1 ✓   |   |                                               |
| +-------------+   |  SOURCE KEYFRAME        GENERATED VIDEO       |
| +-------------+   |  +-------------+        +-------------+       |
| | [keyframe]  |   |  |             |        |             |       |
| | Scene 2 ✓   |   |  |   [image]   |   =>   |   ▶ [video] |       |
| +-------------+   |  |             |        |  47% (28/60) |       |
| +-------------+   |  +-------------+        +-------------+       |
| | [keyframe]  |   |                         [Play] [Loop]         |
| | Scene 3 ✓   |   |                                               |
| +-------------+   |  MOTION SETTINGS                              |
| +-------------+   |  Camera: [Slow zoom in ▼]                     |
| | [keyframe]  |   |  Intensity: [====●====] Medium                |
| | Scene 4 ✓   |   |  Duration: [12s] → 60 frames @ 5fps           |
| +-------------+   |                                               |
| +-------------+   |  GENERATION                                   |
| | [keyframe]  |   |  Model: [SVD ▼]                               |
| | Scene 5 *   |   |  Motion Strength: [====●===] 0.7              |
| | ⏳ 47%      |   |  Seed: [1234567] [🎲]                         |
| +-------------+   |                                               |
| +-------------+   |  [Regenerate] [Advanced Settings]             |
| | [keyframe]  |   |                                               |
| | Scene 6     |   |  CLIPS (2 generated)                          |
| +-------------+   |  [▶ clip1 ✓] [▶ clip2]                        |
|       ...         |                                               |
|                   |                                               |
| Legend:           |                                               |
| ✓ Approved        |                                               |
| ⏳ Generating     |                                               |
| * Selected        |                                               |
+-------------------+-----------------------------------------------+
|                        [Continue to Stitch]                       |
+------------------------------------------------------------------+
```

---

## Camera Motion Implementation

### ComfyUI Motion Control Approaches

1. **SVD Motion Buckets**
   - Use motion_bucket_id parameter
   - Range: 0-255 (low motion to high motion)

2. **AnimateDiff Motion Module**
   - Use motion LoRA or motion module
   - Control via prompt and motion scale

3. **Camera Pan/Zoom via Latent Manipulation**
   - Crop and pan the latent space
   - Zoom via progressive cropping

### Motion Type to Parameters

| Motion Type | SVD motion_bucket | AnimateDiff Scale | Notes |
|-------------|-------------------|-------------------|-------|
| static | 20-40 | 0.5 | Subtle scene movement |
| pan-left | 80-120 | 1.0 | + horizontal shift |
| pan-right | 80-120 | 1.0 | + horizontal shift |
| zoom-in | 60-100 | 0.8 | + scale increase |
| zoom-out | 60-100 | 0.8 | + scale decrease |
| tilt-up | 80-120 | 1.0 | + vertical shift |
| tilt-down | 80-120 | 1.0 | + vertical shift |

---

## Video Generation Workflows

### SVD (Stable Video Diffusion) Workflow
```
1. Load keyframe image
2. Encode image to latent
3. Apply SVD model
4. Set motion parameters (bucket_id, fps, frames)
5. Sample with appropriate steps
6. Decode latent to video frames
7. Encode to video (VAE + VideoOutput)
```

### Duration to Frames
```typescript
function calculateFrames(durationSeconds: number, fps: number): number {
  return Math.round(durationSeconds * fps);
}

// Example: 12 seconds @ 5fps = 60 frames
// Note: SVD typically generates 14-25 frames, may need interpolation
```

### Frame Interpolation (if needed)
- Use FILM or RIFE for frame interpolation
- Workflow: Generate key frames → Interpolate → Output

---

## Video Model Comparison

| Model | Frames | Quality | Speed | VRAM | Best For |
|-------|--------|---------|-------|------|----------|
| SVD 1.1 | 14-25 | Excellent | Slow | 24GB+ | High quality |
| AnimateDiff | 16-32 | Good | Medium | 12GB+ | Stylized |
| CogVideoX | 49 | Very Good | Medium | 24GB+ | Longer clips |

---

## Acceptance Criteria
- [ ] App connects to ComfyUI for video generation
- [ ] User can generate video clips from keyframes
- [ ] Camera motion applied based on storyboard settings
- [ ] User can preview, compare, and select clips
- [ ] User can adjust motion settings and regenerate
- [ ] Progress tracking for long-running generations
- [ ] Generated videos saved locally with metadata
- [ ] Bundled video workflows work out of the box
- [ ] Cannot proceed until all scenes have approved videos
- [ ] Videos approximately match specified duration from storyboard
