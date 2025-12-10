# Phase 2: Style - Define Visual Direction

## Overview
Transform the emotional story brief into a concrete visual direction. Users upload reference images and define color palettes that will guide all visual generation through ComfyUI.

## Input
- Story Brief from Phase 1 (pain, solution, transformation, emotional stakes, tone notes)

## Output
- Style Guide document with:
  - Color palette (primary, secondary, accent colors) - manual picker + AI extraction from images
  - Visual mood/atmosphere
  - Reference images (uploaded only)
  - Typography preferences
  - Lighting style
  - Camera style preferences

---

## Requirements (Refined)

- **Reference Images**: Upload only (no URL/search)
- **Color Palette**: Manual color picker + AI extraction from uploaded reference images
- **Personal Use**: No productization concerns

---

## Implementation Tasks

### 1. Data Model
- [ ] Create `StyleGuide` TypeScript interface in `/src/types/project.ts`
  ```typescript
  interface StyleGuide {
    colorPalette: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    mood: string; // e.g., "warm and hopeful", "dark and intense"
    referenceImages: ReferenceImage[];
    typography: {
      headingStyle: string;
      bodyStyle: string;
    };
    lighting: 'soft-natural' | 'dramatic-contrast' | 'cinematic' | 'high-key' | 'low-key';
    cameraStyle: 'intimate' | 'documentary' | 'cinematic' | 'commercial';
    additionalNotes: string;
  }

  interface ReferenceImage {
    id: string;
    localPath: string; // ~/launch-video-studio/projects/{id}/assets/references/
    thumbnailPath: string;
    caption: string;
    extractedColors?: string[]; // Colors AI extracted from this image
  }
  ```
- [ ] Add `styleGuide: StyleGuide | null` to `Project` interface
- [ ] Update storage functions to handle style guide data

### 2. API Routes
- [ ] Create `/api/projects/[id]/style` route
  - `GET` - Fetch current style guide
  - `PATCH` - Update style guide fields
- [ ] Create `/api/projects/[id]/style/references` route
  - `POST` - Upload reference image (multipart form)
  - `DELETE` - Remove reference image
- [ ] Create `/api/projects/[id]/style/extract-colors` route
  - `POST` - Extract color palette from uploaded reference images using AI/color analysis

### 3. Color Extraction Service
- [ ] Create `/src/lib/services/color-extraction.ts`
- [ ] Implement color extraction from images:
  - Option 1: Use `node-vibrant` or `color-thief` for client-side extraction
  - Option 2: Use AI (Claude Vision) to describe and extract colors
- [ ] `extractColorsFromImage(imagePath)` → returns dominant colors
- [ ] `suggestPaletteFromColors(colors[])` → generates complementary palette

### 4. UI Components
- [ ] Create `/src/components/style/` directory
- [ ] `ColorPaletteEditor.tsx`
  - Manual color picker for each slot (primary, secondary, accent, background, text)
  - "Extract from Images" button
  - Color preview swatches
- [ ] `ReferenceImageUploader.tsx`
  - Drag-drop image upload
  - File picker fallback
  - Upload progress indicator
  - Save to `~/launch-video-studio/projects/{id}/assets/references/`
- [ ] `ReferenceImageGallery.tsx`
  - Grid display of uploaded references
  - Click to view full size
  - Delete button per image
  - Shows extracted colors per image (if extracted)
- [ ] `MoodSelector.tsx`
  - Preset mood options (hopeful, intense, playful, professional, etc.)
  - Custom text input
- [ ] `StylePreview.tsx`
  - Live preview combining all style choices
  - Mock scene with chosen colors and lighting
- [ ] `LightingSelector.tsx`
  - Visual radio options with preview images
  - Soft Natural, Dramatic Contrast, Cinematic, High-Key, Low-Key
- [ ] `CameraStyleSelector.tsx`
  - Visual options with example thumbnails
  - Intimate, Documentary, Cinematic, Commercial

### 5. Page Implementation
- [ ] Create `/src/app/projects/[id]/style/page.tsx`
- [ ] Layout: Style editor center, live preview right
- [ ] Sections:
  1. Reference Images (upload area + gallery)
  2. Color Palette (manual + extract button)
  3. Mood (dropdown + custom)
  4. Lighting (visual selector)
  5. Camera Style (visual selector)
- [ ] Implement auto-save on field changes (debounced)
- [ ] Add "Continue to Storyboard" button (requires minimum fields)

### 6. Asset Management
- [ ] Create `/src/lib/assets.ts` for file handling
- [ ] Implement image upload to `~/launch-video-studio/projects/{id}/assets/references/`
- [ ] Generate thumbnails (300px wide) on upload
- [ ] Implement image deletion with cleanup
- [ ] Track total reference images count

### 7. Validation
- [ ] Define minimum required fields to proceed to Phase 3:
  - At least 1 color in palette (primary)
  - Mood selected
  - Lighting style selected
- [ ] Create validation function `isStyleGuideComplete()`
- [ ] Show completion progress indicator

---

## UI Wireframe

```
+------------------------------------------------------------------+
| <- Back    Project Name                                           |
|            Phase 2: Style                                         |
+------------------------------------------------------------------+
|     STYLE EDITOR                      |    LIVE PREVIEW          |
|                                       |                          |
| REFERENCE IMAGES                      |  [Preview Card]          |
| +-----------------------------------+ |                          |
| |  [Drop images here or click]      | |  Shows how colors,       |
| +-----------------------------------+ |  lighting, and style     |
| [img1] [img2] [img3] [+ Add]          |  will look together      |
|                                       |                          |
| COLOR PALETTE                         |  Primary: ████           |
| [Extract from Images]                 |  Secondary: ████         |
| Primary:    [■ picker]                |  Accent: ████            |
| Secondary:  [■ picker]                |                          |
| Accent:     [■ picker]                |  Mood: Hopeful           |
| Background: [■ picker]                |  Lighting: Cinematic     |
| Text:       [■ picker]                |                          |
|                                       |                          |
| MOOD                                  |                          |
| [Hopeful ▼] or custom: [____]         |                          |
|                                       |                          |
| LIGHTING STYLE                        |                          |
| (●) Soft Natural    ( ) High-Key      |                          |
| ( ) Dramatic        ( ) Low-Key       |                          |
| ( ) Cinematic                         |                          |
|                                       |                          |
| CAMERA STYLE                          |                          |
| [Cinematic ▼]                         |                          |
|                                       |                          |
|          [Continue to Storyboard]     |                          |
+---------------------------------------+--------------------------+
```

---

## Color Extraction Strategy

### Using node-vibrant (recommended for speed)
```typescript
import Vibrant from 'node-vibrant';

async function extractColors(imagePath: string) {
  const palette = await Vibrant.from(imagePath).getPalette();
  return {
    vibrant: palette.Vibrant?.hex,
    muted: palette.Muted?.hex,
    darkVibrant: palette.DarkVibrant?.hex,
    darkMuted: palette.DarkMuted?.hex,
    lightVibrant: palette.LightVibrant?.hex,
    lightMuted: palette.LightMuted?.hex,
  };
}
```

### Suggest Palette from Extracted Colors
- Primary: Most vibrant color
- Secondary: Muted version or complementary
- Accent: Light vibrant for highlights
- Background: Dark muted or light muted based on mood
- Text: Contrast color for readability

---

## Acceptance Criteria
- [ ] User can upload reference images (drag-drop or file picker)
- [ ] Uploaded images saved to project assets folder
- [ ] User can manually pick colors with color picker
- [ ] User can extract colors from uploaded reference images
- [ ] User can select mood, lighting, and camera preferences
- [ ] Style choices are persisted to project file
- [ ] Live preview updates as user makes changes
- [ ] Cannot proceed until minimum fields are complete
- [ ] Thumbnails generated for all uploaded images
