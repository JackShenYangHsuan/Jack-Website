# Phase 3: Storyboard - Plan Scenes and Shots

## Overview
Break down the emotional story into a sequence of scenes. Each scene has a description, shot type, duration, and represents a beat in the narrative arc. AI generates the initial storyboard, user can edit/add/remove scenes.

## Input
- Story Brief from Phase 1
- Style Guide from Phase 2

## Output
- Storyboard with 8-15 scenes, each containing:
  - Scene number and title
  - Visual description (what we see)
  - Emotional beat (what we feel)
  - Shot type (wide, medium, close-up, etc.)
  - Camera movement (static, pan, zoom, etc.)
  - Estimated duration
  - Text overlay (if any)

---

## Requirements (Refined)

- **Storyboard Generation**: AI generates initial storyboard from story brief, user can edit/add/remove scenes
- **Video Duration**: Support longer form (1-5 minutes)
- **Personal Use**: No productization concerns

---

## Implementation Tasks

### 1. Data Model
- [ ] Create `Storyboard` and `Scene` interfaces in `/src/types/project.ts`
  ```typescript
  interface Scene {
    id: string;
    order: number;
    title: string;
    visualDescription: string;
    emotionalBeat: string;
    shotType: 'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'aerial';
    cameraMovement: 'static' | 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'tracking' | 'dolly';
    duration: number; // seconds (3-15 seconds per scene for longer videos)
    textOverlay?: {
      text: string;
      position: 'top' | 'center' | 'bottom';
      style: 'title' | 'subtitle' | 'caption';
    };
    transitionIn?: 'cut' | 'fade' | 'dissolve' | 'wipe';
    notes: string;
  }

  interface Storyboard {
    scenes: Scene[];
    totalDuration: number; // calculated, target 1-5 minutes
    targetDuration: number; // user-set target in seconds (60-300)
    narrativeArc: {
      hook: string;      // Opening hook (scenes 1-2)
      problem: string;   // Problem setup (scenes 3-5)
      journey: string;   // Transformation (scenes 6-12)
      resolution: string; // Resolution (scenes 13-15)
      cta: string;       // Call to action (final scene)
    };
  }
  ```
- [ ] Add `storyboard: Storyboard | null` to `Project` interface
- [ ] Update storage functions

### 2. API Routes
- [ ] Create `/api/projects/[id]/storyboard` route
  - `GET` - Fetch current storyboard
  - `PATCH` - Update storyboard
- [ ] Create `/api/projects/[id]/storyboard/scenes` route
  - `POST` - Add new scene
  - `PUT` - Reorder scenes
- [ ] Create `/api/projects/[id]/storyboard/scenes/[sceneId]` route
  - `PATCH` - Update single scene
  - `DELETE` - Remove scene
- [ ] Create `/api/projects/[id]/storyboard/generate` route
  - `POST` - AI-generate initial storyboard from story brief + style

### 3. UI Components
- [ ] Create `/src/components/storyboard/` directory
- [ ] `SceneCard.tsx` - Individual scene card (draggable)
  - Scene number, title, description preview
  - Duration badge
  - Shot type icon
  - Edit/delete buttons
- [ ] `SceneEditor.tsx` - Modal/panel for editing scene details
  - All scene fields in a form
  - AI suggestions for improvement
- [ ] `StoryboardTimeline.tsx` - Horizontal timeline view
  - Visual representation of all scenes
  - Duration markers
  - Narrative arc labels
- [ ] `StoryboardGrid.tsx` - Grid view of all scenes
  - Drag-and-drop reordering
  - Quick edit inline
- [ ] `ShotTypeSelector.tsx` - Visual selector for shot types
  - Icons/images showing each shot type
- [ ] `CameraMovementSelector.tsx` - Animation preview of movements
  - Mini animations showing pan, zoom, etc.
- [ ] `DurationSlider.tsx` - Duration input with preview
  - Range: 3-15 seconds per scene
  - Total duration display
- [ ] `NarrativeArcIndicator.tsx` - Shows story structure
  - Visual bar showing hook/problem/journey/resolution/cta sections
- [ ] `TextOverlayEditor.tsx` - Edit text that appears on scene
  - Text input, position selector, style picker
- [ ] `TargetDurationPicker.tsx` - Set target video length
  - Options: 1 min, 2 min, 3 min, 5 min, custom

### 4. Page Implementation
- [ ] Create `/src/app/projects/[id]/storyboard/page.tsx`
- [ ] Layout: Timeline at top, scene grid below, editor panel on right
- [ ] Target duration selector at top
- [ ] Implement drag-and-drop scene reordering
- [ ] Auto-calculate total duration
- [ ] Add "Generate with AI" button for initial storyboard
- [ ] AI regeneration with duration constraint
- [ ] Add "Continue to Images" button

### 5. AI Integration
- [ ] Create storyboard generation prompt in `/src/lib/prompts/storyboard.ts`
- [ ] Implement `generateStoryboard(brief, style, targetDuration)`
  - Create full storyboard from brief + style
  - Respect target duration (1-5 minutes)
  - Follow narrative arc structure
- [ ] Implement `suggestSceneDescription()` - Improve individual scene description
- [ ] Implement `analyzeNarrativeFlow()` - Check story structure coherence
- [ ] Prompt should follow narrative arc: Hook -> Problem -> Journey -> Resolution -> CTA
- [ ] Calculate appropriate number of scenes based on target duration

### 6. Drag and Drop
- [ ] Install/configure `@dnd-kit/core` and `@dnd-kit/sortable`
- [ ] Implement scene reordering with smooth animations
- [ ] Update order numbers on drop
- [ ] Persist new order to storage

### 7. Validation
- [ ] Minimum 8 scenes required for longer form
- [ ] Each scene needs visual description and duration
- [ ] Total duration should be within 10% of target
- [ ] Create `isStoryboardComplete()` validation function

---

## UI Wireframe

```
+------------------------------------------------------------------+
| <- Back    Project Name                         Total: 2:45 / 3:00|
|            Phase 3: Storyboard      Target: [3 minutes ▼]         |
+------------------------------------------------------------------+
| TIMELINE                                                          |
| [1]--[2]--[3]--[4]--[5]--[6]--[7]--[8]--[9]--[10]-[11]-[12]      |
|  8s  10s  12s  15s  12s  15s  15s  12s  10s  15s  12s   9s       |
| |-- Hook --|--- Problem ---|---- Journey ------|-- Resolve -|CTA| |
+------------------------------------------------------------------+
| SCENES                                    | SCENE EDITOR          |
|                                           |                       |
| +-------+ +-------+ +-------+ +-------+   | Scene 6: Turning Point|
| |   1   | |   2   | |   3   | |   4   |   |                       |
| | Hook  | | Setup | | Pain  | | Strug |   | Visual Description    |
| | 8s    | | 10s   | | 12s   | | 15s   |   | [textarea]            |
| +-------+ +-------+ +-------+ +-------+   |                       |
|                                           | Emotional Beat        |
| +-------+ +-------+ +-------+ +-------+   | [textarea]            |
| |   5   | |   6 * | |   7   | |   8   |   |                       |
| | Depth | | Turn  | | Hope  | | Build |   | Shot Type             |
| | 12s   | | 15s   | | 15s   | | 12s   |   | [○ Wide ● Med ○ CU]   |
| +-------+ +-------+ +-------+ +-------+   |                       |
|                                           | Camera Movement       |
| +-------+ +-------+ +-------+ +-------+   | [Slow zoom in ▼]      |
| |   9   | |  10   | |  11   | |  12   |   |                       |
| | Prog  | | Trans | | CTA   | | Brand |   | Duration: [--15s--]   |
| | 10s   | | 15s   | | 12s   | | 9s    |   |                       |
| +-------+ +-------+ +-------+ +-------+   | Text Overlay          |
|                                           | [ ] Add text          |
| [+ Add Scene]                             |                       |
|                                           | [AI: Improve Scene]   |
| [Generate with AI]   [Continue to Images] |                       |
+-------------------------------------------+-----------------------+
```

---

## Narrative Arc Structure (Longer Form)

The AI should generate scenes following this structure for 1-5 minute videos:

1. **Hook (8-15s)** - 1-2 scenes
   - Visual or emotional hook
   - Establish tone
   - Grab attention immediately

2. **Problem (30-60s)** - 3-4 scenes
   - Set up the pain point
   - Show the struggle
   - Build empathy
   - Make it relatable

3. **Journey (60-150s)** - 5-8 scenes
   - Introduction of solution
   - Building momentum
   - Show progress
   - Demonstrate value
   - Multiple transformation moments

4. **Resolution (20-40s)** - 2-3 scenes
   - Show the transformation complete
   - Emotional climax
   - Benefits realized

5. **CTA (10-20s)** - 1-2 scenes
   - Brand reveal
   - Clear next step
   - Memorable closing

---

## Scene Duration Guidelines

| Video Length | Scenes | Avg Scene Duration |
|--------------|--------|-------------------|
| 1 minute     | 8-10   | 6-8 seconds       |
| 2 minutes    | 10-14  | 8-12 seconds      |
| 3 minutes    | 12-18  | 10-15 seconds     |
| 5 minutes    | 18-25  | 12-17 seconds     |

---

## Acceptance Criteria
- [ ] User can set target video duration (1-5 minutes)
- [ ] AI generates initial storyboard matching target duration
- [ ] User can view scenes in grid and timeline view
- [ ] User can add, edit, and delete scenes
- [ ] User can drag-and-drop to reorder scenes
- [ ] Each scene captures visual description, emotional beat, shot type
- [ ] Total duration is calculated and displayed vs target
- [ ] Narrative arc structure is visualized
- [ ] Cannot proceed until minimum scenes with required fields
- [ ] AI can suggest improvements to individual scenes
