# Phase 4: Images - Generate Keyframes

## Overview
Generate high-quality keyframe images for each scene using local ComfyUI. Each scene gets one or more keyframes that will serve as the visual foundation for video generation.

## Input
- Story Brief from Phase 1
- Style Guide from Phase 2
- Storyboard from Phase 3

## Output
- Generated keyframe images for each scene
- Image metadata (prompt used, generation settings)
- Approved/selected images ready for video generation

---

## Requirements (Refined)

- **Image Generation**: ComfyUI (local instance) for both images and videos
- **Workflows**: Bundled workflows shipped with the app
- **Personal Use**: No productization concerns

---

## Implementation Tasks

### 1. Data Model
- [ ] Create `Keyframe` and `ImageGeneration` interfaces in `/src/types/project.ts`
  ```typescript
  interface Keyframe {
    id: string;
    sceneId: string;
    localPath: string; // ~/launch-video-studio/projects/{id}/assets/keyframes/
    thumbnailPath: string;
    prompt: string;
    negativePrompt: string;
    comfySettings: {
      workflow: string; // workflow name/id
      checkpoint: string; // model name
      width: number;
      height: number;
      seed: number;
      steps: number;
      cfg: number;
      sampler: string;
      scheduler: string;
    };
    status: 'queued' | 'generating' | 'completed' | 'failed' | 'approved' | 'rejected';
    createdAt: string;
    approvedAt?: string;
    error?: string;
  }

  interface SceneImages {
    sceneId: string;
    keyframes: Keyframe[];
    selectedKeyframeId: string | null;
  }

  interface ImagesPhase {
    sceneImages: SceneImages[];
    generationQueue: string[]; // scene IDs pending generation
    completedCount: number;
    totalCount: number;
  }
  ```
- [ ] Add `images: ImagesPhase | null` to `Project` interface
- [ ] Update storage to handle image files

### 2. API Routes
- [ ] Create `/api/projects/[id]/images` route
  - `GET` - Fetch all scene images
  - `POST` - Start image generation for scenes
- [ ] Create `/api/projects/[id]/images/[sceneId]` route
  - `GET` - Get images for specific scene
  - `POST` - Generate new image for scene
- [ ] Create `/api/projects/[id]/images/[sceneId]/[keyframeId]` route
  - `PATCH` - Approve/reject keyframe
  - `DELETE` - Delete keyframe
- [ ] Create `/api/projects/[id]/images/generate-all` route
  - `POST` - Queue all scenes for generation
- [ ] Create `/api/projects/[id]/images/regenerate` route
  - `POST` - Regenerate specific image with modified settings

### 3. ComfyUI Service
- [ ] Create `/src/lib/services/comfyui.ts`
- [ ] ComfyUI connection management:
  ```typescript
  interface ComfyUIConfig {
    host: string; // default: localhost
    port: number; // default: 8188
  }

  class ComfyUIService {
    async checkConnection(): Promise<boolean>;
    async getSystemStats(): Promise<SystemStats>;
    async queuePrompt(workflow: object): Promise<string>; // returns prompt_id
    async getQueueStatus(): Promise<QueueStatus>;
    async getHistory(promptId: string): Promise<HistoryItem>;
    async uploadImage(path: string): Promise<string>; // returns filename
    async getImage(filename: string, subfolder?: string): Promise<Buffer>;
    async interrupt(): Promise<void>;
  }
  ```
- [ ] WebSocket connection for real-time progress:
  - Queue position updates
  - Generation progress (steps)
  - Completion notification
- [ ] Error handling for ComfyUI offline/unavailable

### 4. Workflow Management
- [ ] Create `/src/lib/workflows/` directory
- [ ] Bundled image generation workflows:
  - [ ] `image-gen-sdxl.json` - SDXL base workflow
  - [ ] `image-gen-flux.json` - Flux workflow (if available)
  - [ ] `image-gen-sd15.json` - SD 1.5 fallback
- [ ] Workflow loading and parameter injection:
  ```typescript
  function loadWorkflow(name: string): ComfyWorkflow;
  function injectParameters(workflow: ComfyWorkflow, params: GenerationParams): ComfyWorkflow;
  ```
- [ ] Store workflows in `/workflows/` directory or bundled in app

### 5. Prompt Engineering
- [ ] Create `/src/lib/prompts/image-generation.ts`
- [ ] Build comprehensive prompt from:
  - Scene visual description
  - Style guide (colors, mood, lighting)
  - Shot type and camera angle
  - Emotional beat
- [ ] Create negative prompt based on style
- [ ] Implement prompt templates for different models (SDXL vs Flux vs SD1.5)
- [ ] Add consistency tokens for character/setting continuity

### 6. UI Components
- [ ] Create `/src/components/images/` directory
- [ ] `ComfyUIStatus.tsx` - Connection status indicator
  - Shows connected/disconnected
  - Queue length
  - Current generation progress
- [ ] `SceneImageCard.tsx` - Scene with generated images
  - Scene info header
  - Keyframe gallery
  - Generation button
- [ ] `KeyframeGallery.tsx` - Grid of generated keyframes for a scene
  - Thumbnail grid
  - Selection indicator
  - Status badges
- [ ] `ImagePreview.tsx` - Full-size image viewer with zoom
  - Pan and zoom
  - Metadata display
  - Download button
- [ ] `GenerationProgress.tsx` - Progress indicator for generation
  - Queue position
  - Step progress bar
  - Estimated time
- [ ] `PromptEditor.tsx` - Edit and refine generation prompt
  - Positive prompt textarea
  - Negative prompt textarea
  - Token count
- [ ] `ImageCompare.tsx` - Side-by-side comparison of keyframes
  - Swipe to compare
  - Select best
- [ ] `ApprovalButtons.tsx` - Approve/reject/regenerate controls
- [ ] `GenerationSettings.tsx` - Adjust ComfyUI settings
  - Checkpoint selector (from available models)
  - Resolution picker
  - Seed, steps, CFG sliders
  - Sampler/scheduler selectors

### 7. Page Implementation
- [ ] Create `/src/app/projects/[id]/images/page.tsx`
- [ ] Layout: Scene list on left, image workspace on right
- [ ] ComfyUI status bar at top
- [ ] Show generation progress with real-time updates
- [ ] Implement batch generation ("Generate All")
- [ ] Allow regeneration with prompt tweaks
- [ ] Add approval workflow for each scene
- [ ] Add "Continue to Videos" button (all scenes need approved image)

### 8. Background Processing
- [ ] Generation queue management
- [ ] WebSocket connection to ComfyUI for progress
- [ ] Handle ComfyUI reconnection
- [ ] Retry failed generations
- [ ] Save images immediately when completed

### 9. Image Storage
- [ ] Save generated images to `~/launch-video-studio/projects/{id}/assets/keyframes/`
- [ ] File naming: `{sceneId}_{keyframeId}.png`
- [ ] Generate thumbnails (300px wide) on save
- [ ] Implement image cleanup for rejected keyframes
- [ ] Track storage usage

### 10. Settings Page Addition
- [ ] Add ComfyUI settings to app settings:
  - Host/port configuration
  - Connection test button
  - Default checkpoint selection
  - Default workflow selection

### 11. Validation
- [ ] Each scene needs at least one approved keyframe
- [ ] Create `isImagesPhaseComplete()` function
- [ ] Track and display completion percentage

---

## UI Wireframe

```
+------------------------------------------------------------------+
| <- Back    Project Name                    Progress: 7/12 scenes  |
|            Phase 4: Images                 [Generate All]         |
+------------------------------------------------------------------+
| ComfyUI: ● Connected | Queue: 2 | GPU: RTX 4090                   |
+------------------------------------------------------------------+
| SCENES            |  KEYFRAME WORKSPACE                           |
|                   |                                               |
| [■] Scene 1 ✓     |  Scene 5: The Turning Point                   |
| [■] Scene 2 ✓     |  "User discovers the solution..."             |
| [■] Scene 3 ✓     |                                               |
| [■] Scene 4 ✓     |  +-------------+ +-------------+ +-------+    |
| [□] Scene 5 *     |  |             | |             | |  +    |    |
| [○] Scene 6       |  |   [img 1]   | |   [img 2]   | | New   |    |
| [○] Scene 7       |  |             | |             | |       |    |
| [○] Scene 8       |  |  ✓ Selected | |             | +-------+    |
| [○] Scene 9       |  +-------------+ +-------------+              |
| [○] Scene 10      |                                               |
| [○] Scene 11      |  PROMPT                                       |
| [○] Scene 12      |  [A person having an aha moment, bright      |
|                   |   warm lighting, hopeful expression,          |
| Legend:           |   medium close-up shot, soft focus bg...    ] |
| ■ Approved        |                                               |
| □ Generated       |  Negative: [blurry, text, watermark...]       |
| ○ Pending         |                                               |
| * Selected        |  [Edit Prompt] [Regenerate]                   |
|                   |                                               |
|                   |  SETTINGS                                     |
|                   |  Checkpoint: [SDXL Base ▼]                    |
|                   |  Size: [1344x768 ▼]  Steps: [30]             |
|                   |  CFG: [7.0]  Seed: [random ▼]                |
+-------------------+-----------------------------------------------+
|                        [Continue to Videos]                       |
+------------------------------------------------------------------+
```

---

## ComfyUI Workflow Structure

### Basic SDXL Workflow Parameters
```json
{
  "checkpoint": "sdxl_base_1.0.safetensors",
  "positive_prompt": "...",
  "negative_prompt": "...",
  "width": 1344,
  "height": 768,
  "seed": -1,
  "steps": 30,
  "cfg": 7.0,
  "sampler": "euler_ancestral",
  "scheduler": "normal"
}
```

### Workflow Injection Points
1. **KSampler** - seed, steps, cfg, sampler, scheduler
2. **CLIPTextEncode (positive)** - positive prompt
3. **CLIPTextEncode (negative)** - negative prompt
4. **EmptyLatentImage** - width, height
5. **CheckpointLoaderSimple** - checkpoint name

---

## Prompt Building Strategy

### Base Prompt Structure
```
[Subject/Action], [Setting/Environment], [Style Keywords], [Lighting],
[Camera/Composition], [Mood/Atmosphere], [Technical Quality]
```

### Example Prompt Construction
**Scene Description:** "Founder staring at support tickets piling up"
**Style Guide:** Warm colors, soft lighting, intimate mood
**Shot Type:** Medium close-up

**Generated Prompt:**
```
A startup founder sitting at a desk, overwhelmed, staring at a laptop
screen showing endless support tickets, soft warm lighting from a window,
muted orange and blue color palette, medium close-up shot, shallow depth
of field, feeling of exhaustion and determination, cinematic composition,
high quality, photorealistic, 8k
```

**Negative Prompt:**
```
text, watermark, blurry, low quality, distorted face, extra limbs,
cartoon, anime, illustration, stock photo look, oversaturated
```

---

## ComfyUI Connection Flow

```
1. App starts → Check ComfyUI connection
2. If disconnected → Show setup instructions
3. If connected → Fetch available checkpoints
4. User generates image:
   a. Build prompt from scene + style
   b. Load workflow template
   c. Inject parameters
   d. Queue via WebSocket
   e. Monitor progress via WebSocket
   f. Receive completion notification
   g. Download and save image
   h. Update UI
```

---

## Acceptance Criteria
- [ ] App can connect to local ComfyUI instance
- [ ] User can generate keyframe images for each scene
- [ ] Generation uses scene description + style guide for prompts
- [ ] Real-time progress shown during generation
- [ ] User can view, compare, and select from multiple generations
- [ ] User can approve/reject images
- [ ] User can edit prompt and regenerate
- [ ] Progress tracking shows overall completion
- [ ] Generated images saved locally with metadata
- [ ] Cannot proceed until all scenes have approved keyframes
- [ ] Bundled workflows work out of the box
