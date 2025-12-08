# Phase 7: Audio - Add Voice and Music

## Overview
Complete the video by adding audio tracks: AI-generated voiceover narration and AI-generated background music. Mix and master all audio to create the final polished video.

## Input
- Story Brief from Phase 1 (for voiceover script context)
- Style Guide from Phase 2 (for music mood)
- Rough cut video from Phase 6

## Output
- Voiceover narration track (AI TTS)
- Background music track (AI generated)
- Final mixed audio
- Complete video with audio (MP4 H.264)

---

## Requirements (Refined)

- **Voiceover**: AI text-to-speech only (ElevenLabs, OpenAI TTS, etc.)
- **Music**: AI-generated music only (Suno, Udio, etc.)
- **Export Format**: MP4 H.264 only
- **Personal Use**: No productization concerns

---

## Implementation Tasks

### 1. Data Model
- [ ] Create `AudioPhase` and related interfaces in `/src/types/project.ts`
  ```typescript
  interface VoiceoverTrack {
    id: string;
    script: string;
    localPath: string; // ~/launch-video-studio/projects/{id}/assets/audio/voiceover.mp3
    voice: {
      provider: 'elevenlabs' | 'openai';
      voiceId: string;
      name: string;
    };
    settings: {
      speed: number; // 0.5-2.0
      pitch?: number; // provider-specific
      stability?: number; // ElevenLabs
      similarity?: number; // ElevenLabs
    };
    duration: number;
    status: 'generating' | 'completed' | 'failed';
  }

  interface MusicTrack {
    id: string;
    name: string;
    localPath: string;
    source: 'suno' | 'udio';
    prompt: string; // generation prompt
    mood: string;
    duration: number;
    loopable: boolean;
  }

  interface AudioMix {
    voiceoverVolume: number; // 0-100
    musicVolume: number; // 0-100
    musicDucking: boolean; // Auto-lower music during voice
    duckingAmount: number; // How much to duck (0-100)
    fadeInMusic: number; // seconds
    fadeOutMusic: number; // seconds
  }

  interface AudioPhase {
    voiceover: VoiceoverTrack | null;
    music: MusicTrack | null;
    mix: AudioMix;
    finalVideoPath: string | null;
    finalVideoStatus: 'pending' | 'rendering' | 'completed' | 'failed';
    renderProgress: number;
  }
  ```
- [ ] Add `audio: AudioPhase | null` to `Project` interface

### 2. API Routes
- [ ] Create `/api/projects/[id]/audio` route
  - `GET` - Fetch audio phase data
  - `PATCH` - Update audio settings
- [ ] Create `/api/projects/[id]/audio/voiceover` route
  - `POST` - Generate voiceover from script
  - `PATCH` - Update voiceover settings
  - `DELETE` - Remove voiceover
- [ ] Create `/api/projects/[id]/audio/voiceover/script` route
  - `POST` - AI-generate script from story brief
- [ ] Create `/api/projects/[id]/audio/music` route
  - `POST` - Generate music with AI
  - `DELETE` - Remove music
- [ ] Create `/api/projects/[id]/audio/render` route
  - `POST` - Render final video with audio
  - `GET` - Get render progress

### 3. Voice Generation Service
- [ ] Create `/src/lib/services/voice-generation.ts`
- [ ] Support TTS providers:
  - [ ] ElevenLabs (recommended for quality)
  - [ ] OpenAI TTS (faster, cheaper)
- [ ] Implement provider interfaces:
  ```typescript
  interface TTSProvider {
    generateVoiceover(script: string, voice: VoiceConfig): Promise<Buffer>;
    getAvailableVoices(): Promise<Voice[]>;
    previewVoice(voiceId: string, sampleText: string): Promise<Buffer>;
  }
  ```
- [ ] Voice selection with preview
- [ ] Handle long scripts (chunking if needed for ElevenLabs)

### 4. Music Generation Service
- [ ] Create `/src/lib/services/music-generation.ts`
- [ ] Support AI music providers:
  - [ ] Suno AI (recommended)
  - [ ] Udio (alternative)
- [ ] Implement music generation:
  ```typescript
  interface MusicGenerationParams {
    prompt: string; // e.g., "uplifting corporate background music"
    mood: string;
    duration: number; // target duration in seconds
    style?: string;
  }

  async function generateMusic(params: MusicGenerationParams): Promise<MusicTrack>;
  ```
- [ ] Generate music to match video duration
- [ ] Handle API rate limits and generation time

### 5. Script Generation
- [ ] Create `/src/lib/prompts/voiceover-script.ts`
- [ ] Generate narration script from:
  - Story brief (pain, solution, transformation)
  - Storyboard scenes (what's happening)
  - Total duration constraint
- [ ] Script should match video pacing
- [ ] Support different tones (professional, friendly, urgent)
- [ ] Script structure:
  ```typescript
  interface ScriptSection {
    sceneId: string;
    text: string;
    startTime: number;
    endTime: number;
  }
  ```

### 6. UI Components
- [ ] Create `/src/components/audio/` directory
- [ ] `ScriptEditor.tsx` - Write/edit voiceover script
  - Textarea for script
  - Character/word count
  - Estimated duration
  - AI generation button
- [ ] `VoiceSelector.tsx` - Browse and preview voices
  - Provider tabs (ElevenLabs, OpenAI)
  - Voice cards with play button
  - Sample text preview
- [ ] `VoiceoverPlayer.tsx` - Play generated voiceover
  - Waveform visualization
  - Play/pause controls
  - Regenerate button
- [ ] `MusicGenerator.tsx` - Generate AI music
  - Mood selector
  - Duration input
  - Custom prompt field
  - Generate button
- [ ] `MusicPlayer.tsx` - Preview music tracks
  - Waveform visualization
  - Play/pause controls
  - Loop toggle
- [ ] `AudioMixer.tsx` - Volume sliders, ducking controls
  - Voiceover volume slider
  - Music volume slider
  - Ducking toggle and amount
  - Fade in/out controls
- [ ] `WaveformDisplay.tsx` - Visual audio waveform
  - Peaks visualization
  - Playhead indicator
- [ ] `AudioTimeline.tsx` - Audio tracks on timeline
  - Voiceover track
  - Music track
  - Sync with video
- [ ] `FinalPreview.tsx` - Preview video with all audio
  - Full video playback
  - Audio controls
  - Render button

### 7. Page Implementation
- [ ] Create `/src/app/projects/[id]/audio/page.tsx`
- [ ] Layout: Video preview, script editor, audio controls
- [ ] Tabs: Voiceover, Music, Mix
- [ ] Real-time preview with audio
- [ ] Generate AI script button
- [ ] Voice selection with samples
- [ ] Music generation
- [ ] Final render button
- [ ] Export button

### 8. Audio Processing
- [ ] Create `/src/lib/audio-utils.ts`
- [ ] Audio ducking implementation (lower music during voice)
- [ ] Fade in/out effects
- [ ] Normalize audio levels
- [ ] Mix multiple tracks
- [ ] Use FFmpeg for audio mixing:
  ```bash
  ffmpeg -i video.mp4 -i voiceover.mp3 -i music.mp3 \
    -filter_complex "
      [1:a]volume=1.0[voice];
      [2:a]volume=0.3,afade=t=in:d=2,afade=t=out:st=118:d=3[music];
      [voice][music]amix=inputs=2:duration=first[aout]
    " \
    -map 0:v -map "[aout]" -c:v copy -c:a aac final.mp4
  ```

### 9. Final Render Pipeline
- [ ] Combine rough cut video with mixed audio
- [ ] Output format: MP4 H.264 with AAC audio
- [ ] Resolution: Match source (from style guide)
- [ ] Progress tracking with estimates
- [ ] Save to `~/launch-video-studio/projects/{id}/exports/`

### 10. Settings Page Addition
- [ ] Add TTS API keys to app settings:
  - ElevenLabs API key
  - OpenAI API key
- [ ] Add Music API keys:
  - Suno API key (or browser automation)
  - Udio API key

### 11. Validation
- [ ] Video must have at least voiceover OR music
- [ ] Audio levels within acceptable range
- [ ] Final video successfully rendered
- [ ] Create `isAudioPhaseComplete()` function

---

## UI Wireframe

```
+------------------------------------------------------------------+
| <- Back    Project Name                    [Render Final Video]   |
|            Phase 7: Audio                                         |
+------------------------------------------------------------------+
|                        VIDEO PREVIEW                              |
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |                    [Video with Audio]                      |  |
|  |                                                            |  |
|  +------------------------------------------------------------+  |
|  |◀◀  ◀  [▶]  ▶  ▶▶|  01:23 / 02:45  |  🔊 [====●==]          |  |
+------------------------------------------------------------------+
| [Voiceover] [Music] [Mix]                                        |
+------------------------------------------------------------------+
| VOICEOVER                                                         |
|                                                                   |
| Script:                               Voice:                      |
| +---------------------------+         +---------------------+     |
| | In a world where support  |         | [▶] Sarah           |     |
| | tickets pile up faster    |         | Professional, Warm  |     |
| | than solutions arrive...  |         | ElevenLabs          |     |
| |                           |         | [Select]            |     |
| | [Generate AI Script]      |         +---------------------+     |
| +---------------------------+         +---------------------+     |
|                                       | [▶] Onyx            |     |
| Estimated: 45 seconds                 | Deep, Authoritative |     |
|                                       | OpenAI              |     |
| [Generate Voiceover]                  | [Select]            |     |
|                                       +---------------------+     |
| Status: ✓ Generated (42 seconds)                                 |
| [▶ Play] [Re-generate]                                           |
+------------------------------------------------------------------+
| MUSIC                                                             |
|                                                                   |
| Mood: [Uplifting Corporate ▼]                                    |
| Duration: [Match video ▼] (2:45)                                 |
|                                                                   |
| Custom prompt:                                                    |
| [Inspiring background music with soft piano and subtle strings ] |
|                                                                   |
| [Generate Music]                                                  |
|                                                                   |
| Status: ✓ Generated                                               |
| [▶ Play] [Re-generate]                                           |
+------------------------------------------------------------------+
| MIX CONTROLS                                                      |
| Voice: [========●==] 80%    Music: [====●======] 40%             |
| [✓] Auto-duck music during voice   Duck amount: [===●===] 50%    |
| Music fade in: [2s]   Fade out: [3s]                             |
+------------------------------------------------------------------+
|            [Preview with Audio]    [Render Final Video]           |
+------------------------------------------------------------------+
```

---

## Script Generation Prompt Strategy

### Input Context
- Story brief: pain, solution, transformation, emotional stakes
- Scene descriptions from storyboard
- Target duration
- Tone preference

### Script Structure
```
[HOOK - 5-10 seconds]
Grab attention, state the problem

[PROBLEM - 15-30 seconds]
Expand on the pain point
Make it relatable

[SOLUTION - 30-60 seconds]
Introduce the solution
Show the transformation

[BENEFITS - 20-40 seconds]
Highlight key advantages
Build excitement

[CTA - 10-15 seconds]
Clear call to action
Brand mention
```

### Example Script Generation
```typescript
const scriptPrompt = `
You are writing a voiceover script for a ${duration} second video.

Story Brief:
- Pain: ${brief.pain}
- Solution: ${brief.solution}
- Transformation: ${brief.transformation}
- Tone: ${brief.tone || 'professional and warm'}

Write a narration script that:
1. Opens with an attention-grabbing hook
2. Empathizes with the pain point
3. Introduces the solution naturally
4. Highlights the transformation
5. Ends with a clear call to action

The script should be ${Math.round(duration * 2.5)} words (approximately 2.5 words per second).
Write in a conversational, engaging tone.
`;
```

---

## Voice Provider Comparison

| Provider | Quality | Voices | Speed | Cost | Notes |
|----------|---------|--------|-------|------|-------|
| ElevenLabs | Excellent | 100+ | Medium | $$$ | Best quality, cloning |
| OpenAI TTS | Very Good | 6 | Fast | $ | Simple, reliable |

### ElevenLabs Voice IDs (Examples)
- `21m00Tcm4TlvDq8ikWAM` - Rachel (narration)
- `AZnzlk1XvdvUeBnXmlld` - Domi (young female)
- `EXAVITQu4vr4xnSDxMaL` - Bella (soft)
- `ErXwobaYiN019PkySvjV` - Antoni (male)

### OpenAI TTS Voices
- `alloy` - Neutral
- `echo` - Warm male
- `fable` - British
- `onyx` - Deep male
- `nova` - Female
- `shimmer` - Soft female

---

## Music Generation Prompts

### Mood to Prompt Mapping
```typescript
const musicPrompts = {
  'uplifting-corporate': 'Inspiring corporate background music, soft piano, subtle strings, hopeful and professional',
  'tech-innovative': 'Modern electronic background, synth pads, light percussion, futuristic and innovative',
  'emotional-storytelling': 'Cinematic emotional score, building strings, piano, dramatic and heartfelt',
  'friendly-casual': 'Light acoustic background, gentle guitar, warm and friendly atmosphere',
  'urgent-energetic': 'Driving background music, building energy, motivating and dynamic',
};
```

---

## Audio Ducking with FFmpeg

### Ducking Implementation
```bash
# Sidechain compression effect - music ducks when voice is present
ffmpeg -i video.mp4 -i voiceover.mp3 -i music.mp3 \
  -filter_complex "
    [1:a]asplit=2[voice][voiceducka];
    [voiceducka]agate=threshold=-40dB:attack=5:release=100[gate];
    [2:a][gate]sidechaincompress=threshold=0.1:ratio=4:attack=5:release=200[duckedmusic];
    [duckedmusic]volume=0.4,afade=t=in:d=2,afade=t=out:st=118:d=3[music];
    [voice][music]amix=inputs=2:duration=first[aout]
  " \
  -map 0:v -map "[aout]" -c:v copy -c:a aac final.mp4
```

### Simpler Alternative (Volume Automation)
For simpler implementation, pre-analyze voice timing and apply volume automation:
```bash
# Lower music volume during voice sections
ffmpeg -i music.mp3 \
  -af "volume='if(between(t,0,5),0.4,if(between(t,5,45),0.15,0.4))':eval=frame" \
  ducked_music.mp3
```

---

## Acceptance Criteria
- [ ] User can write or AI-generate voiceover script
- [ ] User can select voice and generate voiceover with TTS
- [ ] User can generate AI background music
- [ ] User can adjust volume levels and ducking
- [ ] Audio preview with video works smoothly
- [ ] Final video renders with all audio mixed (MP4 H.264)
- [ ] Progress tracking during render
- [ ] Final video saved to exports folder
- [ ] Project marked as complete after final export
- [ ] API keys configurable in settings
