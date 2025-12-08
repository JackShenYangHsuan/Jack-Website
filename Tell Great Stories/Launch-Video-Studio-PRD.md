# Launch Video Studio — Product Requirements Document

**Version:** 1.1
**Date:** December 6, 2025
**Author:** Jack

### Changelog
- v1.1: Added clarifications from requirements review (video analysis via Gemini, NLE timeline, queue dashboard, local storage, VO script per scene)

---

## 1. Executive Summary

Launch Video Studio is a web application that helps startup founders create high-quality, cinematic launch videos through an AI-guided creative process. The product transforms raw company information into emotionally resonant high quality video content by guiding users through discovery, styling, storyboarding, and AI-powered asset generation.

**Core insight:** Great launch videos (like Anthropic's "Keep Thinking with Claude") work because they follow proven emotional storytelling structures. This product encodes that creative process into an accessible workflow.

---

## 2. Problem Statement

**For founders:**
- Professional launch videos cost $3,000-$8,000 and take 4-8 weeks
- DIY tools produce generic, forgettable content
- Most founders don't know how to structure emotional narratives

**For agencies:**
- Discovery calls are time-consuming
- Translating client input into creative briefs is manual
- Iteration cycles are slow and expensive

**Opportunity:**
- AI can guide the creative process, not just generate assets
- Local video generation (DGX Spark) eliminates per-video costs
- Structured workflows produce consistently better output than freeform generation

---

## 3. Target Users

**Primary:** Startup founders (Seed to Series B)
- Launching products, raising funds, or announcing milestones
- Budget-conscious but quality-aware
- Comfortable with AI tools
- Time-constrained

**Secondary:** Freelance video producers / small agencies
- Looking to accelerate pre-production
- Want to offer more competitive pricing
- Need scalable creative workflows

---

## 4. Product Goals

| Goal | Metric |
|------|--------|
| Reduce video creation time | < 1 week from start to final |
| Lower cost vs. agencies | < $500 total cost per video |
| Produce emotionally resonant content | User satisfaction > 8/10 |
| Enable non-experts to create quality work | No video experience required |

---

## 5. Feature Specification

### Phase 1: Discover

**Goal:** Extract the emotional story from raw company information

**User Flow:**
1. User starts new project
2. Enters company name + tagline
3. Engages in guided chat interview (5-7 questions)
4. Reviews AI-extracted Story Brief
5. Edits/refines as needed
6. Confirms and proceeds

**Interview Questions (example set):**
1. "What is the key message and feeling you want to convery through this video?"
2. "What moment made you realize this problem had to be solved?"
3. "What do your happiest customers say that surprises you?"
4. "What's the thing you do that competitors can't or won't?"
5. "If your product disappeared tomorrow, what would users miss most?"
6. "What call to actions do you want viewers to have after watching this video?"

**AI Behavior:**
- Ask follow-up questions based on responses
- Probe for emotional specificity (e.g., "Tell me more about that frustration...", "Tell me about the grand vision and the world you're trying to create")
- Extract themes, not just facts
- Summarize into structured brief

**Output: Story Brief**
```
- Company: [name]
- Tagline: [one-liner]
- Pain: [raw, visceral description of the problem]
- Solution: [what changes]
- Transformation: [before → after state]
- Emotional Stakes: [who suffers, who triumphs, why it matters]
- Unique Angle: [what makes this story worth telling]
```

**User Controls:**
- Edit any field in Story Brief
- Regenerate individual sections
- Add notes for later phases

**Backend:** OpenRouter API (user-selected model)

---

### Phase 2: Video Style

**Goal:** Define the visual and audio direction

**User Flow:**
1. User pastes reference video URLs (YouTube only)
2. User uploads reference images (mood board)
3. AI analyzes references and extracts style signals
4. User reviews extracted style
5. User confirms or overrides
6. Proceeds to storyboard

**Video Analysis (via Gemini):**
- Backend sends YouTube URL to Gemini API
- Gemini analyzes the video and extracts meta-attributes:
  - What makes this video effective
  - Vibe and emotional tone
  - Pacing and cut rhythm
  - Color palette and grading
  - Shot types and camera movements
  - Music/audio characteristics
- Results displayed as structured style attributes

**Reference Analysis (AI extracts):**
- **Pacing:** Fast cuts / Medium / Slow, contemplative
- **Tone:** Gritty-real / Clean-minimal / Warm-human / Cold-technical / Cerebral-cool
- **Energy:** High-urgent / Building-crescendo / Calm-confident
- **Human Presence:** Real faces / Silhouettes / Hands-only / Abstract-no people
- **Color Feel:** Warm / Cool / High contrast / Muted / Saturated
- **Camera Style:** Handheld-organic / Steady-precise / Dynamic-moving

**Output: Style Guide**
```
- Pacing: [fast/medium/slow]
- Tone: [gritty/clean/warm/cerebral]
- Energy: [high/building/calm]
- Human Presence: [faces/silhouettes/abstract]
- Color Direction: [description]
- Camera Notes: [description]
- Music Direction: [genre, mood, energy arc]
- Reference Summary: [what to emulate from references]
```

**User Controls:**
- Override any extracted attribute
- Add custom notes
- Upload additional references
- Remove references

**Backend:**
- Gemini API for YouTube video analysis
- OpenRouter API (vision-capable model) for image analysis

---

### Phase 3: Storyboard

**Goal:** Plan the scene-by-scene structure

**User Flow:**
1. User selects duration (30 / 60 / 90 seconds)
2. AI generates scene-by-scene breakdown
3. User reviews scene list
4. User edits, reorders, adds, deletes scenes
5. AI generates image prompt + motion prompt per scene
6. User reviews and refines prompts
7. Confirms and proceeds to image generation

**AI Generates:**
- Narrative structure recommendation (tension-release, manifesto, hero journey)
- Scene breakdown with beat labels
- Description, emotional goal, and timing per scene
- Image prompt (for Flux) per scene
- Motion prompt (for Wan 2.2) per scene
- Camera movement suggestion per scene
- **Voiceover script per scene** (narration line + auto-calculated duration based on text length)

**Output: Scene List**
```
Scene 1:
- Beat: Tension
- Duration: 4s
- Description: "Overwhelming flood of notifications"
- Emotional Goal: "Anxiety, pressure, isolation"
- Voiceover Script: "There's never been a worse time to build something new."
- Image Prompt: "Abstract visualization of digital chaos, floating notification bubbles..."
- Motion Prompt: "Slow zoom out, particles multiplying, building chaos"
- Camera: Pull-out

Scene 2:
- Beat: Tension
- Duration: 5s
- Voiceover Script: "The noise is deafening. The competition is relentless."
...
```

**Narrative Structures Available:**
1. **Tension → Release** (like "Keep Thinking")
   - Build anxiety → reframe → resolve
2. **Manifesto**
   - "We believe..." → "While others..." → "We build..."
3. **Hero Journey**
   - Struggle → discovery → transformation
4. **The Reveal**
   - Mystery → clues → full picture

**User Controls:**
- Switch narrative structure (regenerates scenes)
- Edit individual scene descriptions
- Edit image/motion prompts directly
- **Edit voiceover script per scene**
- Reorder scenes (drag-drop)
- Add/delete scenes
- Adjust durations
- Lock scenes to prevent regeneration

**Backend:** OpenRouter API (user-selected model)

---

### Phase 4: Generate Images

**Goal:** Create high-fidelity frame for each scene

**User Flow:**
1. User reviews scene list with prompts
2. Clicks "Generate Images"
3. System queues all scenes for generation
4. Images appear as completed
5. User reviews each: Approve / Regenerate / Edit Prompt
6. Once all approved, proceeds to video generation

**Generation Process:**
1. Web app sends image prompt + style params to ComfyUI
2. ComfyUI runs Flux workflow
3. Returns generated image
4. Display in UI with scene context

**Style Consistency:**
- Global style modifiers injected into all prompts
- Color grading keywords from Style Guide
- Lighting direction from Style Guide
- Negative prompts for consistency (no text, no watermarks, etc.)

**Output:** One approved PNG per scene

**User Controls:**
- Regenerate individual image
- Edit prompt and regenerate
- Upload custom image (override AI)
- Adjust style modifiers globally
- Lock approved images

**Backend:** ComfyUI on Spark (Flux model)

**Technical Details:**
- Resolution: 1280x720 (16:9)
- Format: PNG
- Queue system for batch generation
- Progress indicator per image

---

### Phase 5: Generate Videos

**Goal:** Animate each scene image into video clip

**User Flow:**
1. User reviews approved images
2. User reviews/edits motion prompts per scene
3. Clicks "Generate Videos"
4. System queues all scenes for video generation
5. Videos appear as completed
6. User reviews each: Approve / Regenerate / Edit Motion Prompt
7. Once all approved, proceeds to stitching

**Generation Process:**
1. Web app sends approved image + motion prompt to ComfyUI
2. ComfyUI runs Wan 2.2 image-to-video workflow
3. Returns generated video clip
4. Display in UI with playback

**Motion Prompt Elements:**
- Camera movement (push-in, pull-out, pan, static, orbit)
- Subject motion (if any)
- Atmosphere motion (particles, light, etc.)
- Speed/energy

**Output:** One approved MP4 per scene (3-5 seconds each)

**User Controls:**
- Regenerate individual video
- Edit motion prompt and regenerate
- Adjust clip duration
- Trim start/end of clip
- Upload custom clip (override AI)
- Lock approved clips

**Backend:** ComfyUI on Spark (Wan 2.2 model)

**Technical Details:**
- Resolution: 1280x720
- Frame rate: 24fps
- Duration: 3-5 seconds per clip
- Format: MP4 (H.264)

---

### Phase 6: Stitch (NLE-Lite Timeline)

**Goal:** Assemble clips into continuous video with full editing control

**User Flow:**
1. User sees timeline with all clips in scene order
2. User can reorder clips via drag-drop
3. User trims clip in/out points
4. User selects transition type between clips
5. User adjusts properties with keyframes (opacity, position, scale)
6. User previews assembled video
7. User adjusts as needed
8. Confirms and proceeds to audio

**Transition Options:**
- Cut (instant)
- Fade (cross-dissolve)
- Fade to black
- Custom duration per transition

**Timeline Features (Full NLE-Lite):**
- **Multi-track timeline** (separate video/audio tracks, layer clips)
- **Trim handles** for precise in/out point adjustment
- **Keyframe animation** for properties (opacity, position, scale)
- Drag-drop reorder
- Adjust transition duration
- Preview playback with scrubbing
- Total duration display
- Zoom in/out on timeline

**Output:** Single stitched MP4 (silent)

**User Controls:**
- Reorder clips
- Set transitions
- Trim clips with frame-level precision
- Add keyframes for animated properties
- Layer clips on multiple tracks
- Preview full video
- Export draft (without audio)

**Note:** No undo/redo in MVP -- user can reset to last saved state.

**Backend:** FFmpeg on Spark

**Technical Details:**
- Resolution: 1280x720
- Frame rate: 24fps
- Format: MP4 (H.264)
- Transition rendering via FFmpeg filters
- Keyframe interpolation handled client-side, rendered via FFmpeg

---

### Phase 7: Audio Layer

**Goal:** Add music and narration to final video

**User Flow:**
1. User selects music approach:
   - Browse library (royalty-free tracks)
   - Generate with AI (Suno/Udio)
   - Upload custom track
2. User selects narration approach:
   - No narration
   - Generate with AI (ElevenLabs)
   - Upload custom recording
3. If AI narration: user provides/edits script
4. User previews video with audio
5. User adjusts timing, levels, fade in/out
6. Exports final video

**Music Options:**
- **Library:** Curated royalty-free tracks tagged by mood/energy
- **AI Generate:** Text prompt to Suno/Udio ("cinematic, building tension, electronic")
- **Upload:** User's own track

**Narration Options:**
- **None:** Music only
- **AI Generate:**
  - User provides script (can auto-generate from Story Brief)
  - Select voice (ElevenLabs voices)
  - Generate voiceover
- **Upload:** User's own recording

**Audio Mixing:**
- Music volume adjustment
- Narration volume adjustment
- Music ducking (auto-lower when narration plays)
- Fade in/out on music
- Timing sync with video beats

**Output:** Final MP4 with audio

**User Controls:**
- Select/change music track
- Edit narration script
- Select voice
- Adjust volumes
- Adjust timing
- Preview with audio
- Export final video

**Backend:**
- ElevenLabs API (voiceover)
- Suno/Udio API (music generation)
- FFmpeg (audio mixing and final render)

**Technical Details:**
- Audio: AAC, 48kHz
- Final video: MP4 (H.264 + AAC)
- Resolution: 1280x720 or 1920x1080 (user choice)
- Frame rate: 24fps

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                         (Next.js App)                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL WEB SERVER (Spark)                     │
│                         (Next.js)                               │
│                                                                 │
│   • Project CRUD                                                │
│   • API routing                                                 │
│   • Queue Dashboard                                             │
│   • Settings (OpenRouter API key)                               │
└───────────┬───────────────┬───────────────┬─────────────────────┘
            │               │               │
            ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │OpenRouter│    │ ComfyUI  │    │ External │
     │   API    │    │ (local)  │    │  APIs    │
     │          │    │          │    │          │
     │Phase 1-3 │    │Phase 4-6 │    │ Phase 7  │
     │  LLM     │    │Flux, Wan │    │ElevenLabs│
     │+ Gemini  │    │  FFmpeg  │    │  Suno    │
     └──────────┘    └──────────┘    └──────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │  Local Storage   │
                    │                  │
                    │ ~/launch-video-  │
                    │ studio/projects/ │
                    │   {id}/assets/   │
                    │                  │
                    │ Images, Videos,  │
                    │ Audio, JSON      │
                    └──────────────────┘
```

**Deployment:** Local only (runs on DGX Spark)

**Queue Dashboard:**
- Dedicated view showing all pending/running/completed/failed jobs
- Basic status info: job name, status, progress percentage
- Manual retry button for failed jobs
- Jobs processed sequentially by ComfyUI

---

## 7. Data Model

```typescript
interface User {
  id: string;
  createdAt: Date;
  settings: {
    openRouterApiKey: string;  // User-provided API key
    defaultModel: string;      // OpenRouter model ID
    defaultDuration: 30 | 60 | 90;
  };
}

interface Project {
  id: string;
  userId: string;
  name: string;
  status: 'discover' | 'style' | 'storyboard' | 'images' | 'videos' | 'stitch' | 'audio' | 'complete';
  createdAt: Date;
  updatedAt: Date;

  // Phase 1
  storyBrief: StoryBrief | null;

  // Phase 2
  styleGuide: StyleGuide | null;

  // Phase 3
  storyboard: Storyboard | null;

  // Phase 4-5
  scenes: Scene[];

  // Phase 6
  stitchedVideoUrl: string | null;

  // Phase 7
  audio: AudioConfig | null;
  finalVideoUrl: string | null;
}

interface StoryBrief {
  companyName: string;
  tagline: string;
  pain: string;
  solution: string;
  transformation: string;
  emotionalStakes: string;
  uniqueAngle: string;
  interviewTranscript: Message[];  // Full chat history
}

interface StyleGuide {
  referenceVideoUrls: string[];
  referenceImageUrls: string[];
  extracted: {
    pacing: 'fast' | 'medium' | 'slow';
    tone: 'gritty' | 'clean' | 'warm' | 'cerebral';
    energy: 'high' | 'building' | 'calm';
    humanPresence: 'faces' | 'silhouettes' | 'abstract';
    colorDirection: string;
    cameraStyle: string;
    musicDirection: string;
  };
  userOverrides: Partial<StyleGuide['extracted']>;
  notes: string;
}

interface Storyboard {
  duration: 30 | 60 | 90;
  narrativeStructure: 'tension-release' | 'manifesto' | 'hero-journey' | 'reveal';
  scenes: SceneDefinition[];
}

interface SceneDefinition {
  id: string;
  order: number;
  beat: 'tension' | 'pivot' | 'release' | 'resolve';
  duration: number;
  description: string;
  emotionalGoal: string;
  voiceoverScript: string;  // Narration line for this scene
  imagePrompt: string;
  motionPrompt: string;
  cameraMovement: 'static' | 'push-in' | 'pull-out' | 'pan' | 'orbit';
}

interface Scene {
  id: string;
  definitionId: string;  // links to SceneDefinition

  // Phase 4
  imagePrompt: string;
  imageUrl: string | null;
  imageApproved: boolean;

  // Phase 5
  motionPrompt: string;
  videoUrl: string | null;
  videoApproved: boolean;
  videoDuration: number;

  // Phase 6
  trimStart: number;
  trimEnd: number;
  transitionIn: 'cut' | 'fade' | 'fade-black';
  transitionDuration: number;
}

interface AudioConfig {
  music: {
    type: 'library' | 'generated' | 'uploaded';
    url: string;
    volume: number;  // 0-100
    fadeIn: number;  // seconds
    fadeOut: number;
  };
  narration: {
    enabled: boolean;
    type: 'generated' | 'uploaded';
    script: string;
    voiceId: string;
    url: string;
    volume: number;
  };
}
```

---

## 8. User Interface Structure

**Global Navigation:**
- Project list (sidebar)
- Current project phases (top nav / stepper)
- Settings (account, default model, etc.)

**Phase Screens:**

| Phase | Primary View | Secondary View |
|-------|--------------|----------------|
| 1. Discover | Chat interface | Story Brief panel |
| 2. Style | Reference gallery | Style Guide panel |
| 3. Storyboard | Scene list / timeline | Scene editor |
| 4. Images | Image grid | Prompt editor |
| 5. Videos | Video grid | Motion prompt editor |
| 6. Stitch | Timeline editor | Preview player |
| 7. Audio | Audio controls | Preview player |

**Common Components:**
- Progress stepper (phases 1-7)
- Preview player (video playback)
- Export button (available from Phase 7 -- final video only)
- Model selector (phases 1-3)
- Queue dashboard (dedicated view for job status)
- Settings page (OpenRouter API key configuration)

---

## 9. Non-Functional Requirements

**Performance:**
- Phase 1-3 responses: < 5 seconds
- Image generation: < 60 seconds per image
- Video generation: < 5 minutes per clip
- Final render: < 10 minutes

**Reliability:**
- Auto-save on all user inputs
- Resume interrupted generation jobs
- Show error on failure, manual retry (no auto-retry)

**Security:**
- Single user (no auth in MVP)
- API keys stored locally in settings
- All data stored on local filesystem

**Scalability:**
- Single Spark instance (local only)
- Queue processes jobs sequentially

---

## 10. MVP Scope

**MVP (v0.1):**
- Phase 1-3 only (Discover → Style → Storyboard)
- Export: Story Brief + Style Guide + Scene List (PDF/Markdown)
- No image/video generation
- Single user (no auth)

**v0.2:**
- Add Phase 4 (Image generation)
- ComfyUI integration
- Basic auth

**v0.3:**
- Add Phase 5-6 (Video generation + Stitch)
- Timeline editor

**v1.0:**
- Add Phase 7 (Audio)
- Polish, multi-user, billing

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Time to first storyboard | < 30 minutes |
| Time to final video | < 4 hours |
| User satisfaction (NPS) | > 50 |
| Cost per video (compute) | < $5 |
| Completion rate (start → export) | > 60% |

---

## 12. Open Questions

1. **Pricing model:** Per project? Subscription? Credits? (future consideration)
2. **Multi-user:** Team projects / collaboration? (future consideration)
3. ~~**Templates:** Pre-built narrative templates?~~ → **Decided: No templates for MVP**
4. ~~**Export formats:** Aspect ratios for social?~~ → **Decided: 16:9 only for MVP**
5. **Revision history:** Version control on projects?
6. **Feedback loop:** How to improve prompts based on user regenerations?

---

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ComfyUI/Spark downtime | Can't generate assets | Queue dashboard shows status; manual retry |
| Inconsistent style across scenes | Poor quality output | Global prompt prefix; user approval gates |
| Long generation times | Poor UX | Queue dashboard with progress; per-scene regeneration only |
| High API costs (OpenRouter) | User cost | User provides own API key; model selection |
| Copyright (music) | Legal risk | AI-generated music only (Suno) |

---

## 14. Future Roadmap

**v1.x:**
- Additional aspect ratios (9:16 vertical, 1:1 square)
- More narrative structures
- Custom voice cloning (ElevenLabs)
- Longer videos (2-3 minutes)

**v2.0:**
- Collaboration (team projects)
- Agency dashboard
- White-label option
- API access

**v3.0:**
- Real-time preview (no generation wait)
- Interactive style transfer
- Multi-language support
- Mobile app

---

## Appendix A: Key Design Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Video Analysis** | Gemini API for YouTube URLs | Native video understanding, no frame extraction needed |
| **Discovery UX** | Real-time chat, no skip | Forces deep engagement, better story extraction |
| **VO Script** | Per-scene in storyboard | Tighter coupling between visuals and narration |
| **Style Consistency** | Global prompt prefix | Simple, effective, no extra compute |
| **Timeline Editor** | Full NLE-lite (multi-track, keyframes) | Professional-grade control for final polish |
| **Async Generation** | Queue dashboard | Clear visibility into job status |
| **Storage** | Local filesystem (`~/launch-video-studio/projects/{id}/`) | Simple, no cloud dependencies |
| **Frontend** | Next.js (React) | Modern, good DX, component ecosystem |
| **LLM Access** | OpenRouter with user API key | User controls costs, model flexibility |
| **Regeneration** | Per-scene only | Prevents accidental bulk operations |
| **Error Handling** | Show error, manual retry | User stays in control |
| **Exports** | Final video only | Keep scope focused |
| **Aspect Ratio** | 16:9 only for MVP | Standard format, add others later |
| **Undo/Redo** | No (reset to last save) | Reduce complexity |
| **Templates** | No templates | Every project starts fresh |
| **Deployment** | Local Spark only | No cloud infrastructure needed |
| **Watermark** | No watermark | Clean output from start |

---

## Appendix B: Example Prompts

**Phase 1 System Prompt (Discovery Interview):**
```
You are a creative director conducting a discovery interview for a startup launch video. Your goal is to extract the emotional truth of the company's story--not marketing speak.

Ask one question at a time. Listen carefully. Follow up on emotional cues. Dig deeper when answers are generic.

After 5-7 questions, summarize into a Story Brief with:
- Pain (raw, visceral)
- Solution
- Transformation (before → after)
- Emotional Stakes
- Unique Angle

Be warm but probing. You're helping them find the story they didn't know they had.
```

**Phase 3 System Prompt (Scene Generation):**
```
You are a video director creating a shot list for a {duration}-second launch video.

Narrative structure: {structure_type}
Story Brief: {story_brief}
Style Guide: {style_guide}

Generate a scene-by-scene breakdown. Each scene needs:
- Beat label (tension/pivot/release/resolve)
- Duration in seconds
- Visual description
- Emotional goal
- Image prompt (for Flux image generation)
- Motion prompt (for Wan 2.2 video generation)
- Camera movement

Create {num_scenes} scenes that build emotionally and tell a cohesive story.
```

---

## Appendix C: ComfyUI Workflow Templates

**Image Generation (Flux):**
- Input: prompt, negative_prompt, width, height, seed
- Output: PNG image

**Video Generation (Wan 2.2):**
- Input: image, motion_prompt, duration, fps
- Output: MP4 video

**Stitching (FFmpeg):**
- Input: list of video files, transition specs
- Output: single MP4

---

*End of PRD*
