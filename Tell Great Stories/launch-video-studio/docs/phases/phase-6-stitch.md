# Phase 6: Stitch - Assemble Timeline

## Overview
Combine all approved video clips into a coherent timeline. Add transitions between scenes, adjust timing, add text overlays, and create a rough cut of the complete video ready for audio.

## Input
- Storyboard from Phase 3 (scene order, transitions)
- Approved video clips from Phase 5

## Output
- Complete video timeline with all clips
- Transitions between scenes
- Text overlays positioned
- Rough cut video file (without audio)

---

## Requirements (Refined)

- **Timeline Editor**: Medium complexity - reorder, trim clips, adjust transitions, add text overlays
- **Export Format**: MP4 H.264 only
- **Personal Use**: No productization concerns

---

## Implementation Tasks

### 1. Data Model
- [ ] Create `Timeline` and `StitchPhase` interfaces in `/src/types/project.ts`
  ```typescript
  interface TimelineClip {
    id: string;
    sceneId: string;
    videoClipId: string;
    startTime: number; // seconds from video start
    endTime: number;
    trimStart: number; // trim from clip start
    trimEnd: number; // trim from clip end
    transition: {
      type: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'slide';
      duration: number; // seconds
    };
  }

  interface TextOverlayTrack {
    id: string;
    text: string;
    startTime: number;
    endTime: number;
    position: 'top' | 'center' | 'bottom';
    style: {
      fontSize: number;
      fontFamily: string;
      color: string;
      backgroundColor?: string;
      animation: 'none' | 'fade-in' | 'slide-up' | 'typewriter';
    };
  }

  interface Timeline {
    clips: TimelineClip[];
    textOverlays: TextOverlayTrack[];
    totalDuration: number;
    resolution: {
      width: number;
      height: number;
    };
    fps: number;
  }

  interface StitchPhase {
    timeline: Timeline;
    roughCutPath: string | null;
    roughCutStatus: 'pending' | 'rendering' | 'completed' | 'failed';
    renderProgress: number; // 0-100
  }
  ```
- [ ] Add `stitch: StitchPhase | null` to `Project` interface

### 2. API Routes
- [ ] Create `/api/projects/[id]/stitch` route
  - `GET` - Fetch timeline
  - `PATCH` - Update timeline
- [ ] Create `/api/projects/[id]/stitch/clips` route
  - `PUT` - Reorder clips
  - `PATCH` - Update clip timing/transitions
- [ ] Create `/api/projects/[id]/stitch/text-overlays` route
  - `POST` - Add text overlay
  - `PATCH` - Update text overlay
  - `DELETE` - Remove text overlay
- [ ] Create `/api/projects/[id]/stitch/render` route
  - `POST` - Start rough cut render
  - `GET` - Get render progress
- [ ] Create `/api/projects/[id]/stitch/preview` route
  - `GET` - Stream preview video

### 3. Video Stitching Service
- [ ] Create `/src/lib/services/video-stitch.ts`
- [ ] Implement using FFmpeg:
  - [ ] Install ffmpeg-static or use system FFmpeg
  - [ ] Concatenate video clips
  - [ ] Apply transitions between clips
  - [ ] Render text overlays
- [ ] Support transition types:
  - [ ] Cut (instant)
  - [ ] Fade (fade to black, then in)
  - [ ] Cross dissolve (blend)
  - [ ] Wipe (directional)
  - [ ] Slide (push)
- [ ] Handle different clip resolutions/fps
- [ ] Render progress reporting

### 4. Timeline Editor Engine
- [ ] Create `/src/lib/timeline-engine.ts`
- [ ] Calculate clip positions and durations
- [ ] Handle transition overlap
- [ ] Validate timeline consistency
- [ ] Auto-generate initial timeline from storyboard
- [ ] Snap-to-grid for alignment
- [ ] Undo/redo support

### 5. UI Components
- [ ] Create `/src/components/stitch/` directory
- [ ] `TimelineEditor.tsx` - Main timeline with tracks
  - Video track
  - Text overlay track
  - Zoom controls
  - Playhead scrubber
- [ ] `TimelineRuler.tsx` - Time ruler with markers
  - Second/frame markers
  - Scene boundaries
- [ ] `TimelineClip.tsx` - Draggable clip on timeline
  - Thumbnail preview
  - Duration handle
  - Transition indicator
- [ ] `TimelineTrack.tsx` - Track container (video, text)
- [ ] `ClipTrimmer.tsx` - Adjust in/out points
  - Frame-accurate trimming
  - Preview during trim
- [ ] `TransitionPicker.tsx` - Select transition type
  - Visual icons for each type
  - Duration slider
- [ ] `TransitionPreview.tsx` - Preview transition effect
  - Mini animation showing transition
- [ ] `TextOverlayEditor.tsx` - Edit text overlays
  - Text input
  - Position picker
  - Style controls (font, color, size)
  - Animation selector
- [ ] `PreviewPlayer.tsx` - Video preview with timeline sync
  - Play/pause
  - Frame stepping
  - Loop section
  - Full-screen
- [ ] `RenderProgress.tsx` - Render status and progress
  - Progress bar
  - Estimated time remaining
  - Cancel button

### 6. Page Implementation
- [ ] Create `/src/app/projects/[id]/stitch/page.tsx`
- [ ] Layout: Preview player top, timeline editor bottom
- [ ] Implement drag-and-drop clip reordering on timeline
- [ ] Real-time preview as user makes changes
- [ ] Add transition editor between clips
- [ ] Text overlay track with positioning
- [ ] Render rough cut button
- [ ] Add "Continue to Audio" button

### 7. Timeline Interaction
- [ ] Drag clips to reorder
- [ ] Drag clip edges to trim
- [ ] Click between clips to edit transition
- [ ] Scrub playhead to preview
- [ ] Keyboard shortcuts:
  - Space: play/pause
  - Left/Right: step frame
  - Home/End: go to start/end
  - Delete: remove selected
- [ ] Zoom in/out on timeline
- [ ] Scroll to follow playhead

### 8. FFmpeg Integration
- [ ] Create `/src/lib/ffmpeg.ts`
- [ ] Build FFmpeg command for:
  - [ ] Concatenation with transitions
  - [ ] Text overlay rendering
  - [ ] Format standardization
- [ ] Execute FFmpeg as child process
- [ ] Parse progress from FFmpeg output
- [ ] Handle errors gracefully

### 9. Preview System
- [ ] Generate low-res preview quickly
- [ ] Scrub through timeline
- [ ] Preview specific transitions
- [ ] Show text overlays in preview
- [ ] Cache preview segments

### 10. Validation
- [ ] All clips must be in timeline
- [ ] No gaps in timeline (or intentional gaps)
- [ ] Transitions properly configured
- [ ] Create `isStitchPhaseComplete()` function

---

## UI Wireframe

```
+------------------------------------------------------------------+
| <- Back    Project Name                    [Render Rough Cut]     |
|            Phase 6: Stitch                                        |
+------------------------------------------------------------------+
|                        PREVIEW PLAYER                             |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |                      [Video Preview]                       |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|  |◀◀  ◀  [▶]  ▶  ▶▶|  01:23 / 02:45  |  [⚙] [🔊] [⛶]         |  |
+------------------------------------------------------------------+
|                         TIMELINE                                  |
|  [+] [-] Zoom: [===●===]                                         |
|  Time: |0s    |15s   |30s   |45s   |1:00  |1:15  |1:30  |1:45  | |
|  ------+------+------+------+------+------+------+------+-------| |
|  VIDEO |[Clip1  ]⟩[Clip2   ]⟩[Clip3 ]⟩[Clip4  ]⟩[Clip5]⟩[...]  | |
|        |       fade  |    cut|   dissolve|   fade |              | |
|  ------+------+------+------+------+------+------+------+-------| |
|  TEXT  |        [Company Tagline    ]                   [CTA  ] | |
|  ------+------+------+------+------+------+------+------+-------| |
|                           ▲                                       |
|                       playhead                                    |
+------------------------------------------------------------------+
| CLIP EDITOR                    | TRANSITION                       |
| Selected: Clip 3               | Type: [Dissolve ▼]               |
| Duration: 12.0s                | Duration: [0.5s]                 |
| Trim: [0.0s] to [12.0s]        | [Preview]                        |
|                                |                                  |
| TEXT OVERLAY EDITOR            |                                  |
| Text: [Your Company Name     ] |                                  |
| Position: [Bottom ▼]           |                                  |
| Font: [Inter ▼] Size: [48]     |                                  |
| Color: [#FFFFFF] Bg: [none]    |                                  |
| Animation: [Fade In ▼]         |                                  |
+--------------------------------+----------------------------------+
|                        [Continue to Audio]                        |
+------------------------------------------------------------------+
```

---

## FFmpeg Command Examples

### Concatenate with Crossfade
```bash
ffmpeg -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 \
  -filter_complex "
    [0:v]trim=0:12,setpts=PTS-STARTPTS[v0];
    [1:v]trim=0:15,setpts=PTS-STARTPTS[v1];
    [2:v]trim=0:10,setpts=PTS-STARTPTS[v2];
    [v0][v1]xfade=transition=fade:duration=0.5:offset=11.5[vt1];
    [vt1][v2]xfade=transition=dissolve:duration=0.5:offset=25.5[vout]
  " \
  -map "[vout]" -c:v libx264 -preset medium -crf 18 output.mp4
```

### Add Text Overlay
```bash
ffmpeg -i input.mp4 \
  -vf "drawtext=text='Company Name':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-100:enable='between(t,0,3)':fontfile=/path/to/font.ttf" \
  -c:v libx264 output.mp4
```

### Combined Pipeline
```bash
ffmpeg -i clip1.mp4 -i clip2.mp4 \
  -filter_complex "
    [0:v][1:v]xfade=transition=fade:duration=0.5:offset=11.5[vid];
    [vid]drawtext=text='Your Text':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-80:enable='between(t,20,25)'[vout]
  " \
  -map "[vout]" -c:v libx264 -preset medium -crf 18 output.mp4
```

---

## Transition Types

| Type | Description | FFmpeg xfade |
|------|-------------|--------------|
| Cut | Instant switch | N/A (concat) |
| Fade | Fade through black | `fade` |
| Dissolve | Cross-dissolve blend | `dissolve` |
| Wipe Left | Wipe from right to left | `wipeleft` |
| Wipe Right | Wipe from left to right | `wiperight` |
| Slide Left | Push out to left | `slideleft` |
| Slide Right | Push out to right | `slideright` |

---

## Text Overlay Styles

```typescript
const textStyles = {
  title: {
    fontSize: 64,
    fontWeight: 'bold',
    position: 'center',
  },
  subtitle: {
    fontSize: 36,
    fontWeight: 'normal',
    position: 'bottom',
  },
  caption: {
    fontSize: 24,
    fontWeight: 'normal',
    position: 'bottom',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
};
```

---

## Timeline Auto-Generation

Initial timeline created from storyboard:
1. Load all approved video clips in scene order
2. Set default transition (fade, 0.5s) between all clips
3. Add text overlays from storyboard (if specified)
4. Calculate total duration
5. User can then adjust

---

## Acceptance Criteria
- [ ] All video clips arranged on timeline automatically
- [ ] User can reorder clips via drag-and-drop
- [ ] User can trim clip in/out points
- [ ] User can select transition type between clips
- [ ] User can add and position text overlays
- [ ] Timeline preview plays smoothly (low-res OK)
- [ ] Rough cut can be rendered (MP4 H.264)
- [ ] Render progress displayed with percentage
- [ ] Cannot proceed until rough cut is rendered
- [ ] Timeline state persisted to project file
- [ ] Keyboard shortcuts work for common actions
